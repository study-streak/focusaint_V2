import {
  generateQuizQuestions,
  saveQuizResult,
  getQuizAnalytics,
} from "../services/quizService.js"
import {
  checkTokenLimit,
  trackTokenUsage,
  estimateTokenCount,
} from "../services/tokenTracking.js"
import HabitSession from "../models/HabitSession.js"
import User from "../models/User.js"
import { updateStreak } from "./habit.controller.js"

/**
 * Generate quiz questions from study materials
 */
export const generateQuiz = async (req, res) => {
  try {
    // Check token limit
    const tokenCheck = await checkTokenLimit(req.user.id)
    if (!tokenCheck.allowed) {
      return res.status(403).json({
        error: "TOKEN_LIMIT_EXCEEDED",
        message: "Daily LLM token limit exceeded. Resets at midnight UTC.",
        details: {
          used: tokenCheck.limit - tokenCheck.remaining,
          limit: tokenCheck.limit,
          resetAt: tokenCheck.resetAt,
        },
      })
    }

    const { videoUrl, questionCount = 5 } = req.body

    if (!videoUrl || typeof videoUrl !== "string") {
      return res.status(400).json({ error: "videoUrl is required" })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return res.status(503).json({
        error: "AI backend is not configured. Set GEMINI_API_KEY in backend environment.",
      })
    }

    // Fetch video metadata
    const metadata = await fetchYouTubeMetadata(videoUrl)

    // Generate quiz questions
    const questions = await generateQuizQuestions({
      apiKey,
      videoUrl,
      metadata,
      questionCount: Math.min(Math.max(questionCount, 3), 10), // 3-10 questions
    })

    // Track token usage
    const tokensUsed = estimateTokenCount(JSON.stringify(questions))
    await trackTokenUsage(req.user.id, tokensUsed, "quiz_generation")

    return res.json({
      questions,
      metadata,
    })
  } catch (error) {
    console.error("Quiz generation error:", error)
    return res.status(500).json({ error: "Failed to generate quiz" })
  }
}

/**
 * Submit quiz answers and get results
 */
export const submitQuiz = async (req, res) => {
  try {
    const { questions, sessionId } = req.body

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Questions array is required" })
    }

    // Validate each question has required fields
    const validQuestions = questions.every(
      (q) =>
        q.question &&
        Array.isArray(q.options) &&
        typeof q.correctAnswer === "number" &&
        typeof q.userAnswer === "number"
    )

    if (!validQuestions) {
      return res.status(400).json({ error: "Invalid question format" })
    }

    // Calculate results
    const questionsWithResults = questions.map((q) => ({
      ...q,
      isCorrect: q.userAnswer === q.correctAnswer,
    }))

    // Save to database
    const quizResult = await saveQuizResult(req.user.id, {
      questions: questionsWithResults,
      sessionId,
    })

    // If sessionId is provided, mark session as completed and update streak/stats
    if (sessionId) {
      const session = await HabitSession.findById(sessionId)
      if (session && session.status === "awaiting_quiz") {
        session.status = "completed"
        await session.save()

        // Update streak
        await updateStreak(req.user.id)

        // Update user stats
        const user = await User.findById(req.user.id)
        user.totalSessions += 1
        user.lastSessionDate = new Date()
        await user.save()
      }
    }

    return res.json({
      quizId: quizResult._id,
      score: quizResult.score,
      correctAnswers: quizResult.correctAnswers,
      totalQuestions: quizResult.totalQuestions,
      questions: questionsWithResults,
      sessionStatus: sessionId ? "completed" : undefined,
    })
  } catch (error) {
    console.error("Quiz submission error:", error)
    return res.status(500).json({ error: "Failed to submit quiz" })
  }
}

/**
 * Get quiz performance analytics
 */
export const getAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30

    const analytics = await getQuizAnalytics(req.user.id, days)

    return res.json(analytics)
  } catch (error) {
    console.error("Quiz analytics error:", error)
    return res.status(500).json({ error: "Failed to fetch quiz analytics" })
  }
}

/**
 * Get quiz history
 */
export const getQuizHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10
    const skip = parseInt(req.query.skip) || 0

    const QuizResult = (await import("../models/QuizResult.js")).default

    const results = await QuizResult.find({ userId: req.user.id })
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await QuizResult.countDocuments({ userId: req.user.id })

    return res.json({
      results,
      total,
      hasMore: skip + limit < total,
    })
  } catch (error) {
    console.error("Quiz history error:", error)
    return res.status(500).json({ error: "Failed to fetch quiz history" })
  }
}

// Helper function
async function fetchYouTubeMetadata(videoUrl) {
  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`
    const response = await fetch(endpoint)

    if (!response.ok) {
      return { title: "Unknown title", authorName: "Unknown creator" }
    }

    const data = await response.json()
    return {
      title: data?.title || "Unknown title",
      authorName: data?.author_name || "Unknown creator",
    }
  } catch {
    return { title: "Unknown title", authorName: "Unknown creator" }
  }
}

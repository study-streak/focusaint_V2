import QuizResult from "../models/QuizResult.js"
import { callLLM } from "./llmLayer.js"

/**
 * Generate quiz questions with multiple choice options from study materials
 * @param {Object} params - Quiz generation parameters
 * @param {string} params.apiKey - Gemini API key
 * @param {string} params.videoUrl - YouTube video URL
 * @param {Object} params.metadata - Video metadata
 * @param {number} params.questionCount - Number of questions to generate (default: 5)
 * @returns {Promise<Array>} Array of quiz questions with options
 */
export async function generateQuizQuestions({ apiKey, videoUrl, metadata, questionCount = 5 }) {
  const systemPrompt = `You are an expert quiz creator. Generate multiple choice quiz questions based on study materials.
Return strict JSON only with this schema:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": number (0-3, index of correct option),
      "explanation": "string"
    }
  ]
}
Create ${questionCount} questions that test understanding, not just memorization.`

  const userPrompt = [
    "Create a quiz for this YouTube video.",
    `Video URL: ${videoUrl}`,
    `Video title: ${metadata.title}`,
    `Creator: ${metadata.authorName}`,
    `Generate exactly ${questionCount} multiple choice questions with 4 options each.`,
    "Make questions progressively challenging.",
    "Ensure options are plausible but only one is clearly correct.",
  ].join("\n")

  const result = await callLLM({
    apiKey,
    expectJson: true,
    systemPrompt,
    userPrompt,
  })

  try {
    const questions = result?.questions || []
    return normalizeQuizQuestions(questions, questionCount)
  } catch (error) {
    console.error("Failed to parse quiz questions:", error)
    return generateFallbackQuestions(questionCount)
  }
}

/**
 * Validate and normalize quiz questions
 */
function normalizeQuizQuestions(questions, count) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return generateFallbackQuestions(count)
  }

  const normalized = questions
    .filter((q) => {
      return (
        q &&
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctAnswer === "number" &&
        q.correctAnswer >= 0 &&
        q.correctAnswer < 4
      )
    })
    .map((q) => ({
      question: q.question.trim(),
      options: q.options.map((opt) => String(opt).trim()),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || "Review the material for more details.",
    }))
    .slice(0, count)

  if (normalized.length === 0) {
    return generateFallbackQuestions(count)
  }

  return normalized
}

/**
 * Generate fallback questions when AI generation fails
 */
function generateFallbackQuestions(count) {
  const fallback = [
    {
      question: "What is the main topic covered in this study material?",
      options: [
        "Core concepts and fundamentals",
        "Advanced techniques only",
        "Historical background",
        "Future predictions",
      ],
      correctAnswer: 0,
      explanation: "The material focuses on core concepts and fundamentals.",
    },
    {
      question: "Which approach is most effective for learning this material?",
      options: [
        "Passive reading only",
        "Active practice and application",
        "Memorization without understanding",
        "Skipping difficult sections",
      ],
      correctAnswer: 1,
      explanation: "Active practice and application lead to better retention.",
    },
    {
      question: "What is a key takeaway from this study session?",
      options: [
        "Understanding the underlying principles",
        "Memorizing every detail",
        "Rushing through content",
        "Avoiding challenging topics",
      ],
      correctAnswer: 0,
      explanation: "Understanding principles is more valuable than memorization.",
    },
    {
      question: "How should you review this material for best retention?",
      options: [
        "Once is enough",
        "Spaced repetition over time",
        "Cramming before tests",
        "Never review",
      ],
      correctAnswer: 1,
      explanation: "Spaced repetition is scientifically proven to improve retention.",
    },
    {
      question: "What indicates effective learning from this material?",
      options: [
        "Ability to explain concepts to others",
        "Reading it multiple times",
        "Highlighting everything",
        "Copying notes verbatim",
      ],
      correctAnswer: 0,
      explanation: "Being able to teach others demonstrates true understanding.",
    },
  ]

  return fallback.slice(0, count)
}

/**
 * Save quiz results to database
 */
export async function saveQuizResult(userId, quizData) {
  const { questions, sessionId } = quizData

  const correctAnswers = questions.filter((q) => q.isCorrect).length
  const totalQuestions = questions.length
  const score = Math.round((correctAnswers / totalQuestions) * 100)

  const quizResult = new QuizResult({
    userId,
    sessionId: sessionId || null,
    questions,
    score,
    totalQuestions,
    correctAnswers,
    completedAt: new Date(),
  })

  await quizResult.save()
  return quizResult
}

/**
 * Get quiz performance analytics for a user
 */
export async function getQuizAnalytics(userId, days = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const results = await QuizResult.find({
    userId,
    completedAt: { $gte: startDate },
  })
    .sort({ completedAt: -1 })
    .lean()

  if (results.length === 0) {
    return {
      totalQuizzes: 0,
      averageScore: 0,
      bestScore: 0,
      recentTrend: "neutral",
      history: [],
    }
  }

  const totalQuizzes = results.length
  const averageScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalQuizzes)
  const bestScore = Math.max(...results.map((r) => r.score))

  // Calculate trend (last 5 vs previous 5)
  let recentTrend = "neutral"
  if (totalQuizzes >= 10) {
    const recent5 = results.slice(0, 5).reduce((sum, r) => sum + r.score, 0) / 5
    const previous5 = results.slice(5, 10).reduce((sum, r) => sum + r.score, 0) / 5
    if (recent5 > previous5 + 5) recentTrend = "improving"
    else if (recent5 < previous5 - 5) recentTrend = "declining"
  }

  return {
    totalQuizzes,
    averageScore,
    bestScore,
    recentTrend,
    history: results.map((r) => ({
      score: r.score,
      date: r.completedAt,
      totalQuestions: r.totalQuestions,
      correctAnswers: r.correctAnswers,
    })),
  }
}



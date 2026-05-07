import {
  checkTokenLimit,
  trackTokenUsage,
  estimateTokenCount,
  getTokenUsageStats,
} from "../services/tokenTracking.js"
import { callLLM } from "../services/llmLayer.js"

/**
 * Get token usage information
 */
export const getTokenUsage = async (req, res) => {
  try {
    const tokenCheck = await checkTokenLimit(req.user.id)
    const stats = await getTokenUsageStats(req.user.id, 30)

    return res.json({
      current: {
        used: tokenCheck.limit - tokenCheck.remaining,
        remaining: tokenCheck.remaining,
        limit: tokenCheck.limit,
        resetAt: tokenCheck.resetAt,
      },
      stats: {
        last30Days: stats.total,
        history: stats.history,
      },
    })
  } catch (error) {
    console.error("Token usage fetch error:", error)
    return res.status(500).json({ error: "Failed to fetch token usage" })
  }
}

/**
 * Study assistant endpoint
 */
export const studyAssistant = async (req, res) => {
  try {
    // Check token limit before processing
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

    const { mode = "analyze", videoUrl = "", message = "", summary = [] } = req.body || {}

    if (!videoUrl || typeof videoUrl !== "string") {
      return res.status(400).json({ error: "videoUrl is required" })
    }

    const isBedrockConfigured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    const isGeminiConfigured = !!process.env.GEMINI_API_KEY

    if (!isBedrockConfigured && !isGeminiConfigured) {
      return res.status(503).json({
        error: "AI backend is not configured. Set AWS Bedrock or GEMINI_API_KEY in backend environment.",
      })
    }

    const apiKey = process.env.GEMINI_API_KEY || "BEDROCK" // Placeholder for Gemini compat
    const metadata = await fetchYouTubeMetadata(videoUrl)

    if (mode === "chat") {
      const chatReply = await generateChatReply({
        apiKey,
        videoUrl,
        message,
        summary,
        metadata,
        userId: req.user.id
      })

      // Track token usage
      const tokensUsed = estimateTokenCount(message + chatReply)
      await trackTokenUsage(req.user.id, tokensUsed, "study_coach")

      return res.json({ reply: chatReply })
    }

    const studyPack = await generateStudyPack({
      apiKey,
      videoUrl,
      metadata,
      userId: req.user.id
    })

    // Track token usage for study pack generation
    const tokensUsed = estimateTokenCount(JSON.stringify(studyPack))
    await trackTokenUsage(req.user.id, tokensUsed, "quiz_generation")

    return res.json(studyPack)
  } catch (error) {
    if (error.message && error.message.includes("TOKEN_LIMIT_EXCEEDED")) {
      return res.status(403).json({ error: "TOKEN_LIMIT_EXCEEDED", message: error.message })
    }
    console.error("AI study-assistant error:", error)
    return res.status(500).json({ error: "Failed to generate AI response" })
  }
}

/**
 * Generate study pack
 */
export const generateStudyPackEndpoint = async (req, res) => {
  try {
    const base = await getBaseRequestContext(req, res)
    if (!base) return

    const studyPack = await generateStudyPack(base)
    return res.json(studyPack)
  } catch (error) {
    if (error.message && error.message.includes("TOKEN_LIMIT_EXCEEDED")) {
      return res.status(403).json({ error: "TOKEN_LIMIT_EXCEEDED", message: error.message })
    }
    console.error("AI study-pack error:", error)
    return res.status(500).json({ error: "Failed to generate study pack" })
  }
}

/**
 * Generate summary
 */
export const generateSummary = async (req, res) => {
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

    const base = await getBaseRequestContext(req, res)
    if (!base) return

    const studyPack = await generateStudyPack(base)

    // Track token usage
    const tokensUsed = estimateTokenCount(JSON.stringify(studyPack.summary))
    await trackTokenUsage(req.user.id, tokensUsed, "note_summary")

    return res.json({ summary: studyPack.summary })
  } catch (error) {
    if (error.message && error.message.includes("TOKEN_LIMIT_EXCEEDED")) {
      return res.status(403).json({ error: "TOKEN_LIMIT_EXCEEDED", message: error.message })
    }
    console.error("AI summary error:", error)
    return res.status(500).json({ error: "Failed to generate summary" })
  }
}

/**
 * Generate quiz
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

    const base = await getBaseRequestContext(req, res)
    if (!base) return

    const studyPack = await generateStudyPack(base)

    // Track token usage
    const tokensUsed = estimateTokenCount(JSON.stringify(studyPack.quiz))
    await trackTokenUsage(req.user.id, tokensUsed, "quiz_generation")

    return res.json({ quiz: studyPack.quiz })
  } catch (error) {
    if (error.message && error.message.includes("TOKEN_LIMIT_EXCEEDED")) {
      return res.status(403).json({ error: "TOKEN_LIMIT_EXCEEDED", message: error.message })
    }
    console.error("AI quiz error:", error)
    return res.status(500).json({ error: "Failed to generate quiz" })
  }
}

/**
 * Generate flashcards
 */
export const generateFlashcards = async (req, res) => {
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

    const base = await getBaseRequestContext(req, res)
    if (!base) return

    const studyPack = await generateStudyPack(base)

    // Track token usage
    const tokensUsed = estimateTokenCount(JSON.stringify(studyPack.flashcards))
    await trackTokenUsage(req.user.id, tokensUsed, "quiz_generation")

    return res.json({ flashcards: studyPack.flashcards })
  } catch (error) {
    if (error.message && error.message.includes("TOKEN_LIMIT_EXCEEDED")) {
      return res.status(403).json({ error: "TOKEN_LIMIT_EXCEEDED", message: error.message })
    }
    console.error("AI flashcards error:", error)
    return res.status(500).json({ error: "Failed to generate flashcards" })
  }
}

/**
 * Generate infographics
 */
export const generateInfographics = async (req, res) => {
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

    const base = await getBaseRequestContext(req, res)
    if (!base) return

    const studyPack = await generateStudyPack(base)

    // Track token usage
    const tokensUsed = estimateTokenCount(JSON.stringify(studyPack.infographics))
    await trackTokenUsage(req.user.id, tokensUsed, "recommendations")

    return res.json({ infographics: studyPack.infographics })
  } catch (error) {
    if (error.message && error.message.includes("TOKEN_LIMIT_EXCEEDED")) {
      return res.status(403).json({ error: "TOKEN_LIMIT_EXCEEDED", message: error.message })
    }
    console.error("AI infographics error:", error)
    return res.status(500).json({ error: "Failed to generate infographics" })
  }
}

/**
 * Chat endpoint
 */
export const chat = async (req, res) => {
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

    const base = await getBaseRequestContext(req, res)
    if (!base) return

    const { message = "", summary = [] } = req.body || {}
    const reply = await generateChatReply({
      ...base,
      message,
      summary,
      userId: req.user.id
    })

    // Track token usage
    const tokensUsed = estimateTokenCount(message + reply)
    await trackTokenUsage(req.user.id, tokensUsed, "study_coach")

    return res.json({ reply })
  } catch (error) {
    if (error.message && error.message.includes("TOKEN_LIMIT_EXCEEDED")) {
      return res.status(403).json({ error: "TOKEN_LIMIT_EXCEEDED", message: error.message })
    }
    console.error("AI chat error:", error)
    return res.status(500).json({ error: "Failed to generate chat response" })
  }
}

// Helper functions

async function getBaseRequestContext(req, res) {
  const { videoUrl = "" } = req.body || {}

  if (!videoUrl || typeof videoUrl !== "string") {
    res.status(400).json({ error: "videoUrl is required" })
    return null
  }

  const isBedrockConfigured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  const isGeminiConfigured = !!process.env.GEMINI_API_KEY

  if (!isBedrockConfigured && !isGeminiConfigured) {
    res.status(503).json({
      error: "AI backend is not configured. Set AWS Bedrock or GEMINI_API_KEY in backend environment.",
    })
    return null
  }

  const apiKey = process.env.GEMINI_API_KEY || "BEDROCK"
  const metadata = await fetchYouTubeMetadata(videoUrl)
  return { apiKey, videoUrl, metadata, userId: req.user.id }
}

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

async function generateStudyPack({ apiKey, videoUrl, metadata, userId }) {
  const result = await callLLM({
    apiKey,
    userId,
    expectJson: true,
    taskType: "quiz_generation",
    systemPrompt:
      "You are an expert study assistant. Return strict JSON only with this schema: {summary: string[3..6], quiz: string[3..6], flashcards: {front:string,back:string}[3..6], infographics: string[2..4]}. Be concise and practical.",
    userPrompt: [
      "Create a study pack for this YouTube video.",
      `Video URL: ${videoUrl}`,
      `Video title: ${metadata.title}`,
      `Creator: ${metadata.authorName}`,
      "If exact content is uncertain, clearly infer likely learning points from title/context and keep them useful.",
    ].join("\n"),
  })

  return normalizeStudyPack(result)
}

async function generateChatReply({ apiKey, videoUrl, message, summary, metadata, userId }) {
  if (!message || typeof message !== "string") {
    return "Please ask a question about this study session."
  }

  // 🧠 Intelligent Context Compression
  let compressedSummary = JSON.stringify(Array.isArray(summary) ? summary : [])
  if (compressedSummary.length > 3000) {
    console.log("[AI] Compressing large summary context to save tokens...")
    const compressed = await callLLM({
      apiKey,
      expectJson: false,
      systemPrompt: "Summarize this study context into a high-density conceptual map. Keep only the most important technical terms and concepts. Output as a short bulleted list.",
      userPrompt: compressedSummary,
      userId
    })
    compressedSummary = compressed
  }

  const result = await callLLM({
    apiKey,
    userId,
    expectJson: false,
    taskType: "chat",
    systemPrompt:
      "You are a concise learning coach. Answer in 2-6 lines. Use bullet points only when useful.",
    userPrompt: [
      "You are helping with this YouTube study session.",
      `Video URL: ${videoUrl}`,
      `Video title: ${metadata.title}`,
      `Creator: ${metadata.authorName}`,
      `Current summary context: ${compressedSummary}`,
      `User question: ${message}`,
    ].join("\n"),
  })

  return typeof result === "string" ? result : "I can help break this down—ask me about concepts, examples, or revision strategy."
}

function normalizeStudyPack(input) {
  const fallback = {
    summary: [
      "Video study pack generated with limited context.",
      "Watch actively and write one key takeaway every 5-10 minutes.",
      "Use the quiz and flash cards to reinforce retention.",
    ],
    quiz: [
      "What is the primary concept explained in this video?",
      "Which example best demonstrates the core idea?",
      "How would you apply this in your own project/study workflow?",
    ],
    flashcards: [
      { front: "Main concept", back: "Write the concept in one sentence." },
      { front: "Key example", back: "Describe why it works." },
      { front: "Common pitfall", back: "Explain how to avoid it." },
    ],
    infographics: [
      "Concept map: core topic and connected sub-topics.",
      "Flow diagram: steps from input to outcome.",
    ],
  }

  if (!input || typeof input !== "object") return fallback

  return {
    summary: normalizeStringArray(input.summary, fallback.summary),
    quiz: normalizeStringArray(input.quiz, fallback.quiz),
    flashcards: normalizeFlashcards(input.flashcards, fallback.flashcards),
    infographics: normalizeStringArray(input.infographics, fallback.infographics),
  }
}

function normalizeStringArray(value, fallback) {
  if (!Array.isArray(value)) return fallback
  const cleaned = value.filter((item) => typeof item === "string" && item.trim().length > 0)
  return cleaned.length ? cleaned.slice(0, 6) : fallback
}

function normalizeFlashcards(value, fallback) {
  if (!Array.isArray(value)) return fallback
  const cleaned = value
    .map((item) => ({ front: item?.front, back: item?.back }))
    .filter((item) => typeof item.front === "string" && typeof item.back === "string")
    .slice(0, 6)

  return cleaned.length ? cleaned : fallback
}

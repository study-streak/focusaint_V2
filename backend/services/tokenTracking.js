import User from "../models/User.js"
import LLMTokenUsage from "../models/LLMTokenUsage.js"

// Token limits by tier
const TOKEN_LIMITS = {
  free: 1000,
  premium: 10000,
}

/**
 * Check if user has sufficient tokens for a request
 * @param {string} userId - User ID
 * @returns {Promise<{allowed: boolean, remaining: number, limit: number, resetAt: Date}>}
 */
export async function checkTokenLimit(userId) {
  const user = await User.findById(userId)
  if (!user) {
    throw new Error("User not found")
  }

  // Check if we need to reset daily tokens
  const now = new Date()
  const lastReset = new Date(user.lastTokenReset)
  const shouldReset = now.toDateString() !== lastReset.toDateString()

  if (shouldReset) {
    user.dailyLLMTokens = 0
    user.lastTokenReset = now
    await user.save()
  }

  const limit = TOKEN_LIMITS[user.subscriptionTier] || TOKEN_LIMITS.free
  const remaining = Math.max(0, limit - user.dailyLLMTokens)
  const allowed = remaining > 0

  // Calculate reset time (midnight UTC)
  const resetAt = new Date(now)
  resetAt.setUTCHours(24, 0, 0, 0)

  return {
    allowed,
    remaining,
    limit,
    resetAt,
  }
}

/**
 * Estimate token count from text
 * Rough estimation: ~4 characters per token
 * @param {string} text - Text to estimate
 * @returns {number} Estimated token count
 */
export function estimateTokenCount(text) {
  if (!text || typeof text !== "string") return 0
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4)
}

/**
 * Track token usage for an AI request
 * @param {string} userId - User ID
 * @param {number} tokensUsed - Number of tokens consumed
 * @param {string} feature - Feature name (study_coach, quiz_generation, etc.)
 * @returns {Promise<void>}
 */
export async function trackTokenUsage(userId, tokensUsed, feature) {
  if (!userId || !tokensUsed || tokensUsed <= 0) {
    return
  }

  // Update user's daily token count
  const user = await User.findById(userId)
  if (!user) {
    throw new Error("User not found")
  }

  user.dailyLLMTokens += tokensUsed
  await user.save()

  // Log usage in LLMTokenUsage collection
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  await LLMTokenUsage.create({
    userId,
    date: today,
    tokensUsed,
    requestCount: 1,
    feature,
  })
}

/**
 * Get user's token usage statistics
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back (default: 30)
 * @returns {Promise<{daily: number, total: number, history: Array}>}
 */
export async function getTokenUsageStats(userId, days = 30) {
  const user = await User.findById(userId)
  if (!user) {
    throw new Error("User not found")
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setUTCHours(0, 0, 0, 0)

  const history = await LLMTokenUsage.find({
    userId,
    date: { $gte: startDate },
  })
    .sort({ date: -1 })
    .lean()

  const total = history.reduce((sum, record) => sum + record.tokensUsed, 0)

  return {
    daily: user.dailyLLMTokens,
    total,
    history,
  }
}

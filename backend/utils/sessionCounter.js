import User from "../models/User.js"

/**
 * Check if daily session reset is needed and reset counter if necessary
 * @param {Object} user - User document
 * @returns {Promise<Object>} Updated user document
 */
export async function checkAndResetDailyCounter(user) {
  const now = new Date()
  const lastReset = new Date(user.lastSessionReset)
  
  // Check if we've crossed UTC midnight since last reset
  const nowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const lastResetUTC = new Date(Date.UTC(lastReset.getUTCFullYear(), lastReset.getUTCMonth(), lastReset.getUTCDate()))
  
  if (nowUTC > lastResetUTC) {
    user.dailySessionCount = 0
    user.lastSessionReset = now
    await user.save()
  }
  
  return user
}

/**
 * Increment daily session counter for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated user document
 */
export async function incrementSessionCounter(userId) {
  const user = await User.findById(userId)
  
  if (!user) {
    throw new Error("User not found")
  }
  
  // Check and reset if needed
  await checkAndResetDailyCounter(user)
  
  // Increment counter
  user.dailySessionCount += 1
  await user.save()
  
  return user
}

/**
 * Check if user has reached their daily session limit
 * @param {Object} user - User document
 * @returns {Promise<Object>} { allowed: boolean, remaining: number, limit: number }
 */
export async function checkSessionLimit(user) {
  // Check and reset if needed
  await checkAndResetDailyCounter(user)
  
  // Premium and Pro users have unlimited sessions
  if (user.subscriptionTier === "premium" || user.subscriptionTier === "pro") {
    return {
      allowed: true,
      remaining: -1, // -1 indicates unlimited
      limit: -1,
    }
  }
  
  // Free users have 3 sessions per day
  const FREE_TIER_LIMIT = 3
  const remaining = Math.max(0, FREE_TIER_LIMIT - user.dailySessionCount)
  
  return {
    allowed: user.dailySessionCount < FREE_TIER_LIMIT,
    remaining,
    limit: FREE_TIER_LIMIT,
  }
}

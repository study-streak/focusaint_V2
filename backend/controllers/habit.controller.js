import mongoose from "mongoose"
import HabitSession from "../models/HabitSession.js"
import StreakRecord from "../models/StreakRecord.js"
import User from "../models/User.js"
import { connectToMongo } from "../utils/db.js"
import { checkSessionLimit, incrementSessionCounter } from "../utils/sessionCounter.js"
import { checkFeatureAccess } from "../utils/featureAvailability.js"
import { SessionLimitError, TierRestrictionError } from "../utils/errors.js"

/**
 * Start a new habit session
 */
export const startSession = async (req, res, next) => {
  try {
    await connectToMongo()

    const { minDurationMinutes = 25 } = req.body

    // Get user to check session limit
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Check for Deep Mode access if requested
    const { mode = "habit" } = req.body
    if (mode === "deep") {
      const access = checkFeatureAccess("deep_mode", user.subscriptionTier)
      if (!access.allowed) {
        throw access.error
      }
    }

    // Check session limit for free tier users
    const limitCheck = await checkSessionLimit(user)
    if (!limitCheck.allowed) {
      const resetAt = new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString()
      throw new SessionLimitError(user.dailySessionCount, limitCheck.limit, resetAt)
    }

    // Check if session already active today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existingSession = await HabitSession.findOne({
      userId: req.user.userId,
      sessionDate: { $gte: today },
      status: "active",
    })

    if (existingSession) {
      return res.status(400).json({ error: "Session already active today" })
    }

    const session = await HabitSession.create({
      userId: req.user.userId,
      startTime: new Date(),
      sessionDate: today,
      status: "active",
    })

    // Increment session counter
    await incrementSessionCounter(req.user.userId)

    res.status(201).json({
      message: "Habit session started",
      session,
      sessionLimit: {
        remaining: limitCheck.remaining - 1,
        limit: limitCheck.limit,
      },
    })
  } catch (error) {
    console.error("Start session error:", error)
    next(error)
  }
}

/**
 * End an active habit session
 */
export const endSession = async (req, res) => {
  try {
    await connectToMongo()

    const { sessionId } = req.params

    const session = await HabitSession.findOne({
      _id: sessionId,
      userId: req.user.userId,
    })

    if (!session) {
      return res.status(404).json({ error: "Session not found" })
    }

    const endTime = new Date()
    const duration = Math.floor((endTime - session.startTime) / (1000 * 60))

    session.endTime = endTime
    session.duration = duration
    session.status = "awaiting_quiz"
    await session.save()

    res.json({
      message: "Session ended. Complete the quiz to finish and save progress.",
      session,
      duration,
    })
  } catch (error) {
    console.error("End session error:", error)
    res.status(500).json({ error: "Failed to end session" })
  }
}

/**
 * Finalize a session (fallback when quiz is not possible)
 */
export const finalizeSession = async (req, res) => {
  try {
    await connectToMongo()

    const { sessionId } = req.params

    const session = await HabitSession.findOne({
      _id: sessionId,
      userId: req.user.userId,
      status: "awaiting_quiz"
    })

    if (!session) {
      return res.status(404).json({ error: "Session not found or already completed" })
    }

    session.status = "completed"
    await session.save()

    // Update streak
    await updateStreak(req.user.userId)

    // Update user stats
    const user = await User.findById(req.user.userId)
    if (user) {
      user.totalSessions += 1
      user.lastSessionDate = new Date()
      // Minimal XP for session without quiz
      user.focusScore = (user.focusScore || 0) + 5
      await user.save()
    }

    res.json({
      message: "Session finalized",
      session
    })
  } catch (error) {
    console.error("Finalize session error:", error)
    res.status(500).json({ error: "Failed to finalize session" })
  }
}

/**
 * Get session history
 */
export const getHistory = async (req, res) => {
  try {
    await connectToMongo()

    // Get user to check tier
    const user = await User.findById(req.user.userId).select('subscriptionTier')
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    const userTier = user.subscriptionTier || 'free'

    // Parse query parameters
    let { startDate, endDate, daysBack } = req.query

    // Build date filter based on tier and parameters
    let dateFilter = {}
    
    if (startDate || endDate) {
      // Custom date range provided
      if (startDate) {
        dateFilter.$gte = new Date(startDate)
      }
      if (endDate) {
        dateFilter.$lte = new Date(endDate)
      }
    } else if (daysBack) {
      // Days back parameter provided
      const days = parseInt(daysBack, 10)
      dateFilter.$gte = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    } else {
      // No parameters - apply tier-based defaults
      if (userTier === 'free') {
        // Free users: last 30 days only
        dateFilter.$gte = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
      // Premium users: no date restriction (empty filter = all history)
    }

    // Apply tier-based restrictions
    if (userTier === 'free') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      // Ensure free users can't access data older than 30 days
      if (!dateFilter.$gte || dateFilter.$gte < thirtyDaysAgo) {
        dateFilter.$gte = thirtyDaysAgo
      }
    }

    // Build query
    const query = {
      userId: req.user.userId,
    }
    
    if (Object.keys(dateFilter).length > 0) {
      query.sessionDate = dateFilter
    }

    const sessions = await HabitSession.find(query).sort({ sessionDate: -1 })

    // Calculate date range info for response
    const now = new Date()
    const oldestAllowed = userTier === 'free' 
      ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      : null

    res.json({
      sessions,
      tier: userTier,
      dateRange: {
        start: dateFilter.$gte || null,
        end: dateFilter.$lte || now,
        oldestAllowed,
        isLimited: userTier === 'free',
      },
    })
  } catch (error) {
    console.error("History error:", error)
    res.status(500).json({ error: "Failed to fetch history" })
  }
}

/**
 * Get streak information
 */
export const getStreak = async (req, res) => {
  try {
    await connectToMongo()

    const streak = await StreakRecord.findOne({ userId: req.user.userId })
    const user = await User.findById(req.user.userId)

    res.json({
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      totalSessions: user.totalSessions,
      lastSessionDate: user.lastSessionDate,
      streakHistory: streak?.streakHistory || [],
    })
  } catch (error) {
    console.error("Streak error:", error)
    res.status(500).json({ error: "Failed to fetch streak" })
  }
}

/**
 * Get session quota (remaining sessions for the day)
 */
export const getQuota = async (req, res) => {
  try {
    await connectToMongo()

    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    const limitCheck = await checkSessionLimit(user)

    res.json({
      tier: user.subscriptionTier,
      dailySessionCount: user.dailySessionCount,
      limit: limitCheck.limit,
      remaining: limitCheck.remaining,
      unlimited: limitCheck.limit === -1,
      resetAt: new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString(),
    })
  } catch (error) {
    console.error("Quota error:", error)
    res.status(500).json({ error: "Failed to fetch quota" })
  }
}

/**
 * Log a completed session
 */
export const logSession = async (req, res, next) => {
  try {
    await connectToMongo()

    const { duration, mode } = req.body

    if (!duration || duration < 1) {
      return res.status(400).json({ error: "Invalid duration" })
    }

    // Get user to check session limit
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Check for Deep Mode access if requested
    if (mode === "deep") {
      const access = checkFeatureAccess("deep_mode", user.subscriptionTier)
      if (!access.allowed) {
        throw access.error
      }
    }

    // Check session limit for free tier users
    const limitCheck = await checkSessionLimit(user)
    if (!limitCheck.allowed) {
      const resetAt = new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString()
      throw new SessionLimitError(user.dailySessionCount, limitCheck.limit, resetAt)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const session = await HabitSession.create({
      userId: req.user.userId,
      startTime: new Date(Date.now() - duration * 60000),
      endTime: new Date(),
      duration,
      sessionDate: today,
      status: "completed",
      notes: `${mode} mode session`,
    })

    // Increment session counter
    await incrementSessionCounter(req.user.userId)

    // Update user stats
    user.totalSessions += 1
    user.lastSessionDate = new Date()
    user.preferredMode = mode
    await user.save()

    // Update streak
    await updateStreak(req.user.userId)

    res.status(201).json({
      message: "Session logged successfully",
      session,
      sessionLimit: {
        remaining: limitCheck.remaining - 1,
        limit: limitCheck.limit,
      },
    })
  } catch (error) {
    console.error("Log session error:", error)
    next(error)
  }
}

/**
 * Get user statistics
 */
export const getStats = async (req, res) => {
  try {
    await connectToMongo()

    const user = await User.findById(req.user.userId)
    const streakRecord = await StreakRecord.findOne({ userId: req.user.userId })

    // Get this week's sessions
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const sessionsThisWeek = await HabitSession.countDocuments({
      userId: req.user.userId,
      sessionDate: { $gte: sevenDaysAgo },
      status: "completed",
    })

    // Get total duration this week
    const weekSessions = await HabitSession.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.userId),
          sessionDate: { $gte: sevenDaysAgo },
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: "$duration" },
        },
      },
    ])

    const totalDuration = weekSessions[0]?.totalDuration || 0

    // Get weekly data for chart
    const today = new Date()
    const weeklyData = []
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayIndex = date.getDay()
      const dayName = daysOfWeek[dayIndex]

      const sessionsCount = await HabitSession.countDocuments({
        userId: req.user.userId,
        sessionDate: { $gte: date, $lt: nextDate },
        status: "completed",
      })

      weeklyData.push({
        day: dayName,
        sessions: sessionsCount,
      })
    }

    res.json({
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      totalSessions: user.totalSessions,
      sessionsThisWeek,
      totalDuration: Math.round(totalDuration / 60), // Convert to hours
      weeklyData,
      lastSessionDate: user.lastSessionDate,
    })
  } catch (error) {
    console.error("Stats error:", error)
    res.status(500).json({ error: "Failed to fetch stats" })
  }
}

/**
 * Helper function to update streak
 */
export async function updateStreak(userId) {
  try {
    await connectToMongo()

    const user = await User.findById(userId)
    if (!user) {
      throw new Error("User not found for streak update")
    }

    let streakRecord = await StreakRecord.findOne({ userId })
    if (!streakRecord) {
      streakRecord = await StreakRecord.create({ 
        userId,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        totalSessions: user.totalSessions || 0
      })
    }

    // Synchronize if they are out of sync (favoring User model as it might be the legacy source)
    if (user.currentStreak > streakRecord.currentStreak) {
      streakRecord.currentStreak = user.currentStreak
    } else if (streakRecord.currentStreak > user.currentStreak) {
      user.currentStreak = streakRecord.currentStreak
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const todayString = today.toDateString()
    const yesterdayString = yesterday.toDateString()

    // Check if session completed today
    const todaySession = await HabitSession.findOne({
      userId,
      sessionDate: today,
      status: "completed",
    })

    if (!todaySession) {
      console.log(`[Streak] No completed session found for today (${todayString}) for user ${userId}`)
      return
    }

    const lastActiveDate = streakRecord.lastActiveDate
    const lastActiveString = lastActiveDate ? lastActiveDate.toDateString() : null

    if (!lastActiveDate || lastActiveString === yesterdayString) {
      // First time or continued streak
      user.currentStreak += 1
      if (user.currentStreak > user.longestStreak) {
        user.longestStreak = user.currentStreak
      }
      console.log(`[Streak] Incrementing streak for user ${userId}: ${user.currentStreak - 1} -> ${user.currentStreak}`)
    } else if (lastActiveString === todayString) {
      // Already updated today
      console.log(`[Streak] Already updated today for user ${userId}. Current streak: ${user.currentStreak}`)
    } else {
      // Missed a day, reset to 1
      if (streakRecord.currentStreak > 0) {
        streakRecord.streakHistory.push({
          startDate: streakRecord.lastActiveDate,
          endDate: new Date(),
          length: streakRecord.currentStreak,
        })
      }
      user.currentStreak = 1
      console.log(`[Streak] Resetting streak for user ${userId} (Last active: ${lastActiveString}, Today: ${todayString})`)
    }

    streakRecord.currentStreak = user.currentStreak
    streakRecord.longestStreak = user.longestStreak
    streakRecord.lastActiveDate = new Date()
    streakRecord.totalSessions = user.totalSessions

    await user.save()
    await streakRecord.save()
    
    return user.currentStreak
  } catch (error) {
    console.error("updateStreak helper error:", error)
    throw error
  }
}

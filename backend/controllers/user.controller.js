import User from "../models/User.js"
import StreakRecord from "../models/StreakRecord.js"
import HabitSession from "../models/HabitSession.js"
import LearningPath from "../models/LearningPath.js"
import SpacedReview from "../models/SpacedReview.js"
import { connectToMongo } from "../utils/db.js"

async function getUserDashboard(req, res){
  try {
    await connectToMongo()

    const user = await User.findById(req.user.userId).select(
      "name email currentStreak longestStreak totalSessions lastSessionDate focusScore focusScoreHistory",
    )

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    const streakRecord = await StreakRecord.findOne({ userId: req.user.userId })

    // Calculate weekly consistency
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentSessions = await HabitSession.find({
      userId: req.user.userId,
      status: "completed",
    }).sort({ sessionDate: -1 }).limit(30)

    const weeklySessionsCount = recentSessions.filter(s => s.sessionDate >= oneWeekAgo).length
    const totalMinutes = recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0)

    // Generate Heatmap Data (Last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const heatmapSessions = await HabitSession.find({
      userId: req.user.userId,
      sessionDate: { $gte: thirtyDaysAgo },
      status: "completed"
    })

    const heatmapMap = {}
    heatmapSessions.forEach(s => {
      const dateKey = s.sessionDate.toISOString().split('T')[0]
      heatmapMap[dateKey] = (heatmapMap[dateKey] || 0) + 1
    })

    const heatmap = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      const dateKey = d.toISOString().split('T')[0]
      return {
        date: dateKey,
        count: heatmapMap[dateKey] || 0
      }
    })

    // Rank Allocation Logic
    const getRank = (score) => {
      if (score >= 90) return { name: "Grandmaster", color: "text-purple-400", level: 6 }
      if (score >= 80) return { name: "Elite", color: "text-indigo-400", level: 5 }
      if (score >= 60) return { name: "Expert", color: "text-blue-400", level: 4 }
      if (score >= 40) return { name: "Scholar", color: "text-emerald-400", level: 3 }
      if (score >= 20) return { name: "Apprentice", color: "text-amber-400", level: 2 }
      return { name: "Novice", color: "text-gray-400", level: 1 }
    }

    const rankInfo = getRank(user.focusScore || 0)

    // Derived stats for frontend HUD
    const xp = totalMinutes * 10 // Example: 10 XP per minute
    const level = Math.floor(xp / 500) || 1
    const energy = Math.min(100, (weeklySessionsCount / 7) * 100)

    const learningPaths = await LearningPath.find({ userId: req.user.userId })
    const reviewsDue = await SpacedReview.find({ 
      userId: req.user.userId, 
      isCompleted: false,
      scheduledDate: { $lte: new Date() } 
    }).populate('lessonId')

    res.json({
      user,
      streak: streakRecord,
      weeklySessions: weeklySessionsCount,
      totalDuration: totalMinutes,
      xp,
      level,
      energy,
      score: user.focusScore || 0,
      rank: rankInfo.name,
      rankColor: rankInfo.color,
      rankLevel: rankInfo.level,
      sessions: user.totalSessions,
      recentSessions: recentSessions.slice(0, 5), // Return last 5 for tracking
      heatmap,
      learningPaths,
      reviewsDue
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    res.status(500).json({ error: "Failed to fetch dashboard" })
  }
}

async function getUserProfile(req, res) {
  try {
      await connectToMongo()

    const user = await User.findById(req.user.userId).select("-password")
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    const streakRecord = await StreakRecord.findOne({ userId: user._id })

    res.json({
      user,
      streak: streakRecord,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ error: "Failed to fetch profile" })
  }
}

async function updateUserProfile(req, res) {
  try {
      await connectToMongo()

    const { name, learningGoal, preferredStudyTime, modePreference } = req.body

    const updateData = {}
    if (name) updateData.name = name
    if (learningGoal) updateData.learningGoal = learningGoal
    if (preferredStudyTime) updateData.preferredStudyTime = preferredStudyTime
    if (modePreference) updateData.modePreference = modePreference

    const user = await User.findByIdAndUpdate(req.user.userId, updateData, { new: true }).select("-password")

    res.json({
      message: "Profile updated successfully",
      user,
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ error: "Failed to update profile" })
  }
}

async function getNotificationPreferences(req, res) {
  try {
    await connectToMongo()

    const user = await User.findById(req.user.userId).select("notificationPreferences")
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({
      preferences: user.notificationPreferences || {
        browserPermission: 'default',
        enabled: false,
        lastPromptedAt: null,
      },
    })
  } catch (error) {
    console.error("Get notification preferences error:", error)
    res.status(500).json({ error: "Failed to fetch notification preferences" })
  }
}

async function updateNotificationPreferences(req, res) {
  try {
    await connectToMongo()

    const { browserPermission, enabled, lastPromptedAt } = req.body

    // Validate browserPermission if provided
    const validPermissions = ['granted', 'denied', 'default', 'unsupported']
    if (browserPermission && !validPermissions.includes(browserPermission)) {
      return res.status(400).json({ error: "Invalid browser permission value" })
    }

    const updateData = {}
    if (browserPermission !== undefined) {
      updateData['notificationPreferences.browserPermission'] = browserPermission
    }
    if (enabled !== undefined) {
      updateData['notificationPreferences.enabled'] = enabled
    }
    if (lastPromptedAt !== undefined) {
      updateData['notificationPreferences.lastPromptedAt'] = lastPromptedAt
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateData },
      { new: true }
    ).select("notificationPreferences")

    res.json({
      message: "Notification preferences updated successfully",
      preferences: user.notificationPreferences,
    })
  } catch (error) {
    console.error("Update notification preferences error:", error)
    res.status(500).json({ error: "Failed to update notification preferences" })
  }
}

const userController = {
  getUserDashboard,
  getUserProfile,
  updateUserProfile,
  getNotificationPreferences,
  updateNotificationPreferences,
}
export default userController;
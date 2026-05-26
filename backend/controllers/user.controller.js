import User from "../models/User.js"
import StreakRecord from "../models/StreakRecord.js"
import HabitSession from "../models/HabitSession.js"
import LearningPath from "../models/LearningPath.js"
import SpacedReview from "../models/SpacedReview.js"
import HabitTask from "../models/HabitTask.js"
import { calculateFocusScore } from "../services/focusScore.js"
import { connectToMongo } from "../utils/db.js"
import Subscription from "../models/Subscription.js"

async function getUserDashboard(req, res){
  try {
    await connectToMongo()

    // Calculate/Update Focus Score on the fly for latest data
    const scoreData = await calculateFocusScore(req.user.userId)

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

    // Generate Heatmap Data (Last 365 days)
    const threeSixtyFiveDaysAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    const heatmapSessions = await HabitSession.find({
      userId: req.user.userId,
      sessionDate: { $gte: threeSixtyFiveDaysAgo },
      status: "completed"
    })

    const heatmapMap = {}
    heatmapSessions.forEach(s => {
      const dateKey = s.sessionDate.toISOString().split('T')[0]
      heatmapMap[dateKey] = (heatmapMap[dateKey] || 0) + (s.duration || 0)
    })

    const heatmap = Array.from({ length: 365 }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (364 - i))
      const dateKey = d.toISOString().split('T')[0]
      return {
        date: dateKey,
        count: heatmapMap[dateKey] || 0
      }
    })

    // Calculate max daily duration
    const maxDailyMinutes = Math.max(...Object.values(heatmapMap), 0)

    // Calculate weekly data (minutes per day) for WeeklyGraph
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const weeklyData = []
    const todayObj = new Date()
    for (let i = 6; i >= 0; i--) {
        const d = new Date(todayObj)
        d.setDate(d.getDate() - i)
        const dateKey = d.toISOString().split('T')[0]
        const dayName = daysOfWeek[d.getDay()]
        weeklyData.push({
            day: dayName,
            minutes: heatmapMap[dateKey] || 0
        })
    }

    // Rank Allocation Logic
    const getRank = (score) => {
      if (score >= 90) return { name: "Grandmaster", color: "text-purple-400", level: 6 }
      if (score >= 80) return { name: "Elite", color: "text-indigo-400", level: 5 }
      if (score >= 60) return { name: "Expert", color: "text-blue-400", level: 4 }
      if (score >= 40) return { name: "Scholar", color: "text-emerald-400", level: 3 }
      if (score >= 20) return { name: "Apprentice", color: "text-amber-400", level: 2 }
      return { name: "Novice", color: "text-gray-400", level: 1 }
    }

    const rankInfo = getRank(scoreData.total)

    // Derived stats for frontend HUD
    const xp = totalMinutes * 10 // Example: 10 XP per minute
    const level = Math.floor(xp / 500) || 1
    const energy = Math.min(100, Math.round((weeklySessionsCount / 7) * 100))

    // Fetch today's tasks (Quests)
    const today = new Date().toISOString().split('T')[0]
    const tasks = await HabitTask.find({
      userId: req.user.userId,
      assignedDate: today
    })

    const learningPaths = await LearningPath.find({ userId: req.user.userId })
    const reviewsDue = await SpacedReview.find({ 
      userId: req.user.userId, 
      isCompleted: false,
      scheduledFor: { $lte: new Date() } 
    }).populate('lessonId')

    const achievements = [
      { id: '1', title: "3 Day Streak", unlocked: user.currentStreak >= 3 },
      { id: '2', title: "10 Sessions", unlocked: user.totalSessions >= 10 },
      { id: '3', title: "Focus Master", unlocked: user.focusScore >= 100 },
      { id: '4', title: "Consistency Pro", unlocked: user.currentStreak >= 7 },
      { id: '5', title: "Early Adopter", unlocked: true },
      { id: '6', title: "Deep Diver", unlocked: user.totalSessions >= 5 }
    ]

    res.json({
      user,
      streak: {
        currentStreak: Math.max(user.currentStreak || 0, streakRecord?.currentStreak || 0),
        longestStreak: Math.max(user.longestStreak || 0, streakRecord?.longestStreak || 0)
      },
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
      recentSessions: recentSessions.slice(0, 5),
      heatmap,
      weeklyData,
      maxDailyMinutes,
      learningPaths,
      reviewsDue,
      tasks,
      achievements,
      combo: user.dailySessionCount || 0
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
    const subscription = await Subscription.findOne({ userId: user._id })

    // Also get heatmap and sessions for profile
    const threeSixtyFiveDaysAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    const heatmapSessions = await HabitSession.find({
      userId: req.user.userId,
      sessionDate: { $gte: threeSixtyFiveDaysAgo },
      status: "completed"
    })

    const heatmapMap = {}
    heatmapSessions.forEach(s => {
      const dateKey = s.sessionDate.toISOString().split('T')[0]
      heatmapMap[dateKey] = (heatmapMap[dateKey] || 0) + (s.duration || 0)
    })

    const heatmap = Array.from({ length: 365 }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (364 - i))
      const dateKey = d.toISOString().split('T')[0]
      return {
        date: dateKey,
        count: heatmapMap[dateKey] || 0
      }
    })

    const recentSessions = await HabitSession.find({
      userId: req.user.userId,
      status: "completed",
    }).sort({ sessionDate: -1 }).limit(10)

    const maxDailyMinutes = Math.max(...Object.values(heatmapMap), 0)

    const getRank = (score) => {
      if (score >= 90) return { name: "Grandmaster", color: "text-purple-400", level: 6 }
      if (score >= 80) return { name: "Elite", color: "text-indigo-400", level: 5 }
      if (score >= 60) return { name: "Expert", color: "text-blue-400", level: 4 }
      if (score >= 40) return { name: "Scholar", color: "text-emerald-400", level: 3 }
      if (score >= 20) return { name: "Apprentice", color: "text-amber-400", level: 2 }
      return { name: "Novice", color: "text-gray-400", level: 1 }
    }

    const rankInfo = getRank(user.focusScore || 0)

    const achievements = [
      { id: '1', title: "3 Day Streak", unlocked: user.currentStreak >= 3 },
      { id: '2', title: "10 Sessions", unlocked: user.totalSessions >= 10 },
      { id: '3', title: "Focus Master", unlocked: user.focusScore >= 100 },
      { id: '4', title: "Consistency Pro", unlocked: user.currentStreak >= 7 },
      { id: '5', title: "Early Adopter", unlocked: true },
      { id: '6', title: "Deep Diver", unlocked: user.totalSessions >= 5 }
    ]

    res.json({
      user,
      streak: streakRecord,
      subscription,
      heatmap,
      recentSessions,
      maxDailyMinutes,
      achievements,
      rank: rankInfo,
      combo: user.dailySessionCount || 0,
      totalDuration: heatmapSessions.reduce((sum, s) => sum + (s.duration || 0), 0)
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
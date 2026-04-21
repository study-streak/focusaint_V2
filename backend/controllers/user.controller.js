import User from "../models/User.js"
import StreakRecord from "../models/StreakRecord.js"
import HabitSession from "../models/HabitSession.js"
import { connectToMongo } from "../utils/db.js"

async function getUserDashboard(req, res){
  try {
      await connectToMongo()

    const user = await User.findById(req.user.userId).select(
      "name email currentStreak longestStreak totalSessions lastSessionDate",
    )

    const streakRecord = await StreakRecord.findOne({ userId: req.user.userId })

    // Calculate weekly consistency
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const weeklySessions = await HabitSession.countDocuments({
      userId: req.user.userId,
      sessionDate: { $gte: oneWeekAgo },
      status: "completed",
    })

    res.json({
      user,
      streak: streakRecord,
      weeklySessions,
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
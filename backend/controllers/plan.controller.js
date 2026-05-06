import mongoose from "mongoose"
import HabitTask from "../models/HabitTask.js"
import User from "../models/User.js"
import StreakRecord from "../models/StreakRecord.js"
import HabitSession from "../models/HabitSession.js"
import { connectToMongo } from "../utils/db.js"
import {
  inferProctoredPreset,
  mergeProctoredSettings,
  normalizeProctoredPreset,
} from "../utils/proctoredPresets.js"
import { checkSessionLimit, incrementSessionCounter } from "../utils/sessionCounter.js"
import { checkFeatureAccess } from "../utils/featureAvailability.js"
import { SessionLimitError } from "../utils/errors.js"

/**
 * Helper: Update streak when a task is completed on its assigned date
 */
async function updateStreakFromTask(userId) {
  try {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error("User not found for task-based streak update")
    }

    const streakRecord = (await StreakRecord.findOne({ userId })) || (await StreakRecord.create({ userId }))

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const lastActiveDate = streakRecord.lastActiveDate
    const todayString = today.toISOString().split("T")[0]

    const completedTaskToday = await HabitTask.findOne({
      userId,
      assignedDate: todayString,
      completed: true,
    })

    if (!completedTaskToday) return

    if (!lastActiveDate || lastActiveDate.toDateString() === yesterday.toDateString()) {
      user.currentStreak += 1
      if (user.currentStreak > user.longestStreak) {
        user.longestStreak = user.currentStreak
      }
    } else if (lastActiveDate.toDateString() !== today.toDateString()) {
      if (streakRecord.currentStreak > 0) {
        streakRecord.streakHistory.push({
          startDate: streakRecord.lastActiveDate,
          endDate: new Date(),
          length: streakRecord.currentStreak,
        })
      }
      user.currentStreak = 1
    }

    streakRecord.currentStreak = user.currentStreak
    streakRecord.longestStreak = user.longestStreak
    streakRecord.lastActiveDate = new Date()

    await user.save()
    await streakRecord.save()
  } catch (error) {
    console.error("updateStreakFromTask helper error:", error)
    throw error
  }
}

/**
 * Mark attachment as complete
 */
export const markAttachmentComplete = async (req, res) => {
  try {
    await connectToMongo()
    const { taskId, attachmentId } = req.params

    const task = await HabitTask.findOne({ _id: taskId, userId: req.user.userId })
    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    const attachment = task.attachments.id(attachmentId)
    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" })
    }

    if (typeof attachment.completed === "undefined") {
      attachment.completed = true
    } else {
      attachment.completed = true
    }
    attachment.completedAt = new Date()

    const allAttachmentsComplete = task.attachments.every((att) => att.completed)

    let streakUpdated = false
    const today = new Date()
    const todayString = today.toISOString().split("T")[0]

    if (allAttachmentsComplete && task.assignedDate === todayString && !task.completed) {
      task.completed = true
      task.completedAt = new Date()
      if (!task.streakUpdated) {
        await updateStreakFromTask(req.user.userId)
        streakUpdated = true
        task.streakUpdated = true
      }
    }

    await task.save()

    let currentStreak = undefined
    if (streakUpdated) {
      const user = await User.findById(req.user.userId)
      currentStreak = user.currentStreak
    }

    res.json({
      message: "Attachment marked as complete",
      attachment,
      task,
      streakUpdated,
      currentStreak,
    })
  } catch (error) {
    console.error("Mark attachment complete error:", error)
    res.status(500).json({ error: "Failed to mark attachment complete" })
  }
}

/**
 * Unmark attachment as complete
 */
export const unmarkAttachmentComplete = async (req, res) => {
  try {
    await connectToMongo()
    const { taskId, attachmentId } = req.params

    const task = await HabitTask.findOne({ _id: taskId, userId: req.user.userId })
    if (!task) return res.status(404).json({ error: "Task not found" })
    const attachment = task.attachments.id(attachmentId)
    if (!attachment) return res.status(404).json({ error: "Attachment not found" })
    attachment.completed = false
    await task.save()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

/**
 * CREATE: Add a new task
 */
export const createTask = async (req, res) => {
  try {
    await connectToMongo()

    const { title, description, duration, category, assignedDate, monthYear, attachments } = req.body

    if (!title || !assignedDate || !monthYear || !duration) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    let processedAttachments = []
    if (Array.isArray(attachments) && attachments.length > 0) {
      processedAttachments = attachments.map((att) => ({
        ...att,
        _id: new mongoose.Types.ObjectId(),
        uploadedAt: att.uploadedAt ? new Date(att.uploadedAt) : new Date(),
        openCount: 0,
      }))
    }

    const task = await HabitTask.create({
      userId: req.user.userId,
      title,
      description: description || "",
      duration: Number(duration),
      category: category || "other",
      assignedDate,
      monthYear,
      completed: false,
      attachments: processedAttachments,
    })

    res.status(201).json({
      message: "Task created",
      task,
    })
  } catch (error) {
    console.error("Create task error:", error)
    res.status(500).json({ error: "Failed to create task" })
  }
}

/**
 * READ: Get all tasks for a specific date (daily plan)
 */
export const getDailyTasks = async (req, res) => {
  try {
    await connectToMongo()

    const { date } = req.query

    if (!date) {
      return res.status(400).json({ error: "Date parameter required (YYYY-MM-DD)" })
    }

    const tasks = await HabitTask.find({
      userId: req.user.userId,
      assignedDate: date,
    }).sort({ createdAt: 1 })

    const completedTasks = tasks.filter((t) => t.completed).length
    const totalDuration = tasks.reduce((sum, t) => sum + t.duration, 0)
    const completedDuration = tasks.filter((t) => t.completed).reduce((sum, t) => sum + t.duration, 0)

    res.json({
      date,
      tasks,
      stats: {
        total: tasks.length,
        completed: completedTasks,
        pending: tasks.length - completedTasks,
        totalDuration,
        completedDuration,
      },
    })
  } catch (error) {
    console.error("Get daily tasks error:", error)
    res.status(500).json({ error: "Failed to fetch daily tasks" })
  }
}

/**
 * READ: Get all tasks for a specific month (monthly plan)
 */
export const getMonthlyTasks = async (req, res) => {
  try {
    await connectToMongo()

    const { month } = req.query

    if (!month) {
      return res.status(400).json({ error: "Month parameter required (YYYY-MM)" })
    }

    const tasks = await HabitTask.find({
      userId: req.user.userId,
      monthYear: month,
    }).sort({ assignedDate: 1 })

    const tasksByDay = {}
    tasks.forEach((task) => {
      if (!tasksByDay[task.assignedDate]) {
        tasksByDay[task.assignedDate] = []
      }
      tasksByDay[task.assignedDate].push(task)
    })

    const stats = {
      total: tasks.length,
      completed: tasks.filter((t) => t.completed).length,
      pending: tasks.filter((t) => !t.completed).length,
      totalDuration: tasks.reduce((sum, t) => sum + t.duration, 0),
      completedDuration: tasks.filter((t) => t.completed).reduce((sum, t) => sum + t.duration, 0),
      daysWithTasks: Object.keys(tasksByDay).length,
    }

    res.json({
      month,
      tasks,
      tasksByDay,
      stats,
    })
  } catch (error) {
    console.error("Get monthly tasks error:", error)
    res.status(500).json({ error: "Failed to fetch monthly tasks" })
  }
}

/**
 * UPDATE: Mark a task as complete
 */
export const completeTask = async (req, res) => {
  try {
    await connectToMongo()

    const { taskId } = req.params

    const task = await HabitTask.findOne({
      _id: taskId,
      userId: req.user.userId,
    })

    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    const today = new Date()
    const todayString = today.toISOString().split("T")[0]

    task.completed = true
    task.completedAt = new Date()
    await task.save()

    let streakUpdated = false
    if (task.assignedDate === todayString && !task.streakUpdated) {
      await updateStreakFromTask(req.user.userId)
      streakUpdated = true
      task.streakUpdated = true
      await task.save()
    }

    const user = await User.findById(req.user.userId)

    res.json({
      message: "Task completed",
      task,
      streakUpdated,
      currentStreak: user.currentStreak,
    })
  } catch (error) {
    console.error("Complete task error:", error)
    res.status(500).json({ error: "Failed to complete task" })
  }
}

/**
 * UPDATE: Mark a task as incomplete
 */
export const uncompleteTask = async (req, res) => {
  try {
    await connectToMongo()

    const { taskId } = req.params

    const task = await HabitTask.findOne({
      _id: taskId,
      userId: req.user.userId,
    })

    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    task.completed = false
    task.completedAt = null
    await task.save()

    res.json({
      message: "Task marked as incomplete",
      task,
    })
  } catch (error) {
    console.error("Uncomplete task error:", error)
    res.status(500).json({ error: "Failed to uncomplete task" })
  }
}

/**
 * UPDATE: Edit an existing task
 */
export const updateTask = async (req, res) => {
  try {
    await connectToMongo()

    const { taskId } = req.params
    const { title, description, duration, category, assignedDate, monthYear } = req.body

    const task = await HabitTask.findOne({
      _id: taskId,
      userId: req.user.userId,
    })

    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    if (title) task.title = title
    if (description !== undefined) task.description = description
    if (duration) task.duration = Number(duration)
    if (category) task.category = category
    if (assignedDate) task.assignedDate = assignedDate
    if (monthYear) task.monthYear = monthYear

    await task.save()

    res.json({
      message: "Task updated",
      task,
    })
  } catch (error) {
    console.error("Update task error:", error)
    res.status(500).json({ error: "Failed to update task" })
  }
}

/**
 * DELETE: Remove a task
 */
export const deleteTask = async (req, res) => {
  try {
    await connectToMongo()

    const { taskId } = req.params

    const task = await HabitTask.findOneAndDelete({
      _id: taskId,
      userId: req.user.userId,
    })

    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    res.json({
      message: "Task deleted",
      task,
    })
  } catch (error) {
    console.error("Delete task error:", error)
    res.status(500).json({ error: "Failed to delete task" })
  }
}

/**
 * BULK CREATE: Create multiple tasks
 */
export const bulkCreateTasks = async (req, res) => {
  try {
    await connectToMongo()

    const { monthYear, tasks } = req.body

    if (!monthYear || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: "Invalid monthYear or tasks array" })
    }

    const preparedTasks = tasks.map((t) => ({
      ...t,
      userId: req.user.userId,
      monthYear,
      duration: Number(t.duration) || 25,
      completed: false,
    }))

    const createdTasks = await HabitTask.insertMany(preparedTasks)

    res.status(201).json({
      message: "Bulk tasks created",
      count: createdTasks.length,
      tasks: createdTasks,
    })
  } catch (error) {
    console.error("Bulk create error:", error)
    res.status(500).json({ error: "Failed to create bulk tasks" })
  }
}

/**
 * ATTACHMENTS: Add file or link to task
 */
export const addAttachment = async (req, res) => {
  try {
    await connectToMongo()

    const { taskId } = req.params
    const { type, name, url, fileSize, mimeType } = req.body

    if (!type || !name || !url) {
      return res.status(400).json({ error: "Missing required fields: type, name, url" })
    }

    if (!["file", "link"].includes(type)) {
      return res.status(400).json({ error: "Invalid type. Must be 'file' or 'link'" })
    }

    const task = await HabitTask.findOne({ _id: taskId, userId: req.user.userId })
    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    const attachment = {
      _id: new mongoose.Types.ObjectId(),
      type,
      name,
      url,
      fileSize: fileSize || null,
      mimeType: mimeType || null,
      uploadedAt: new Date(),
      openCount: 0,
      dueDate: req.body.dueDate || null,
    }

    task.attachments.push(attachment)
    await task.save()

    res.status(201).json({
      message: "Attachment added",
      attachment,
      task,
    })
  } catch (error) {
    console.error("Add attachment error:", error)
    res.status(500).json({ error: "Failed to add attachment" })
  }
}

/**
 * ATTACHMENTS: Upload local file
 */
export const uploadAttachment = async (req, res) => {
  try {
    await connectToMongo()

    const { taskId } = req.params
    const customName = req.body?.name
    const uploadedFile = req.file

    if (!uploadedFile) {
      return res.status(400).json({ error: "File is required" })
    }

    const task = await HabitTask.findOne({ _id: taskId, userId: req.user.userId })
    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    const attachment = {
      _id: new mongoose.Types.ObjectId(),
      type: "file",
      name: customName || uploadedFile.originalname,
      url: `/uploads/${uploadedFile.filename}`,
      fileSize: uploadedFile.size,
      mimeType: uploadedFile.mimetype,
      uploadedAt: new Date(),
      openCount: 0,
    }

    task.attachments.push(attachment)
    await task.save()

    res.status(201).json({
      message: "File uploaded and attached",
      attachment,
      task,
    })
  } catch (error) {
    console.error("Upload attachment error:", error)
    res.status(500).json({ error: "Failed to upload attachment" })
  }
}

/**
 * ATTACHMENTS: Remove attachment
 */
export const removeAttachment = async (req, res) => {
  try {
    await connectToMongo()

    const { taskId, attachmentId } = req.params

    const task = await HabitTask.findOne({ _id: taskId, userId: req.user.userId })
    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    task.attachments = task.attachments.filter((a) => a._id.toString() !== attachmentId)
    await task.save()

    res.json({
      message: "Attachment removed",
      task,
    })
  } catch (error) {
    console.error("Remove attachment error:", error)
    res.status(500).json({ error: "Failed to remove attachment" })
  }
}

/**
 * DEADLINE: Set task deadline
 */
export const setDeadline = async (req, res) => {
  try {
    await connectToMongo()

    const { taskId } = req.params
    const { deadline, proctoredMode, proctoredPreset, proctoredSettings } = req.body

    if (!deadline) {
      return res.status(400).json({ error: "Deadline required (YYYY-MM-DD)" })
    }

    const task = await HabitTask.findOne({ _id: taskId, userId: req.user.userId })
    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    task.deadline = deadline
    if (proctoredMode !== undefined) {
      task.proctoredMode = proctoredMode
    }

    const shouldApplyProctored = proctoredMode === true || proctoredPreset !== undefined || proctoredSettings !== undefined

    if (shouldApplyProctored) {
      const resolvedPreset = normalizeProctoredPreset(
        proctoredPreset || task.proctoredPreset || inferProctoredPreset(task.proctoredSettings)
      )

      task.proctoredPreset = resolvedPreset
      task.proctoredSettings = mergeProctoredSettings(resolvedPreset, {
        ...task.proctoredSettings,
        ...(proctoredSettings || {}),
      })
    }

    await task.save()

    res.json({
      message: "Deadline set",
      task,
    })
  } catch (error) {
    console.error("Set deadline error:", error)
    res.status(500).json({ error: "Failed to set deadline" })
  }
}

/**
 * DISTRIBUTION: Distribute task across multiple days
 */
export const distributeTask = async (req, res) => {
  try {
    await connectToMongo()

    const { taskId } = req.params
    const { distributedAcrossDays } = req.body

    if (!Array.isArray(distributedAcrossDays) || distributedAcrossDays.length === 0) {
      return res.status(400).json({ error: "distributedAcrossDays must be non-empty array" })
    }

    const totalPortion = distributedAcrossDays.reduce((sum, day) => sum + (day.portion || 0), 0)
    if (totalPortion !== 100) {
      return res.status(400).json({ error: `Portions must sum to 100% (got ${totalPortion}%)` })
    }

    const task = await HabitTask.findOne({ _id: taskId, userId: req.user.userId })
    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    task.distributedAcrossDays = distributedAcrossDays.map((day) => ({
      date: day.date,
      portion: day.portion,
      completed: false,
      completedAt: null,
    }))

    // 🎯 NEW: Distribute individual attachments across the scheduled days
    if (task.attachments && task.attachments.length > 0) {
      const dayCount = distributedAcrossDays.length
      task.attachments.forEach((att, index) => {
        // Simple distribution: evenly spread attachments over the days
        const dayIndex = Math.min(index % dayCount, dayCount - 1)
        att.dueDate = distributedAcrossDays[dayIndex].date
      })
    }

    await task.save()

    res.json({
      message: "Task distributed across days",
      task,
    })
  } catch (error) {
    console.error("Distribute task error:", error)
    res.status(500).json({ error: "Failed to distribute task" })
  }
}

/**
 * PROCTORED: Get task with proctored settings
 */
export const getProctoredTask = async (req, res) => {
  try {
    await connectToMongo()

    const { taskId } = req.params

    const task = await HabitTask.findOne({ _id: taskId, userId: req.user.userId })
    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    res.json({
      task: {
        _id: task._id,
        title: task.title,
        description: task.description,
        attachments: task.attachments,
        deadline: task.deadline,
        proctoredMode: task.proctoredMode,
        proctoredPreset: task.proctoredPreset,
        proctoredSettings: task.proctoredSettings,
        proctoredSessions: task.proctoredSessions,
      },
    })
  } catch (error) {
    console.error("Get proctored task error:", error)
    res.status(500).json({ error: "Failed to fetch task" })
  }
}

/**
 * PROCTORED: Start proctored session
 */
export const startProctoredSession = async (req, res, next) => {
  try {
    await connectToMongo()

    const { taskId } = req.params
    const { attachmentId, mode, proctoredPreset } = req.body

    const task = await HabitTask.findOne({ _id: taskId, userId: req.user.userId })
    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    // Get user to check tier and session limit
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // 1. Check for Deep Mode (proctored) access based on tier
    // Proctored sessions are considered part of "deep_mode" feature
    const access = checkFeatureAccess("deep_mode", user.subscriptionTier)
    if (!access.allowed) {
      return res.status(403).json(TierRestrictionError.deepMode(user.subscriptionTier).toJSON())
    }

    // 2. Check daily session limit for free tier users (if they somehow pass the tier check)
    // Even if we allowed Deep Mode for Free users, they would still be limited to 3 sessions total
    const limitCheck = await checkSessionLimit(user)
    if (!limitCheck.allowed) {
      const resetAt = new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString()
      return res.status(403).json(new SessionLimitError(user.dailySessionCount, limitCheck.limit, resetAt).toJSON())
    }

    const attachment = task.attachments.find((a) => a._id.toString() === attachmentId)
    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" })
    }

    const selectedPreset = normalizeProctoredPreset(
      mode || proctoredPreset || task.proctoredPreset || inferProctoredPreset(task.proctoredSettings)
    )
    task.proctoredPreset = selectedPreset
    const effectiveSettings = mergeProctoredSettings(selectedPreset, task.proctoredSettings)
    task.proctoredSettings = effectiveSettings

    if (!attachment.openedAt) {
      attachment.openedAt = new Date()
    }
    attachment.openCount += 1

    const session = {
      startedAt: new Date(),
      endedAt: null,
      duration: null,
      attachmentId,
      proctoredPreset: selectedPreset,
      proctoredSettingsSnapshot: effectiveSettings,
      violations: [],
    }

    task.proctoredSessions.push(session)
    
    // 3. Increment session counter and save
    await incrementSessionCounter(req.user.userId)
    await task.save()

    res.json({
      message: "Proctored session started",
      sessionId: session._id || session.startedAt.getTime(),
      sessionStartTime: session.startedAt,
      proctoredPreset: selectedPreset,
      proctoredSettings: effectiveSettings,
    })
  } catch (error) {
    console.error("Start proctored session error:", error)
    res.status(500).json({ error: "Failed to start proctored session" })
  }
}

/**
 * PROCTORED: End proctored session
 */
export const endProctoredSession = async (req, res) => {
  try {
    await connectToMongo()

    const { taskId } = req.params
    const { attachmentId, violations, duration } = req.body

    const task = await HabitTask.findOne({ _id: taskId, userId: req.user.userId })
    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    const session = task.proctoredSessions[task.proctoredSessions.length - 1]
    if (!session) {
      return res.status(404).json({ error: "No active session found" })
    }

    session.endedAt = new Date()
    session.duration = duration || Math.round((session.endedAt - session.startedAt) / 60000)
    session.violations = violations || []

    await task.save()

    // 🎯 NEW: Create a corresponding HabitSession so it shows up in stats and focus time
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await HabitSession.create({
        userId: req.user.userId,
        startTime: session.startedAt,
        endTime: session.endedAt,
        duration: session.duration,
        sessionDate: today,
        status: "completed",
        notes: `Deep Mode: ${task.title}`
      })

      // Update User global stats
      const user = await User.findById(req.user.userId)
      if (user) {
        user.totalSessions += 1
        user.lastSessionDate = new Date()
        await user.save()
      }
    } catch (sessionErr) {
      console.warn("Failed to log focus session for dashboard stats:", sessionErr)
      // We don't fail the request if stats logging fails
    }

    res.json({
      message: "Proctored session ended",
      session,
      violationCount: session.violations.length,
    })
  } catch (error) {
    console.error("End proctored session error:", error)
    res.status(500).json({ error: "Failed to end proctored session" })
  }
}

/**
 * PLAYLIST: Extract YouTube playlist videos and add as individual attachments
 * 
 * Uses YouTube's oEmbed API for individual video titles.
 * Fetches playlist page HTML to extract video IDs (no API key needed).
 */
export const addPlaylistAsAttachments = async (req, res) => {
  try {
    await connectToMongo()

    const { taskId } = req.params
    const { url } = req.body

    if (!url) {
      return res.status(400).json({ error: "Playlist URL is required" })
    }

    // Extract playlist ID from URL
    let listId = null
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      listId = urlObj.searchParams.get('list')
    } catch (e) {
      return res.status(400).json({ error: "Invalid URL format" })
    }

    if (!listId) {
      return res.status(400).json({ error: "No playlist ID found in URL. Make sure you're using a YouTube playlist link." })
    }

    const task = await HabitTask.findOne({ _id: taskId, userId: req.user.userId })
    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    // Fetch the playlist page to extract video IDs
    // We use the embed playlist page which lists all videos
    const playlistPageUrl = `https://www.youtube.com/playlist?list=${listId}`
    let videoIds = []

    try {
      const response = await fetch(playlistPageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      })
      const html = await response.text()

      // Extract video IDs from the playlist page HTML
      // YouTube embeds video data in JSON within the page
      const videoIdRegex = /"videoId":"([a-zA-Z0-9_-]{11})"/g
      const matches = new Set()
      let match
      while ((match = videoIdRegex.exec(html)) !== null) {
        matches.add(match[1])
      }
      videoIds = [...matches]
    } catch (fetchErr) {
      console.error("Failed to fetch playlist page:", fetchErr)
      return res.status(500).json({ error: "Failed to fetch playlist data from YouTube" })
    }

    if (videoIds.length === 0) {
      return res.status(400).json({ error: "Could not find any videos in this playlist. It may be private or empty." })
    }

    // Cap at 50 videos to avoid massive tasks
    const cappedVideoIds = videoIds.slice(0, 50)

    // Fetch titles for each video using oEmbed (batch with concurrency limit)
    const concurrencyLimit = 5
    const videoDetails = []

    for (let i = 0; i < cappedVideoIds.length; i += concurrencyLimit) {
      const batch = cappedVideoIds.slice(i, i + concurrencyLimit)
      const results = await Promise.allSettled(
        batch.map(async (videoId) => {
          try {
            const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
            const resp = await fetch(oembedUrl)
            if (resp.ok) {
              const data = await resp.json()
              return { videoId, title: data.title || `Video ${videoId}` }
            }
            return { videoId, title: `Video ${videoId}` }
          } catch {
            return { videoId, title: `Video ${videoId}` }
          }
        })
      )
      for (const result of results) {
        if (result.status === "fulfilled") {
          videoDetails.push(result.value)
        }
      }
    }

    // Create attachments for each video
    const newAttachments = videoDetails.map((video, index) => ({
      _id: new mongoose.Types.ObjectId(),
      type: "link",
      name: `${index + 1}. ${video.title}`,
      url: `https://www.youtube.com/watch?v=${video.videoId}&list=${listId}`,
      fileSize: null,
      mimeType: null,
      uploadedAt: new Date(),
      openCount: 0,
      completed: false,
    }))

    task.attachments.push(...newAttachments)
    await task.save()

    res.status(201).json({
      message: `Added ${newAttachments.length} videos from playlist`,
      count: newAttachments.length,
      attachments: newAttachments,
      task,
    })
  } catch (error) {
    console.error("Add playlist error:", error)
    res.status(500).json({ error: "Failed to process playlist" })
  }
}


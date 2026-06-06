import mongoose from "mongoose"
import User from "../models/User.js"
import HabitSession from "../models/HabitSession.js"
import { connectToMongo } from "../utils/db.js"
import { updateStreak } from "./habit.controller.js"
import { checkSessionLimit, incrementSessionCounter } from "../utils/sessionCounter.js"

// Helper: Ensure default data exists
function ensureDefaults(user) {
  let changed = false
  if (!user.focusShieldProfiles || user.focusShieldProfiles.length === 0) {
    user.focusShieldProfiles = [
      {
        name: "Deep Work",
        icon: "🧠",
        sites: ["facebook.com", "instagram.com", "twitter.com", "youtube.com", "reddit.com"],
        apps: ["Steam"],
        elementBlocking: { hideRecommendations: true, blockShorts: true, blockInfiniteScroll: false }
      },
      {
        name: "Study",
        icon: "📚",
        sites: ["youtube.com", "reddit.com", "netflix.com", "tiktok.com"],
        apps: ["Steam", "League of Legends"],
        elementBlocking: { hideRecommendations: false, blockShorts: true, blockInfiniteScroll: true }
      },
      {
        name: "Dopamine Detox",
        icon: "⚡",
        sites: ["facebook.com", "instagram.com", "twitter.com", "youtube.com", "reddit.com", "tiktok.com", "netflix.com", "buzzfeed.com"],
        apps: ["Steam", "Slack", "Discord", "Spotify", "League of Legends"],
        elementBlocking: { hideRecommendations: true, blockShorts: true, blockInfiniteScroll: true }
      },
      {
        name: "Coding",
        icon: "💻",
        sites: ["reddit.com", "twitter.com", "facebook.com"],
        apps: ["Slack", "Discord", "Steam"],
        elementBlocking: { hideRecommendations: false, blockShorts: false, blockInfiniteScroll: false }
      }
    ]
    changed = true
  }

  if (!user.focusShieldGlobalBlocklist || !user.focusShieldGlobalBlocklist.sites || user.focusShieldGlobalBlocklist.sites.length === 0) {
    user.focusShieldGlobalBlocklist = {
      sites: ["facebook.com", "instagram.com", "twitter.com", "youtube.com", "reddit.com"],
      apps: ["Slack", "Discord", "Steam"]
    }
    changed = true
  }

  if (!user.focusShieldDevices || user.focusShieldDevices.length === 0) {
    user.focusShieldDevices = [
      {
        id: "dev-desktop-1",
        name: "Main MacBook Pro",
        os: "macOS",
        status: "online",
        lastSyncTime: new Date(),
        exceptions: { sites: [], apps: ["Slack"] }
      },
      {
        id: "dev-ios-1",
        name: "Sujal's iPhone 16",
        os: "iOS",
        status: "online",
        lastSyncTime: new Date(),
        exceptions: { sites: [], apps: [] }
      }
    ]
    changed = true
  }

  return changed
}

// Helper: Check active session end status
async function checkActiveSessionStatus(user) {
  const session = user.focusShieldActiveSession
  if (session && session.isRunning && session.startTime) {
    const elapsed = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000)
    const remaining = session.totalDuration - elapsed

    if (remaining <= 0) {
      // Session finished naturally
      user.focusShieldActiveSession.isRunning = false
      user.focusShieldActiveSession.durationLeft = 0
      user.focusShieldActiveSession.profileName = null
      user.focusShieldActiveSession.isLocked = false

      // Log success event
      user.focusShieldIntegrityLogs.unshift({
        timestamp: new Date(),
        level: "INFO",
        message: "Focus session completed successfully."
      })

      // Complete related HabitSession
      if (session.habitSessionId) {
        const hs = await HabitSession.findById(session.habitSessionId)
        if (hs) {
          hs.endTime = new Date()
          hs.duration = Math.ceil(session.totalDuration / 60)
          hs.status = "completed"
          hs.notes = `FocusShield: completed session`
          await hs.save()

          // Trigger streak update
          await updateStreak(user._id)
          user.totalSessions = (user.totalSessions || 0) + 1
          user.lastSessionDate = new Date()
          user.focusScore = (user.focusScore || 0) + 5
        }
      }

      user.focusShieldActiveSession.habitSessionId = null
      return true
    } else {
      user.focusShieldActiveSession.durationLeft = remaining
    }
  }
  return false
}

// 1. Get status
export const getStatus = async (req, res) => {
  try {
    await connectToMongo()
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    const changedDefaults = ensureDefaults(user)
    const changedSession = await checkActiveSessionStatus(user)

    if (changedDefaults || changedSession) {
      await user.save()
    }

    const tier = user.subscriptionTier === "pro" ? "Team" : user.subscriptionTier === "premium" ? "Premium" : "Free"

    // Construct analytics payload dynamically based on completed HabitSessions
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const today = new Date()
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    const [allCompletedSessions, weeklySessions] = await Promise.all([
      HabitSession.find({ userId: user._id, status: "completed" }),
      HabitSession.find({
        userId: user._id,
        sessionDate: { $gte: sevenDaysAgo },
        status: "completed"
      })
    ])

    const totalSavedMinutes = allCompletedSessions.reduce((sum, s) => sum + (s.duration || 0), 0)
    const totalSavedHours = totalSavedMinutes / 60

    const durationByDay = {}
    weeklySessions.forEach(s => {
      if (s.sessionDate) {
        const dayName = daysOfWeek[new Date(s.sessionDate).getDay()]
        durationByDay[dayName] = (durationByDay[dayName] || 0) + (s.duration || 0)
      }
    })

    const history = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dayName = daysOfWeek[date.getDay()]
      const focusMinutes = durationByDay[dayName] || 0
      const distractionsAvoided = Math.floor(focusMinutes / 5)

      history.push({
        day: dayName,
        focusMinutes,
        distractionsAvoided
      })
    }

    const analytics = {
      streak: user.currentStreak || 0,
      totalSavedHours: parseFloat(totalSavedHours.toFixed(2)),
      productivityScore: user.focusScore || 0,
      history,
      visitsLog: []
    }

    res.json({
      subscription: {
        tier,
        gracePeriodActive: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      session: user.focusShieldActiveSession,
      profiles: user.focusShieldProfiles,
      globalBlocklist: user.focusShieldGlobalBlocklist,
      devices: user.focusShieldDevices,
      analytics
    })
  } catch (err) {
    console.error("FocusShield getStatus error:", err)
    res.status(500).json({ error: "Failed to get FocusShield status" })
  }
}

// 2. Start session
export const startSession = async (req, res) => {
  try {
    await connectToMongo()
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    const { profileName, durationSeconds, isLocked, blockMode } = req.body

    if (user.focusShieldActiveSession?.isRunning) {
      return res.status(400).json({ error: "A focus session is already running." })
    }

    // Limit check for free tier
    const limitCheck = await checkSessionLimit(user)
    if (!limitCheck.allowed) {
      return res.status(403).json({ error: "Daily focus session limit reached on Free plan." })
    }

    // Locked Mode checks
    if (isLocked && user.subscriptionTier === "free") {
      return res.status(403).json({ error: "Locked Mode requires Premium or Team tier." })
    }

    // Create related HabitSession
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const habitSession = await HabitSession.create({
      userId: req.user.userId,
      startTime: new Date(),
      sessionDate: today,
      status: "active"
    })

    // Increment Focusaint daily session count
    await incrementSessionCounter(req.user.userId)

    user.focusShieldActiveSession = {
      isRunning: true,
      profileName: profileName || "Global Blocklist",
      totalDuration: parseInt(durationSeconds) || 1500,
      durationLeft: parseInt(durationSeconds) || 1500,
      startTime: new Date(),
      isLocked: !!isLocked,
      blockMode: blockMode || "Temporary Session",
      habitSessionId: habitSession._id
    }

    user.focusShieldIntegrityLogs.unshift({
      timestamp: new Date(),
      level: "INFO",
      message: `Started '${user.focusShieldActiveSession.profileName}' session. Locked mode: ${user.focusShieldActiveSession.isLocked ? "ON" : "OFF"}`
    })

    await user.save()
    res.json(user.focusShieldActiveSession)
  } catch (err) {
    console.error("FocusShield startSession error:", err)
    res.status(500).json({ error: err.message || "Failed to start FocusShield session." })
  }
}

// 3. Stop/cancel session
export const stopSession = async (req, res) => {
  try {
    await connectToMongo()
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    if (!user.focusShieldActiveSession?.isRunning) {
      return res.status(400).json({ error: "No active session is running." })
    }

    if (user.focusShieldActiveSession.isLocked) {
      return res.status(403).json({
        error: "Cannot stop session. Locked Mode is active.",
        locked: true
      })
    }

    // Log early stop
    user.focusShieldIntegrityLogs.unshift({
      timestamp: new Date(),
      level: "WARN",
      message: `Focus session '${user.focusShieldActiveSession.profileName}' stopped early by user.`
    })

    // Update related HabitSession to completed early/abandoned
    if (user.focusShieldActiveSession.habitSessionId) {
      const hs = await HabitSession.findById(user.focusShieldActiveSession.habitSessionId)
      if (hs) {
        hs.endTime = new Date()
        hs.duration = Math.ceil((Date.now() - new Date(hs.startTime).getTime()) / 60000)
        hs.status = "completed" // Log the focus minutes anyway
        hs.notes = `FocusShield: stopped early`
        await hs.save()
        await updateStreak(user._id)
      }
    }

    user.focusShieldActiveSession = {
      isRunning: false,
      profileName: null,
      durationLeft: 0,
      totalDuration: 0,
      startTime: null,
      isLocked: false,
      habitSessionId: null
    }

    await user.save()
    res.json(user.focusShieldActiveSession)
  } catch (err) {
    console.error("FocusShield stopSession error:", err)
    res.status(500).json({ error: "Failed to stop FocusShield session." })
  }
}

// 4. Override session
export const overrideSession = async (req, res) => {
  try {
    await connectToMongo()
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    const { pin, method } = req.body

    if (!user.focusShieldActiveSession?.isRunning || !user.focusShieldActiveSession?.isLocked) {
      return res.status(400).json({ error: "No locked focus session is active." })
    }

    let success = false
    if (pin === "1234" || pin === "adminoverride" || method === "biometric") {
      success = true
    }

    if (!success) {
      user.focusShieldIntegrityLogs.unshift({
        timestamp: new Date(),
        level: "ERROR",
        message: `Failed locked mode exit attempt via method '${method}'.`
      })
      await user.save()
      return res.status(401).json({ error: "Invalid override credentials." })
    }

    // Override successful
    user.focusShieldIntegrityLogs.unshift({
      timestamp: new Date(),
      level: "WARN",
      message: `Locked mode overridden successfully via '${method}'. Session terminated.`
    })

    if (user.focusShieldActiveSession.habitSessionId) {
      const hs = await HabitSession.findById(user.focusShieldActiveSession.habitSessionId)
      if (hs) {
        hs.endTime = new Date()
        hs.duration = Math.ceil((Date.now() - new Date(hs.startTime).getTime()) / 60000)
        hs.status = "abandoned"
        hs.notes = `FocusShield overridden via ${method}`
        await hs.save()
      }
    }

    user.focusShieldActiveSession = {
      isRunning: false,
      profileName: null,
      durationLeft: 0,
      totalDuration: 0,
      startTime: null,
      isLocked: false,
      habitSessionId: null
    }

    await user.save()
    res.json({ status: "overridden", session: user.focusShieldActiveSession })
  } catch (err) {
    console.error("FocusShield overrideSession error:", err)
    res.status(500).json({ error: "Failed to override session." })
  }
}

// 5. Get and Save Profiles
export const getProfiles = async (req, res) => {
  try {
    await connectToMongo()
    const user = await User.findById(req.user.userId)
    if (!user) return res.status(404).json({ error: "User not found" })
    res.json(user.focusShieldProfiles || [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const saveProfiles = async (req, res) => {
  try {
    await connectToMongo()
    const user = await User.findById(req.user.userId)
    if (!user) return res.status(404).json({ error: "User not found" })

    const { name, icon, sites, apps, elementBlocking } = req.body

    const existingIdx = user.focusShieldProfiles.findIndex(p => p.name.toLowerCase() === name.toLowerCase())

    if (user.subscriptionTier === "free" && user.focusShieldProfiles.length >= 2 && existingIdx === -1) {
      return res.status(403).json({ error: "Free tier limits to 2 Focus Profiles maximum. Upgrade to Premium." })
    }

    const newProfile = {
      name,
      icon: icon || "💡",
      sites: sites || [],
      apps: apps || [],
      elementBlocking: elementBlocking || { hideRecommendations: false, blockShorts: false, blockInfiniteScroll: false }
    }

    if (existingIdx >= 0) {
      user.focusShieldProfiles[existingIdx] = newProfile
    } else {
      user.focusShieldProfiles.push(newProfile)
    }

    await user.save()
    res.json({ status: "success", profiles: user.focusShieldProfiles })
  } catch (err) {
    console.error("FocusShield saveProfiles error:", err)
    res.status(500).json({ error: "Failed to save profile." })
  }
}

// 6. Global Blocklist
export const getBlocklist = async (req, res) => {
  try {
    await connectToMongo()
    const user = await User.findById(req.user.userId)
    if (!user) return res.status(404).json({ error: "User not found" })
    res.json(user.focusShieldGlobalBlocklist || { sites: [], apps: [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const addToBlocklist = async (req, res) => {
  try {
    await connectToMongo()
    const user = await User.findById(req.user.userId)
    if (!user) return res.status(404).json({ error: "User not found" })

    const { type, value } = req.body // type: 'sites' or 'apps'

    if (!user.focusShieldGlobalBlocklist[type]) {
      return res.status(400).json({ error: "Invalid blocklist type." })
    }

    if (!user.focusShieldGlobalBlocklist[type].includes(value)) {
      user.focusShieldGlobalBlocklist[type].push(value)
      user.markModified(`focusShieldGlobalBlocklist.${type}`)
      await user.save()
    }

    res.json(user.focusShieldGlobalBlocklist)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// 7. Site Visit Logging / Doomscrolling
export const logVisit = async (req, res) => {
  try {
    await connectToMongo()
    const user = await User.findById(req.user.userId)
    if (!user) return res.status(404).json({ error: "User not found" })

    const { url } = req.body
    
    // Add warning alert mock or in integrity logs
    user.focusShieldIntegrityLogs.unshift({
      timestamp: new Date(),
      level: "INFO",
      message: `Visited url: ${url}`
    })

    // Keep log managed
    if (user.focusShieldIntegrityLogs.length > 50) {
      user.focusShieldIntegrityLogs.pop()
    }

    await user.save()
    res.json({ status: "logged", triggerDoomscrollAlert: false })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// 8. Security/Integrity Violations
export const getIntegrityLogs = async (req, res) => {
  try {
    await connectToMongo()
    const user = await User.findById(req.user.userId)
    if (!user) return res.status(404).json({ error: "User not found" })
    res.json(user.focusShieldIntegrityLogs || [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const logViolation = async (req, res) => {
  try {
    await connectToMongo()
    const user = await User.findById(req.user.userId)
    if (!user) return res.status(404).json({ error: "User not found" })

    const { type, message } = req.body

    user.focusShieldIntegrityLogs.unshift({
      timestamp: new Date(),
      level: "ERROR",
      message: `[INTEGRITY VIOLATION] Detect ${type}: ${message}`
    })

    await user.save()
    res.json({ status: "logged", integrityLogs: user.focusShieldIntegrityLogs })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// 9. Sync API
export const syncData = async (req, res) => {
  try {
    await connectToMongo()
    const user = await User.findById(req.user.userId)
    if (!user) return res.status(404).json({ error: "User not found" })

    const { deviceId, clientData, overrideType, simulateConflict } = req.body

    ensureDefaults(user)

    const deviceIdx = user.focusShieldDevices.findIndex(d => d.id === deviceId)
    if (deviceIdx !== -1) {
      user.focusShieldDevices[deviceIdx].lastSyncTime = new Date()
      user.focusShieldDevices[deviceIdx].status = "online"
      if (clientData && clientData.exceptions) {
        user.focusShieldDevices[deviceIdx].exceptions = clientData.exceptions
      }
    } else if (deviceId) {
      user.focusShieldDevices.push({
        id: deviceId,
        name: `Device-${deviceId}`,
        os: "Unknown",
        status: "online",
        lastSyncTime: new Date(),
        exceptions: clientData?.exceptions || { sites: [], apps: [] }
      })
    }

    const hasConflict = simulateConflict === true

    if (hasConflict && overrideType === "manual") {
      if (clientData && clientData.profiles) {
        user.focusShieldProfiles = clientData.profiles
      }
      user.focusShieldIntegrityLogs.unshift({
        timestamp: new Date(),
        level: "INFO",
        message: `Device '${deviceId}' synced. Manual conflict resolved.`
      })
    } else if (!hasConflict) {
      if (clientData && clientData.profiles) {
        // Simple Last-Write-Wins list merge / update
        clientData.profiles.forEach(clientProfile => {
          const idx = user.focusShieldProfiles.findIndex(p => p.name.toLowerCase() === clientProfile.name.toLowerCase())
          if (idx >= 0) {
            user.focusShieldProfiles[idx] = clientProfile
          } else {
            user.focusShieldProfiles.push(clientProfile)
          }
        })
      }
      user.focusShieldIntegrityLogs.unshift({
        timestamp: new Date(),
        level: "INFO",
        message: `Device '${deviceId}' synced automatically (Last-Write-Wins).`
      })
    }

    await user.save()
    res.json({
      status: hasConflict ? "conflict" : "synced",
      devices: user.focusShieldDevices,
      profiles: user.focusShieldProfiles
    })
  } catch (err) {
    console.error("FocusShield syncData error:", err)
    res.status(500).json({ error: "Sync failed." })
  }
}

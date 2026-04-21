import cron from "node-cron"
import User from "../models/User.js"
import { connectToMongo } from "../utils/db.js"
import { updateUserFocusScore } from "./focusScore.js"
import reminderScheduler from "./reminderScheduler.js"

/**
 * Reset daily session counters for all users at UTC midnight
 * Runs daily at 00:00 UTC
 */
export function scheduleDailySessionReset() {
  // Schedule job to run at midnight UTC (0 0 * * *)
  cron.schedule("0 0 * * *", async () => {
    try {
      await connectToMongo()
      
      const now = new Date()
      console.log(`[CRON] Running daily session counter reset at ${now.toISOString()}`)
      
      // Reset all users' daily session counts
      const result = await User.updateMany(
        {}, // All users
        {
          $set: {
            dailySessionCount: 0,
            lastSessionReset: now,
          },
        }
      )
      
      console.log(`[CRON] Reset session counters for ${result.modifiedCount} users`)
    } catch (error) {
      console.error("[CRON] Error resetting daily session counters:", error)
    }
  }, {
    timezone: "UTC"
  })
  
  console.log("[CRON] Daily session reset job scheduled for 00:00 UTC")
}

/**
 * Reset daily LLM token counters for all users at UTC midnight
 * Runs daily at 00:00 UTC
 */
export function scheduleDailyTokenReset() {
  // Schedule job to run at midnight UTC (0 0 * * *)
  cron.schedule("0 0 * * *", async () => {
    try {
      await connectToMongo()
      
      const now = new Date()
      console.log(`[CRON] Running daily token counter reset at ${now.toISOString()}`)
      
      // Reset all users' daily LLM token counts
      const result = await User.updateMany(
        {}, // All users
        {
          $set: {
            dailyLLMTokens: 0,
            lastTokenReset: now,
          },
        }
      )
      
      console.log(`[CRON] Reset token counters for ${result.modifiedCount} users`)
    } catch (error) {
      console.error("[CRON] Error resetting daily token counters:", error)
    }
  }, {
    timezone: "UTC"
  })
  
  console.log("[CRON] Daily token reset job scheduled for 00:00 UTC")
}

/**
 * Recalculate Focus Scores for all active users daily
 * Runs daily at 01:00 UTC (after session/token resets)
 */
export function scheduleDailyFocusScoreUpdate() {
  // Schedule job to run at 1 AM UTC (0 1 * * *)
  cron.schedule("0 1 * * *", async () => {
    try {
      await connectToMongo()
      
      const now = new Date()
      console.log(`[CRON] Running daily Focus Score recalculation at ${now.toISOString()}`)
      
      // Get all active users (users with at least one session in last 60 days)
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
      
      const activeUsers = await User.find({
        lastSessionDate: { $gte: sixtyDaysAgo }
      }).select('_id')
      
      console.log(`[CRON] Found ${activeUsers.length} active users to update`)
      
      let successCount = 0
      let errorCount = 0
      
      // Update Focus Scores in batches to avoid overwhelming the system
      for (const user of activeUsers) {
        try {
          await updateUserFocusScore(user._id)
          successCount++
        } catch (error) {
          console.error(`[CRON] Error updating Focus Score for user ${user._id}:`, error)
          errorCount++
        }
      }
      
      console.log(`[CRON] Focus Score update complete: ${successCount} successful, ${errorCount} errors`)
    } catch (error) {
      console.error("[CRON] Error in Focus Score recalculation job:", error)
    }
  }, {
    timezone: "UTC"
  })
  
  console.log("[CRON] Daily Focus Score update job scheduled for 01:00 UTC")
}

/**
 * Clean up old expired reminders
 * Runs daily at 02:00 UTC
 */
export function scheduleDailyReminderCleanup() {
  // Schedule job to run at 2 AM UTC (0 2 * * *)
  cron.schedule("0 2 * * *", async () => {
    try {
      await connectToMongo()
      
      const now = new Date()
      console.log(`[CRON] Running reminder cleanup at ${now.toISOString()}`)
      
      await reminderScheduler.cleanupExpiredReminders()
      
      console.log(`[CRON] Reminder cleanup complete`)
    } catch (error) {
      console.error("[CRON] Error in reminder cleanup job:", error)
    }
  }, {
    timezone: "UTC"
  })
  
  console.log("[CRON] Daily reminder cleanup job scheduled for 02:00 UTC")
}

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs() {
  console.log("[CRON] Initializing cron jobs...")
  scheduleDailySessionReset()
  scheduleDailyTokenReset()
  scheduleDailyFocusScoreUpdate()
  scheduleDailyReminderCleanup()
  console.log("[CRON] All cron jobs initialized")
}

import express from "express"
import { authenticateToken } from "../middleware/auth.js"
import { sessionCreateLimiter } from "../middleware/rateLimit.js"
import {
  startSession,
  endSession,
  finalizeSession,
  getHistory,
  getStreak,
  getQuota,
  logSession,
  getStats
} from "../controllers/habit.controller.js"

const router = express.Router()

// Start habit session
router.post("/start", authenticateToken, sessionCreateLimiter, startSession)

// End habit session
router.post("/:sessionId/end", authenticateToken, endSession)

// Finalize habit session (fallback)
router.post("/:sessionId/finalize", authenticateToken, finalizeSession)

// Get session history
router.get("/history", authenticateToken, getHistory)

// Get streak info
router.get("/streak", authenticateToken, getStreak)

// Get session quota (remaining sessions for the day)
router.get("/quota", authenticateToken, getQuota)

// Log a completed session
router.post("/session", authenticateToken, sessionCreateLimiter, logSession)

// Get user statistics
router.get("/stats", authenticateToken, getStats)

export default router;

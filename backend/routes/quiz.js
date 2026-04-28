import express from "express"
import { authenticateToken } from "../middleware/auth.js"
import { aiChatLimiter } from "../middleware/rateLimit.js"
import {
  generateQuiz,
  submitQuiz,
  getAnalytics,
  getQuizHistory,
} from "../controllers/quiz.controller.js"

const router = express.Router()

// Generate quiz questions
router.post("/generate", authenticateToken, aiChatLimiter, generateQuiz)

// Submit quiz answers
router.post("/submit", authenticateToken, submitQuiz)

// Get quiz analytics
router.get("/analytics", authenticateToken, getAnalytics)

// Get quiz history
router.get("/history", authenticateToken, getQuizHistory)

export default router

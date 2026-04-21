import express from "express"
import { authenticateToken } from "../middleware/auth.js"
import { aiChatLimiter } from "../middleware/rateLimit.js"
import {
  getTokenUsage,
  studyAssistant,
  generateStudyPackEndpoint,
  generateSummary,
  generateQuiz,
  generateFlashcards,
  generateInfographics,
  chat
} from "../controllers/ai.controller.js"

const router = express.Router()

// Get token usage information
router.get("/token-usage", authenticateToken, getTokenUsage)

// Study assistant endpoint
router.post("/study-assistant", authenticateToken, aiChatLimiter, studyAssistant)

// Generate study pack
router.post("/study-pack", authenticateToken, aiChatLimiter, generateStudyPackEndpoint)

// Generate summary
router.post("/summary", authenticateToken, aiChatLimiter, generateSummary)

// Generate quiz
router.post("/quiz", authenticateToken, aiChatLimiter, generateQuiz)

// Generate flashcards
router.post("/flashcards", authenticateToken, aiChatLimiter, generateFlashcards)

// Generate infographics
router.post("/infographics", authenticateToken, aiChatLimiter, generateInfographics)

// Chat endpoint
router.post("/chat", authenticateToken, aiChatLimiter, chat)

export default router

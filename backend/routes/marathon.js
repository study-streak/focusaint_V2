import express from "express"
import { authenticateToken } from "../middleware/auth.js"
import { getLeaderboard, getChallenges, acceptChallenge } from "../controllers/marathon.controller.js"

const router = express.Router()

router.get("/leaderboard", authenticateToken, getLeaderboard)
router.get("/challenges", authenticateToken, getChallenges)
router.post("/accept", authenticateToken, acceptChallenge)

export default router

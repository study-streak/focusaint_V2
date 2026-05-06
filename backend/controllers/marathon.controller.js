import User from "../models/User.js"
import MarathonChallenge from "../models/MarathonChallenge.js"
import HabitSession from "../models/HabitSession.js"
import { connectToMongo } from "../utils/db.js"

/**
 * Get the Marathon Leaderboard
 * Rankings based on focusScore and totalSessions
 */
export const getLeaderboard = async (req, res) => {
  try {
    await connectToMongo()
    
    // Fetch top 10 users ranked by focusScore
    const leaderboard = await User.find({})
      .select("name focusScore totalSessions currentStreak")
      .sort({ focusScore: -1 })
      .limit(10)
    
    // Add rank property
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      userId: user._id,
      name: user.name,
      focusScore: user.focusScore || 0,
      totalSessions: user.totalSessions || 0,
      streak: user.currentStreak || 0
    }))
    
    res.json(rankedLeaderboard)
  } catch (error) {
    console.error("Leaderboard fetch error:", error)
    res.status(500).json({ error: "Failed to fetch leaderboard" })
  }
}

/**
 * Get active Marathon Challenges
 */
export const getChallenges = async (req, res) => {
  try {
    await connectToMongo()
    
    const challenges = await MarathonChallenge.find({ isActive: true })
    
    // If no challenges exist, create some defaults for demonstration
    if (challenges.length === 0) {
      const defaults = [
        {
          title: "The Deep Dive",
          description: "Complete 3 Deep Mode sessions in one day.",
          targetValue: 3,
          type: "session_count",
          rewardXP: 250,
          difficulty: "medium"
        },
        {
          title: "Focus Master",
          description: "Accumulate 300 minutes of focus time this week.",
          targetValue: 300,
          type: "focus_time",
          rewardXP: 500,
          difficulty: "hard"
        },
        {
          title: "Unstoppable",
          description: "Reach a 7-day focus streak.",
          targetValue: 7,
          type: "streak_milestone",
          rewardXP: 1000,
          difficulty: "epic"
        }
      ]
      
      const created = await MarathonChallenge.insertMany(defaults)
      return res.json(created)
    }
    
    res.json(challenges)
  } catch (error) {
    console.error("Challenges fetch error:", error)
    res.status(500).json({ error: "Failed to fetch challenges" })
  }
}

/**
 * Accept a Marathon Challenge
 */
export const acceptChallenge = async (req, res) => {
  try {
    const { challengeId } = req.body
    await connectToMongo()
    
    const user = await User.findById(req.user.userId)
    if (!user) return res.status(404).json({ error: "User not found" })
    
    // Check if already accepted
    const alreadyAccepted = user.marathonChallenges.find(
      c => c.challengeId.toString() === challengeId
    )
    
    if (alreadyAccepted) {
      return res.status(400).json({ error: "Challenge already accepted" })
    }
    
    user.marathonChallenges.push({ challengeId })
    await user.save()
    
    res.json({ message: "Challenge accepted successfully" })
  } catch (error) {
    console.error("Challenge accept error:", error)
    res.status(500).json({ error: "Failed to accept challenge" })
  }
}

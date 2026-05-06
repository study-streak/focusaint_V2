import mongoose from "mongoose"

const marathonChallengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    targetValue: {
      type: Number, // e.g., 300 minutes, 10 sessions, etc.
      required: true,
    },
    type: {
      type: String,
      enum: ["focus_time", "session_count", "streak_milestone"],
      required: true,
    },
    rewardXP: {
      type: Number,
      default: 100,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "epic"],
      default: "medium",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: Date,
    endDate: Date,
  },
  { timestamps: true }
)

export default mongoose.model("MarathonChallenge", marathonChallengeSchema)

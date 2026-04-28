import mongoose from "mongoose"

const streakRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    totalSessions: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: Date,
      default: null,
    },
    streakHistory: [
      {
        startDate: Date,
        endDate: Date,
        length: Number,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

// Indexes for performance optimization
streakRecordSchema.index({ userId: 1 }, { unique: true })
streakRecordSchema.index({ currentStreak: -1 })
streakRecordSchema.index({ lastActiveDate: -1 })

export default mongoose.model("StreakRecord", streakRecordSchema)

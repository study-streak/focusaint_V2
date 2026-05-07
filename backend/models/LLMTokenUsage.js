import mongoose from "mongoose"

const llmTokenUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    tokensUsed: {
      type: Number,
      required: true,
      default: 0,
    },
    requestCount: {
      type: Number,
      required: true,
      default: 0,
    },
    feature: {
      type: String,
      enum: ["study_coach", "quiz_generation", "note_summary", "recommendations", "chat"],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

// Indexes for performance optimization
llmTokenUsageSchema.index({ userId: 1, date: -1 })
llmTokenUsageSchema.index({ date: 1 }, { expireAfterSeconds: 2592000 }) // 30 days TTL

export default mongoose.model("LLMTokenUsage", llmTokenUsageSchema)

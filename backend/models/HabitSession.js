import mongoose from "mongoose"

const habitSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0, // in minutes
    },
    sessionDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
    },
    notes: {
      type: String,
      default: "",
    },
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

habitSessionSchema.index({ userId: 1, sessionDate: 1 })

// Additional indexes for performance optimization
habitSessionSchema.index({ userId: 1, sessionDate: -1 })
habitSessionSchema.index({ userId: 1, status: 1 })
habitSessionSchema.index({ startTime: -1 })
habitSessionSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model("HabitSession", habitSessionSchema)

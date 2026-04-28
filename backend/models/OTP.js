import mongoose from "mongoose"

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Auto-delete after expiry
    },
    type: {
      type: String,
      enum: ["reset", "signup"],
      default: "signup",
    },
    attempts: {
      type: Number,
      default: 0,
    },
    signupData: {
      name: String,
      learningGoal: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

export default mongoose.model("OTP", otpSchema)

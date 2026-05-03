import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function() { return !this.googleId }, // Required only for standard email/password signup
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    profileImage: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    learningGoal: {
      type: String,
      default: "casual_learner",
    },
    preferredStudyTime: {
      type: String,
      default: "09:00",
    },
    modePreference: {
      type: String,
      enum: ["habit", "deep"],
      default: "habit",
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
    lastSessionDate: {
      type: Date,
      default: null,
    },
    subscriptionTier: {
      type: String,
      enum: ["free", "premium", "pro"],
      default: "free",
      alias: "tier", // Allow using 'tier' as an alias
    },
    // StripeCustomerId removed. Add DodoPayments fields here if needed.
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    dailySessionCount: {
      type: Number,
      default: 0,
    },
    lastSessionReset: {
      type: Date,
      default: Date.now,
    },
    dailyLLMTokens: {
      type: Number,
      default: 0,
    },
    lastTokenReset: {
      type: Date,
      default: Date.now,
    },
    focusScore: {
      type: Number,
      default: 0,
    },
    focusScoreHistory: [{
      score: Number,
      date: Date
    }],
    notificationPreferences: {
      browserPermission: {
        type: String,
        enum: ['granted', 'denied', 'default', 'unsupported'],
        default: 'default',
      },
      enabled: {
        type: Boolean,
        default: false,
      },
      lastPromptedAt: {
        type: Date,
        default: null,
      },
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

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return
  this.password = await bcrypt.hash(this.password, 10)
})

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// Indexes for performance optimization
userSchema.index({ email: 1 }, { unique: true })
userSchema.index({ subscriptionTier: 1 })
userSchema.index({ currentStreak: -1 })
userSchema.index({ lastSessionDate: -1 })
userSchema.index({ focusScore: -1 })

export default mongoose.model("User", userSchema)

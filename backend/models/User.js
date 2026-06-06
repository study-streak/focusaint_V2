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
    spacedReviewIntervals: {
      type: [Number],
      default: [1, 3, 7]
    },
    marathonChallenges: [{
      challengeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MarathonChallenge"
      },
      status: {
        type: String,
        enum: ["accepted", "completed"],
        default: "accepted"
      },
      progress: {
        type: Number,
        default: 0
      },
      acceptedAt: {
        type: Date,
        default: Date.now
      },
      completedAt: Date
    }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    focusShieldProfiles: {
      type: [{
        name: String,
        icon: String,
        sites: [String],
        apps: [String],
        elementBlocking: {
          hideRecommendations: { type: Boolean, default: false },
          blockShorts: { type: Boolean, default: false },
          blockInfiniteScroll: { type: Boolean, default: false }
        }
      }],
      default: []
    },
    focusShieldDevices: {
      type: [{
        id: String,
        name: String,
        os: String,
        status: String,
        lastSyncTime: Date,
        exceptions: {
          sites: { type: [String], default: [] },
          apps: { type: [String], default: [] }
        }
      }],
      default: []
    },
    focusShieldGlobalBlocklist: {
      sites: { type: [String], default: ["facebook.com", "instagram.com", "twitter.com", "youtube.com", "reddit.com"] },
      apps: { type: [String], default: ["Slack", "Discord", "Steam"] }
    },
    focusShieldActiveSession: {
      isRunning: { type: Boolean, default: false },
      profileName: { type: String, default: null },
      durationLeft: { type: Number, default: 0 },
      totalDuration: { type: Number, default: 0 },
      isLocked: { type: Boolean, default: false },
      startTime: { type: Date, default: null },
      overrideMinutesUsed: { type: Number, default: 0 },
      blockMode: { type: String, default: "Temporary Session" },
      cooldownDurationLeft: { type: Number, default: 0 },
      warningTriggered: { type: Boolean, default: false },
      habitSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "HabitSession", default: null }
    },
    focusShieldIntegrityLogs: {
      type: [{
        timestamp: { type: Date, default: Date.now },
        level: String,
        message: String
      }],
      default: []
    }
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

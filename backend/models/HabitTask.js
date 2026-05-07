import mongoose from "mongoose"

const habitTaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    duration: {
      type: Number, // minutes
      required: true,
      default: 25,
    },
    category: {
      type: String,
      enum: ["study","coding", "reading", "writing", "problem-solving", "project", "review", "other"],
      default: "other",
    },
    // Date the task is assigned to (YYYY-MM-DD)
    assignedDate: {
      type: String,
      required: true,
    },
    // Month-Year reference (YYYY-MM) for filtering monthly plans
    monthYear: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // Track which streak update this task triggered
    streakUpdated: {
      type: Boolean,
      default: false,
    },
    // Deadline for task completion (YYYY-MM-DD)
    deadline: {
      type: String,
      default: null,
    },
    // Files/Links attached to task
    attachments: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        type: {
          type: String,
          enum: ["file", "link"],
          required: true,
        },
        name: String, // Filename or link title
        url: String, // S3 URL or external link
        s3Key: String, // Key for S3 object (for deletion)
        fileSize: Number, // In bytes (for files)
        mimeType: String, // e.g., "application/pdf"
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        openedAt: Date, // Timestamp when first opened
        openCount: {
          type: Number,
          default: 0,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: Date,
        dueDate: {
          type: String, // YYYY-MM-DD
          default: null,
        },
      },
    ],
    // Distribute task across multiple days (empty = single day task)
    distributedAcrossDays: [
      {
        date: String, // YYYY-MM-DD
        portion: Number, // 0-100 (percentage of task for that day)
        completed: Boolean,
        completedAt: Date,
      },
    ],
    // Toggle proctored mode when opening attachments
    proctoredMode: {
      type: Boolean,
      default: false,
    },
    proctoredPreset: {
      type: String,
      enum: ["quick", "deep"],
      default: "quick",
    },
    // Proctored mode settings
    proctoredSettings: {
      // Prevent copying/pasting
      disableCopyPaste: {
        type: Boolean,
        default: false,
      },
      // Full screen requirement
      requireFullScreen: {
        type: Boolean,
        default: false,
      },
      // Hide taskbar/other windows
      lockScreen: {
        type: Boolean,
        default: false,
      },
      // Disable right-click menu
      disableRightClick: {
        type: Boolean,
        default: false,
      },
      // Track mouse/keyboard activity
      trackActivity: {
        type: Boolean,
        default: false,
      },
      // Time limit for working on attachments (minutes)
      timeLimit: Number,
    },
    // Activity log for proctored sessions
    proctoredSessions: [
      {
        startedAt: Date,
        endedAt: Date,
        duration: Number, // minutes
        attachmentId: mongoose.Schema.Types.ObjectId,
        proctoredPreset: {
          type: String,
          enum: ["quick", "deep"],
          default: "quick",
        },
        proctoredSettingsSnapshot: {
          disableCopyPaste: Boolean,
          requireFullScreen: Boolean,
          lockScreen: Boolean,
          disableRightClick: Boolean,
          trackActivity: Boolean,
          timeLimit: Number,
        },
        violations: [String], // e.g., ["left_fullscreen", "copy_paste_attempt"]
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

// Index for efficient queries
habitTaskSchema.index({ userId: 1, assignedDate: 1 })
habitTaskSchema.index({ userId: 1, monthYear: 1 })
habitTaskSchema.index({ userId: 1, completed: 1 })
habitTaskSchema.index({ userId: 1, deadline: 1 })
habitTaskSchema.index({ "attachments.url": 1 })

export default mongoose.model("HabitTask", habitTaskSchema)

import mongoose from "mongoose"

const quizResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HabitSession",
      default: null,
    },
    questions: [
      {
        question: {
          type: String,
          required: true,
        },
        options: [
          {
            type: String,
            required: true,
          },
        ],
        correctAnswer: {
          type: Number,
          required: true,
        },
        userAnswer: {
          type: Number,
          default: null,
        },
        isCorrect: {
          type: Boolean,
          default: false,
        },
      },
    ],
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctAnswers: {
      type: Number,
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

// Indexes for performance
quizResultSchema.index({ userId: 1, completedAt: -1 })
quizResultSchema.index({ userId: 1, score: -1 })
quizResultSchema.index({ sessionId: 1 })

export default mongoose.model("QuizResult", quizResultSchema)

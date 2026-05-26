import mongoose from 'mongoose';

const spacedReviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: false
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HabitTask',
    required: false
  },
  attachmentId: {
    type: String,
    required: false
  },
  contentUrl: {
    type: String,
    required: false
  },
  materialName: {
    type: String,
    required: false
  },
  originalSummary: {
    type: String,
    required: false
  },
  reviewNumber: {
    type: Number, // 1, 2, 3... (e.g., 1-day, 3-day, 7-day)
    required: true
  },
  scheduledFor: {
    type: Date,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  recallScore: {
    type: Number, // 0-100
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

spacedReviewSchema.index({ userId: 1, scheduledFor: 1, isCompleted: 1 });

const SpacedReview = mongoose.model('SpacedReview', spacedReviewSchema);
export default SpacedReview;

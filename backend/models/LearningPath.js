import mongoose from 'mongoose';

const learningPathSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  totalDays: {
    type: Number,
    default: 30
  },
  currentDay: {
    type: Number,
    default: 1
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

learningPathSchema.index({ userId: 1, topic: 1 });

const LearningPath = mongoose.model('LearningPath', learningPathSchema);
export default LearningPath;

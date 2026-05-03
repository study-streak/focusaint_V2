import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  contentType: {
    type: String,
    enum: ['video', 'pdf'],
    required: true
  },
  contentUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  learningObjectives: [{
    type: String
  }],
  pathId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPath',
    required: true
  },
  dayNumber: {
    type: Number,
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz' // Or keep it embedded if quiz generation is dynamic
  }
}, {
  timestamps: true
});

lessonSchema.index({ pathId: 1, dayNumber: 1 }, { unique: true });

const Lesson = mongoose.model('Lesson', lessonSchema);
export default Lesson;

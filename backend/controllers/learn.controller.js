import LearningPath from '../models/LearningPath.js';
import Lesson from '../models/Lesson.js';
import LessonProgress from '../models/LessonProgress.js';
import SpacedReview from '../models/SpacedReview.js';
import { callLLM } from '../services/llmLayer.js';

export const generateLearningPath = async (req, res) => {
  try {
    const { topic, difficulty = 'beginner', duration = 30 } = req.body;
    const userId = req.user.id;

    // Call AI to generate structured path
    const prompt = `You are an expert curriculum designer.
Create a ${duration}-day learning path for: ${topic}
User level: ${difficulty}
For each day, provide:
1. Day number
2. Topic title
3. One YouTube search query to find a relevant video
4. 3 Key learning objectives
Return as JSON:
{
  "title": "Mastering ${topic}",
  "path": [
    {
      "day": 1,
      "topic": "Introduction to ${topic}",
      "searchQuery": "${topic} basics",
      "objectives": ["Obj 1", "Obj 2", "Obj 3"]
    }
  ]
}`;

    const aiResponse = await callLLM({
      expectJson: true,
      systemPrompt: "You are an expert curriculum designer. Return strict JSON.",
      userPrompt: prompt
    }); 
    const pathData = typeof aiResponse === 'string' ? JSON.parse(aiResponse) : aiResponse;

    const learningPath = await LearningPath.create({
      userId,
      topic,
      title: pathData.title,
      difficulty,
      totalDays: duration
    });

    const lessons = pathData.path.map(item => ({
      pathId: learningPath._id,
      dayNumber: item.day,
      title: item.topic,
      contentType: 'video', // Default to video
      contentUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(item.searchQuery)}`, // Placeholder
      learningObjectives: item.objectives
    }));

    await Lesson.insertMany(lessons);

    res.status(201).json(learningPath);
  } catch (error) {
    console.error('Error generating learning path:', error);
    res.status(500).json({ error: 'Failed to generate learning path' });
  }
};

export const getLesson = async (req, res) => {
  try {
    const { pathId, dayNumber } = req.params;
    const userId = req.user.id;

    const lesson = await Lesson.findOne({ pathId, dayNumber });
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const progress = await LessonProgress.findOne({ userId, lessonId: lesson._id });

    res.json({ lesson, progress });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
};

export const submitReflection = async (req, res) => {
  try {
    const { lessonId, reflection, quizScore } = req.body;
    const userId = req.user.id;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    let progress = await LessonProgress.findOne({ userId, lessonId });
    if (!progress) {
      progress = new LessonProgress({ userId, lessonId, pathId: lesson.pathId });
    }

    progress.reflection = reflection;
    progress.quizScore = quizScore;
    progress.passedQuiz = quizScore >= 80;
    progress.isCompleted = true;
    progress.completedAt = new Date();

    await progress.save();

    // Schedule Spaced Reviews (1-day, 3-day, 7-day as per common SRS)
    const intervals = [1, 3, 7];
    const reviews = intervals.map((days, index) => ({
      userId,
      lessonId,
      reviewNumber: index + 1,
      scheduledFor: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    }));

    await SpacedReview.insertMany(reviews);

    // Unlock next lesson
    const path = await LearningPath.findById(lesson.pathId);
    if (path.currentDay === lesson.dayNumber && path.currentDay < path.totalDays) {
      path.currentDay += 1;
      await path.save();
    }

    res.json({ success: true, progress, nextDay: path.currentDay });
  } catch (error) {
    console.error('Error submitting reflection:', error);
    res.status(500).json({ error: 'Failed to submit reflection' });
  }
};

export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const paths = await LearningPath.find({ userId }).sort({ updatedAt: -1 });
    const reviewsDue = await SpacedReview.find({ 
      userId, 
      scheduledFor: { $lte: new Date() },
      isCompleted: false 
    }).populate('lessonId');

    res.json({ paths, reviewsDue });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

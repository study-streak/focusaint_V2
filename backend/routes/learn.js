import express from 'express';
import { 
  generateLearningPath, 
  getLesson, 
  submitReflection, 
  getDashboardData 
} from '../controllers/learn.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/generate-path', generateLearningPath);
router.get('/dashboard', getDashboardData);
router.get('/lesson/:pathId/:dayNumber', getLesson);
router.post('/submit-reflection', submitReflection);

export default router;

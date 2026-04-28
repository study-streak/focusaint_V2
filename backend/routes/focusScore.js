import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getFocusScore,
  updateFocusScore,
  getRank,
  getTrend
} from '../controllers/focusScore.controller.js';

const router = express.Router();

/**
 * @route   GET /api/focus-score
 * @desc    Get current user's Focus Score with breakdown
 * @access  Private
 */
router.get('/', authenticateToken, getFocusScore);

/**
 * @route   POST /api/focus-score/update
 * @desc    Manually trigger Focus Score recalculation
 * @access  Private
 */
router.post('/update', authenticateToken, updateFocusScore);

/**
 * @route   GET /api/focus-score/rank
 * @desc    Get user's Focus Score rank and percentile
 * @access  Private
 */
router.get('/rank', authenticateToken, getRank);

/**
 * @route   GET /api/focus-score/trend
 * @desc    Get Focus Score trend (up/down/stable)
 * @access  Private
 */
router.get('/trend', authenticateToken, getTrend);

export default router;

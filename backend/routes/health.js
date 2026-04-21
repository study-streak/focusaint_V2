import express from 'express';
import {
  getHealth,
  getDetailedHealth,
  getMetrics,
  getReadiness,
  getLiveness,
  getDashboard
} from '../controllers/health.controller.js';

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Basic health check endpoint
 * @access  Public
 */
router.get('/', getHealth);

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed health check with system metrics
 * @access  Public
 */
router.get('/detailed', getDetailedHealth);

/**
 * @route   GET /api/health/metrics
 * @desc    Get application metrics snapshot
 * @access  Public (should be protected in production)
 */
router.get('/metrics', getMetrics);

/**
 * @route   GET /api/health/ready
 * @desc    Readiness probe for Kubernetes/container orchestration
 * @access  Public
 */
router.get('/ready', getReadiness);

/**
 * @route   GET /api/health/live
 * @desc    Liveness probe for Kubernetes/container orchestration
 * @access  Public
 */
router.get('/live', getLiveness);

/**
 * @route   GET /api/health/dashboard
 * @desc    Get monitoring dashboard data
 * @access  Public (should be protected in production with admin auth)
 */
router.get('/dashboard', getDashboard);

export default router;

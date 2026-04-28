import express from 'express';

import { authenticateToken } from '../middleware/auth.js';
import {
  createSubscription,
  getSubscriptionStatus,
  cancelSubscription,
  reactivateSubscription,
  changeSubscriptionPlan,
  handleDodoWebhook
} from '../controllers/subscription.controller.js';

const router = express.Router();
// Dodo Payments webhook endpoint
router.post('/webhook/dodo', express.json(), handleDodoWebhook);


/**
 * @route   POST /api/subscription/create
 * @desc    Create a subscription (Dodo Payments or free)
 * @access  Private
 * @body    { plan: 'premium_monthly' | 'premium_yearly' | 'free', dodoPaymentId?: string }
 */
router.post('/create', authenticateToken, createSubscription);

/**
 * @route   GET /api/subscription/status
 * @desc    Get current subscription status
 * @access  Private
 */
router.get('/status', authenticateToken, getSubscriptionStatus);

/**
 * @route   POST /api/subscription/cancel
 * @desc    Cancel subscription at period end
 * @access  Private
 */
router.post('/cancel', authenticateToken, cancelSubscription);

/**
 * @route   POST /api/subscription/reactivate
 * @desc    Reactivate a canceled subscription
 * @access  Private
 */
router.post('/reactivate', authenticateToken, reactivateSubscription);

/**
 * @route   POST /api/subscription/change-plan
 * @desc    Change subscription plan (upgrade/downgrade)
 * @access  Private
 * @body    { newPlan: 'premium_monthly' | 'premium_yearly' }
 */
router.post('/change-plan', authenticateToken, changeSubscriptionPlan);



export default router;

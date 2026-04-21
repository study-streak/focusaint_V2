import Subscription from '../models/Subscription.js';

/**
 * Middleware to check if a user has an active premium subscription
 * Use this middleware after authenticateToken to protect premium-only endpoints
 * 
 * @example
 * router.get('/premium-feature', authenticateToken, requirePremium, controller);
 */
export const requirePremium = async (req, res, next) => {
  try {
    // User should already be authenticated by authenticateToken middleware
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Query for user's subscription
    const subscription = await Subscription.findOne({ userId: req.user.userId });

    // Check if subscription exists and has active/trialing status
    if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
      return res.status(403).json({
        error: 'Premium subscription required',
        tier: 'free',
        upgradeUrl: '/pricing'
      });
    }

    // Attach subscription info to request for use in controllers
    req.subscription = subscription;

    next();
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return res.status(500).json({
      error: 'Failed to verify subscription status'
    });
  }
};

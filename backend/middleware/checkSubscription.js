import User from '../models/User.js';
import { checkFeatureAccess } from '../utils/featureAvailability.js';
import { TierRestrictionError } from '../utils/errors.js';

/**
 * Middleware to check if a user has at least Premium tier
 */
export const requirePremium = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.user.userId).select('subscriptionTier');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const tier = user.subscriptionTier || 'free';
    if (tier === 'free') {
      return res.status(403).json(new TierRestrictionError('premium_feature', 'free', 'premium').toJSON());
    }

    next();
  } catch (error) {
    console.error('Error checking premium status:', error);
    next(error);
  }
};

/**
 * Middleware to check if a user has Pro tier
 */
export const requirePro = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.user.userId).select('subscriptionTier');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const tier = user.subscriptionTier || 'free';
    if (tier !== 'pro') {
      return res.status(403).json(new TierRestrictionError('pro_feature', tier, 'pro').toJSON());
    }

    next();
  } catch (error) {
    console.error('Error checking pro status:', error);
    next(error);
  }
};

/**
 * Higher-order middleware to check for a specific feature access
 * @param {string} featureName - The key of the feature to check
 */
export const requireFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await User.findById(req.user.userId).select('subscriptionTier');
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const access = checkFeatureAccess(featureName, user.subscriptionTier);
      
      if (!access.allowed) {
        return res.status(403).json(access.error.toJSON());
      }

      next();
    } catch (error) {
      console.error(`Error checking access for ${featureName}:`, error);
      next(error);
    }
  };
};

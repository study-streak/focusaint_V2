import { TierRestrictionError } from './errors.js'

/**
 * Feature matrix defining required tiers for specific features
 */
const featureMatrix = {
  'cloud_sync': {
    requiredTier: 'premium',
    error: TierRestrictionError.cloudSync
  },
  'deep_mode': {
    requiredTier: 'premium',
    error: TierRestrictionError.deepMode
  },
  'data_export': {
    requiredTier: 'premium',
    error: TierRestrictionError.dataExport
  },
  'custom_ai_persona': {
    requiredTier: 'premium',
    error: TierRestrictionError.customAIPersona
  },
  'unlimited_history': {
    requiredTier: 'premium',
    error: TierRestrictionError.unlimitedHistory
  },
  'streak_insurance': {
    requiredTier: 'premium',
    error: TierRestrictionError.streakInsurance
  },
  'private_groups': {
    requiredTier: 'premium',
    error: TierRestrictionError.privateGroups
  },
  'admin_dashboard': {
    requiredTier: 'pro',
    error: (tier) => new TierRestrictionError(
      'admin_dashboard',
      tier,
      'pro',
      'Admin dashboard is only available for Pro users.'
    )
  },
  'team_management': {
    requiredTier: 'pro',
    error: (tier) => new TierRestrictionError(
      'team_management',
      tier,
      'pro',
      'Team management is only available for Pro users.'
    )
  },
  'advanced_analytics': {
    requiredTier: 'premium',
    error: (tier) => new TierRestrictionError(
      'advanced_analytics',
      tier,
      'premium',
      'Advanced analytics require a Premium subscription.'
    )
  }
}

/**
 * Check if a user has access to a specific feature based on their tier
 * @param {string} feature - Feature key
 * @param {string} userTier - User's subscription tier ('free', 'premium', 'pro')
 * @returns {Object} { allowed: boolean, requirement: string, error: TierRestrictionError|null }
 */
export function checkFeatureAccess(feature, userTier = 'free') {
  const requirement = featureMatrix[feature]
  
  if (!requirement) {
    // Feature not in matrix is available to all
    return { allowed: true, requirement: 'free', error: null }
  }
  
  const tierRank = { free: 0, premium: 1, pro: 2 }
  const userRank = tierRank[userTier] || 0
  const requiredRank = tierRank[requirement.requiredTier]
  
  const allowed = userRank >= requiredRank
  
  return {
    allowed,
    requirement: requirement.requiredTier,
    error: allowed ? null : requirement.error(userTier)
  }
}

export default {
  checkFeatureAccess
}

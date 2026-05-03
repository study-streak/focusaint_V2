# Business Logic Layer - Developer Integration Guide

## Overview

This guide provides developers with practical examples for implementing subscription tier checks, usage limits, and feature restrictions across the FocusAint backend.

---

## Table of Contents

1. [Session Management](#session-management)
2. [Token Tracking](#token-tracking)
3. [Feature Access Control](#feature-access-control)
4. [History & Data Filters](#history--data-filters)
5. [Error Handling](#error-handling)
6. [Testing Patterns](#testing-patterns)

---

## Session Management

### Pattern 1: Check Before Logging Session

**Scenario**: User attempts to log a focus session

```javascript
// controllers/habit.controller.js
export const logSession = async (req, res, next) => {
  try {
    const { duration, mode } = req.body
    const user = await User.findById(req.user.userId)
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // CHECK SESSION LIMIT
    const limitCheck = await checkSessionLimit(user)
    
    if (!limitCheck.allowed) {
      return res.status(403).json({
        error: 'SESSION_LIMIT_REACHED',
        message: `You've reached your daily limit of ${limitCheck.limit} sessions. Upgrade to premium for unlimited sessions.`,
        details: {
          currentCount: user.dailySessionCount,
          limit: limitCheck.limit,
          resetAt: new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString()
        }
      })
    }
    
    // Proceed with session logging
    const session = await HabitSession.create({
      userId: user._id,
      duration,
      mode,
      timestamp: new Date()
    })
    
    // INCREMENT SESSION COUNTER
    await incrementSessionCounter(req.user.userId)
    
    // Update user stats
    user.totalSessions += 1
    user.lastSessionDate = new Date()
    
    // Update streak
    const isNewDay = isNewStreakDay(user.lastSessionDate, new Date())
    if (isNewDay) {
      user.currentStreak += 1
      if (user.currentStreak > user.longestStreak) {
        user.longestStreak = user.currentStreak
      }
    }
    
    await user.save()
    
    res.status(201).json({
      session,
      streak: user.currentStreak,
      dailyCount: user.dailySessionCount,
      newStreakRecord: user.currentStreak > user.longestStreak
    })
    
  } catch (error) {
    console.error('Session logging error:', error)
    res.status(500).json({ error: 'Failed to log session' })
  }
}
```

### Pattern 2: Show Remaining Quota

**Scenario**: Frontend needs to display remaining sessions

```javascript
// controllers/habit.controller.js
export const getQuota = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const limitCheck = await checkSessionLimit(user)
    
    res.json({
      tier: user.subscriptionTier,
      remaining: limitCheck.remaining,
      limit: limitCheck.limit,
      unlimited: limitCheck.limit === -1,
      resetAt: new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString(),
      
      // Additional context for UI
      message: limitCheck.unlimited 
        ? 'Unlimited sessions this month' 
        : `${limitCheck.remaining} of ${limitCheck.limit} sessions remaining today`
    })
    
  } catch (error) {
    console.error('Quota fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch quota' })
  }
}
```

### Pattern 3: Reset on Midnight

**Scenario**: Automatic reset when day changes

```javascript
// utils/sessionCounter.js
export async function checkAndResetDailyCounter(user) {
  const now = new Date()
  const lastReset = new Date(user.lastSessionReset)
  
  // Compare UTC dates
  const nowUTC = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  ))
  
  const lastResetUTC = new Date(Date.UTC(
    lastReset.getUTCFullYear(),
    lastReset.getUTCMonth(),
    lastReset.getUTCDate()
  ))
  
  // Reset if UTC date changed
  if (nowUTC > lastResetUTC) {
    user.dailySessionCount = 0
    user.lastSessionReset = now
    await user.save()
    
    console.log(`Session counter reset for user ${user._id}`)
  }
  
  return user
}
```

---

## Token Tracking

### Pattern 1: Check Before AI Request

**Scenario**: User requests AI quiz generation

```javascript
// controllers/quiz.controller.js
import { 
  checkTokenLimit, 
  trackTokenUsage, 
  estimateTokenCount 
} from '../services/tokenTracking.js'

export const generateQuiz = async (req, res) => {
  try {
    // CHECK TOKEN LIMIT
    const tokenCheck = await checkTokenLimit(req.user.id)
    
    if (!tokenCheck.allowed) {
      return res.status(403).json({
        error: 'TOKEN_LIMIT_EXCEEDED',
        message: 'Daily LLM token limit exceeded. Resets at midnight UTC.',
        details: {
          used: tokenCheck.limit - tokenCheck.remaining,
          limit: tokenCheck.limit,
          resetAt: tokenCheck.resetAt.toISOString()
        }
      })
    }
    
    const { videoUrl, questionCount = 5 } = req.body
    
    // Generate quiz using AI
    const questions = await generateQuizQuestions({
      videoUrl,
      questionCount: Math.min(Math.max(questionCount, 3), 10)
    })
    
    // TRACK TOKEN USAGE
    const tokensUsed = estimateTokenCount(JSON.stringify(questions))
    await trackTokenUsage(req.user.id, tokensUsed, 'quiz_generation')
    
    res.json({ questions })
    
  } catch (error) {
    console.error('Quiz generation error:', error)
    res.status(500).json({ error: 'Failed to generate quiz' })
  }
}
```

### Pattern 2: Estimate Tokens Before Processing

**Scenario**: Validate token availability before expensive operation

```javascript
// services/quizService.js
import { estimateTokenCount } from './tokenTracking.js'

export async function validateQuizGenerationCost(videoMetadata, questionCount) {
  // Estimate tokens needed
  const estimatedResponse = `
    ${questionCount} multiple choice questions with explanations.
    Based on video: ${videoMetadata.title}
  `
  
  const estimatedTokens = estimateTokenCount(estimatedResponse) + 500 // buffer
  
  return {
    estimatedTokens,
    message: `This will use approximately ${estimatedTokens} tokens`
  }
}

// Usage in controller
const user = await User.findById(req.user.id)
const tokenCheck = await checkTokenLimit(req.user.id)
const estimate = await validateQuizGenerationCost(metadata, questionCount)

if (estimate.estimatedTokens > tokenCheck.remaining) {
  // Not enough tokens, inform user
  return res.status(403).json({
    error: 'INSUFFICIENT_TOKENS',
    message: estimate.message,
    details: {
      needed: estimate.estimatedTokens,
      available: tokenCheck.remaining,
      upgradeUrl: '/pricing'
    }
  })
}
```

### Pattern 3: Show Token Usage Analytics

**Scenario**: User views their token usage stats

```javascript
// controllers/ai.controller.js
export const getTokenUsage = async (req, res) => {
  try {
    const tokenCheck = await checkTokenLimit(req.user.id)
    const stats = await getTokenUsageStats(req.user.id, 30)
    
    res.json({
      current: {
        used: tokenCheck.limit - tokenCheck.remaining,
        remaining: tokenCheck.remaining,
        limit: tokenCheck.limit,
        resetAt: tokenCheck.resetAt.toISOString(),
        percentUsed: Math.round(
          ((tokenCheck.limit - tokenCheck.remaining) / tokenCheck.limit) * 100
        )
      },
      stats: {
        last30Days: stats.total,
        dailyAverage: Math.round(stats.total / 30),
        history: stats.history.map(day => ({
          date: day.date.toISOString().split('T')[0],
          tokens: day.tokensUsed,
          requests: day.requestCount
        }))
      },
      recommendations: generateTokenRecommendations(tokenCheck)
    })
    
  } catch (error) {
    console.error('Token usage fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch token usage' })
  }
}

function generateTokenRecommendations(tokenCheck) {
  const percentUsed = ((tokenCheck.limit - tokenCheck.remaining) / tokenCheck.limit) * 100
  
  if (percentUsed > 80) {
    return {
      message: 'You\'re running low on tokens',
      suggestion: 'Consider upgrading to Premium for 10x more tokens'
    }
  } else if (percentUsed > 50) {
    return {
      message: 'You\'ve used over half your daily tokens',
      suggestion: 'Use tokens wisely - they reset at midnight UTC'
    }
  } else {
    return {
      message: 'You have plenty of tokens today',
      suggestion: 'Keep up the learning!'
    }
  }
}
```

---

## Feature Access Control

### Pattern 1: Middleware for Premium-Only Routes

**Scenario**: Protect routes that require Premium subscription

```javascript
// middleware/requirePremium.js
import User from '../models/User.js'
import { TierRestrictionError } from '../utils/errors.js'

export const requirePremium = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    
    if (user.subscriptionTier === 'free') {
      throw TierRestrictionError.cloudSync(user.subscriptionTier)
    }
    
    next()
    
  } catch (error) {
    if (error instanceof TierRestrictionError) {
      return res.status(403).json({
        error: error.code,
        message: error.message,
        details: error.details
      })
    }
    
    res.status(500).json({ error: 'Authentication failed' })
  }
}

// Usage in routes
app.get('/api/cloud-sync/data', requirePremium, getCloudSyncData)
app.post('/api/data-export', requirePremium, exportUserData)
```

### Pattern 2: Feature Check Within Controller

**Scenario**: Feature available to multiple tiers, with different limitations

```javascript
// controllers/user.controller.js
export const getUserAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    
    // BASE DATA - Available to all
    const basicAnalytics = {
      totalSessions: user.totalSessions,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak
    }
    
    // ENHANCED DATA - Premium only
    let advancedAnalytics = {}
    if (user.subscriptionTier !== 'free') {
      advancedAnalytics = {
        sessionTrends: await calculateSessionTrends(user._id),
        productivityScore: calculateProductivityScore(user),
        recommendedCourses: await getRecommendedCourses(user),
        timeDistribution: await getSessionTimeDistribution(user._id)
      }
    }
    
    // TEAM ANALYTICS - Pro only
    let teamAnalytics = {}
    if (user.subscriptionTier === 'pro') {
      teamAnalytics = {
        teamPerformance: await getTeamPerformance(user._id),
        memberProgress: await getMembersProgress(user._id),
        groupAnalytics: await getGroupAnalytics(user._id)
      }
    }
    
    res.json({
      tier: user.subscriptionTier,
      basic: basicAnalytics,
      advanced: advancedAnalytics,
      team: teamAnalytics
    })
    
  } catch (error) {
    console.error('Analytics fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
}
```

### Pattern 3: Conditional Feature Availability

**Scenario**: Check feature availability before action

```javascript
// utils/featureAvailability.js
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
  'admin_dashboard': {
    requiredTier: 'pro',
    error: () => new TierRestrictionError(
      'admin_dashboard',
      'free',
      'pro',
      'Admin features require Pro subscription'
    )
  },
  'team_management': {
    requiredTier: 'pro',
    error: () => new TierRestrictionError(
      'team_management',
      'free',
      'pro',
      'Team management requires Pro subscription'
    )
  }
}

export function checkFeatureAccess(feature, userTier) {
  const requirement = featureMatrix[feature]
  
  if (!requirement) {
    return { allowed: true }
  }
  
  const tierRank = { free: 0, premium: 1, pro: 2 }
  const allowed = tierRank[userTier] >= tierRank[requirement.requiredTier]
  
  return {
    allowed,
    requirement: requirement.requiredTier,
    error: allowed ? null : requirement.error(userTier)
  }
}

// Usage
export const enableDeepMode = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    
    const access = checkFeatureAccess('deep_mode', user.subscriptionTier)
    
    if (!access.allowed) {
      throw access.error
    }
    
    // Enable deep mode
    user.preferences.deepModeEnabled = true
    await user.save()
    
    res.json({ success: true, deepModeEnabled: true })
    
  } catch (error) {
    if (error instanceof TierRestrictionError) {
      return res.status(403).json({
        error: error.code,
        message: error.message,
        details: error.details
      })
    }
    
    res.status(500).json({ error: 'Failed to enable deep mode' })
  }
}
```

---

## History & Data Filters

### Pattern 1: Apply Tier-Based History Filter

**Scenario**: Get habit history with automatic tier restrictions

```javascript
// controllers/habit.controller.js
export const getHabitHistory = async (req, res) => {
  try {
    const { startDate, endDate, limit = 100, offset = 0 } = req.query
    const user = await User.findById(req.user.userId)
    const userTier = user.subscriptionTier
    
    let dateFilter = {}
    
    // APPLY TIER-BASED FILTERING
    if (startDate || endDate) {
      // User provided custom date range
      if (startDate) {
        dateFilter.$gte = new Date(startDate)
      }
      if (endDate) {
        dateFilter.$lte = new Date(endDate)
      }
    } else {
      // No parameters - apply tier-based defaults
      if (userTier === 'free') {
        // Free users: last 30 days only
        dateFilter.$gte = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
      // Premium/Pro users: no date restriction
    }
    
    // ENFORCE FREE TIER RESTRICTION
    if (userTier === 'free' && dateFilter.$gte) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      if (dateFilter.$gte < thirtyDaysAgo) {
        dateFilter.$gte = thirtyDaysAgo
      }
    }
    
    // Query sessions
    const sessions = await HabitSession.find({
      userId: user._id,
      timestamp: dateFilter
    })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
    
    // Calculate actual date range
    const actualStart = sessions.length > 0 
      ? new Date(Math.min(...sessions.map(s => s.timestamp)))
      : null
    
    const actualEnd = sessions.length > 0 
      ? new Date(Math.max(...sessions.map(s => s.timestamp)))
      : new Date()
    
    // Build response with metadata
    res.json({
      sessions,
      tier: userTier,
      dateRange: {
        start: actualStart,
        end: actualEnd,
        oldestAllowed: userTier === 'free' 
          ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          : null,
        isLimited: userTier === 'free'
      },
      total: sessions.length,
      count: sessions.length
    })
    
  } catch (error) {
    console.error('History fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch history' })
  }
}
```

### Pattern 2: Indicate Limitation to Frontend

**Scenario**: Let frontend know about history restrictions

```javascript
// services/historyService.js
export function buildHistoryResponse(sessions, tier) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  
  const isLimited = tier === 'free'
  const oldestAllowed = isLimited ? thirtyDaysAgo : null
  
  return {
    sessions: sessions.map(s => ({
      id: s._id,
      duration: s.duration,
      timestamp: s.timestamp,
      mode: s.mode,
      focusScore: s.focusScore
    })),
    tier,
    meta: {
      isHistoryLimited: isLimited,
      oldestAccessibleDate: oldestAllowed,
      message: isLimited 
        ? 'Showing last 30 days. Upgrade to Premium for full history.'
        : 'Showing complete history'
    }
  }
}
```

---

## Error Handling

### Pattern 1: Tier Restriction Error

**Scenario**: User tries to access premium feature

```javascript
// utils/errors.js
export class TierRestrictionError extends AppError {
  constructor(feature, currentTier = 'free', requiredTier = 'premium', message = null) {
    const defaultMessage = message || 
      `This feature requires a ${requiredTier} subscription`
    
    super(
      defaultMessage,
      403,
      'TIER_RESTRICTION',
      {
        feature,
        currentTier,
        requiredTier,
        upgradeUrl: '/pricing'
      }
    )
    this.feature = feature
    this.currentTier = currentTier
    this.requiredTier = requiredTier
  }
  
  static cloudSync(currentTier = 'free') {
    return new TierRestrictionError(
      'cloud_sync',
      currentTier,
      'premium',
      'Cloud sync is only available for Premium users. Upgrade to sync your data across devices.'
    )
  }
  
  static deepMode(currentTier = 'free') {
    return new TierRestrictionError(
      'deep_mode',
      currentTier,
      'premium',
      'Deep Mode is only available for Premium users. Upgrade for unlimited focus sessions.'
    )
  }
  
  static adminDashboard(currentTier = 'free') {
    return new TierRestrictionError(
      'admin_dashboard',
      currentTier,
      'pro',
      'Admin dashboard is only available for Pro users. Upgrade to manage your team.'
    )
  }
}
```

### Pattern 2: Session Limit Error

**Scenario**: Free user exceeds daily session limit

```javascript
// utils/errors.js
export class SessionLimitError extends AppError {
  constructor(currentCount, limit, resetAt) {
    super(
      `You've reached your daily limit of ${limit} sessions. Upgrade to premium for unlimited sessions.`,
      403,
      'SESSION_LIMIT_REACHED',
      {
        currentCount,
        limit,
        resetAt: resetAt || new Date(Date.now() + 86400000).toISOString(),
        upgradeUrl: '/pricing'
      }
    )
  }
}
```

### Pattern 3: Token Limit Error

**Scenario**: User exhausts daily LLM tokens

```javascript
// utils/errors.js
export class TokenLimitError extends AppError {
  constructor(used, limit, resetAt) {
    super(
      'Daily LLM token limit exceeded. Resets at midnight UTC.',
      403,
      'TOKEN_LIMIT_EXCEEDED',
      {
        used,
        limit,
        remaining: limit - used,
        resetAt: resetAt || new Date(Date.now() + 86400000).toISOString(),
        upgradeUrl: '/pricing'
      }
    )
  }
}
```

### Pattern 4: Centralized Error Handler

**Scenario**: Express middleware catches and formats all errors

```javascript
// middleware/errorHandler.js
export const globalErrorHandler = (err, req, res, next) => {
  const status = err.status || 500
  const code = err.code || 'INTERNAL_ERROR'
  const message = err.message || 'An error occurred'
  const details = err.details || {}
  
  // Log error for monitoring
  console.error(`[${code}] ${message}`, {
    status,
    userId: req.user?.id,
    path: req.path,
    method: req.method,
    details
  })
  
  // Format response
  res.status(status).json({
    error: code,
    message,
    details,
    requestId: req.id
  })
}
```

---

## Testing Patterns

### Pattern 1: Test Free User Limits

```javascript
// __tests__/sessionLimit.test.js
describe('Session Limits - Free Tier', () => {
  let user, testUserId
  
  beforeEach(async () => {
    // Create free tier user
    testUserId = new mongoose.Types.ObjectId()
    user = await User.create({
      _id: testUserId,
      email: 'test@example.com',
      subscriptionTier: 'free',
      dailySessionCount: 0
    })
  })
  
  test('should allow 3 sessions for free user', async () => {
    for (let i = 0; i < 3; i++) {
      const quota = await checkSessionLimit(user)
      expect(quota.allowed).toBe(true)
      expect(quota.remaining).toBe(3 - i)
      
      await incrementSessionCounter(testUserId)
      user = await User.findById(testUserId)
    }
  })
  
  test('should reject 4th session for free user', async () => {
    user.dailySessionCount = 3
    await user.save()
    
    const quota = await checkSessionLimit(user)
    expect(quota.allowed).toBe(false)
    expect(quota.remaining).toBe(0)
  })
  
  test('should reset counter at midnight UTC', async () => {
    user.dailySessionCount = 3
    user.lastSessionReset = new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
    await user.save()
    
    await checkAndResetDailyCounter(user)
    user = await User.findById(testUserId)
    
    expect(user.dailySessionCount).toBe(0)
  })
})
```

### Pattern 2: Test Token Limits

```javascript
// __tests__/tokenLimit.test.js
describe('Token Limits', () => {
  test('free user should have 1000 token limit', async () => {
    const user = await User.create({
      email: 'free@example.com',
      subscriptionTier: 'free',
      dailyLLMTokens: 0
    })
    
    const check = await checkTokenLimit(user._id)
    expect(check.limit).toBe(1000)
    expect(check.remaining).toBe(1000)
  })
  
  test('premium user should have 10000 token limit', async () => {
    const user = await User.create({
      email: 'premium@example.com',
      subscriptionTier: 'premium',
      dailyLLMTokens: 0
    })
    
    const check = await checkTokenLimit(user._id)
    expect(check.limit).toBe(10000)
    expect(check.remaining).toBe(10000)
  })
  
  test('should prevent request when tokens exhausted', async () => {
    const user = await User.create({
      email: 'exhausted@example.com',
      subscriptionTier: 'free',
      dailyLLMTokens: 1000
    })
    
    const check = await checkTokenLimit(user._id)
    expect(check.allowed).toBe(false)
    expect(check.remaining).toBe(0)
  })
})
```

### Pattern 3: Test Feature Access

```javascript
// __tests__/featureAccess.test.js
describe('Feature Access Control', () => {
  test('free user should not access cloud sync', async () => {
    const user = await User.create({
      email: 'free@example.com',
      subscriptionTier: 'free'
    })
    
    const access = checkFeatureAccess('cloud_sync', user.subscriptionTier)
    expect(access.allowed).toBe(false)
    expect(access.requirement).toBe('premium')
  })
  
  test('premium user should access cloud sync', async () => {
    const user = await User.create({
      email: 'premium@example.com',
      subscriptionTier: 'premium'
    })
    
    const access = checkFeatureAccess('cloud_sync', user.subscriptionTier)
    expect(access.allowed).toBe(true)
  })
  
  test('pro user should access admin dashboard', async () => {
    const user = await User.create({
      email: 'pro@example.com',
      subscriptionTier: 'pro'
    })
    
    const access = checkFeatureAccess('admin_dashboard', user.subscriptionTier)
    expect(access.allowed).toBe(true)
  })
})
```

---

## Migration Guide

### Upgrading Free User to Premium

```javascript
export const upgradeToPremium = async (userId, plan) => {
  const user = await User.findById(userId)
  
  // Create subscription
  const subscription = await Subscription.create({
    userId,
    plan, // 'premium_monthly' or 'premium_yearly'
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  })
  
  // Update user tier
  user.subscriptionTier = 'premium'
  await user.save()
  
  // Trigger events
  await trackSubscriptionCreated(plan, userId)
  
  return subscription
}
```

### Downgrading Premium to Free

```javascript
export const downgradeToPremium = async (userId) => {
  const subscription = await Subscription.findOne({
    userId,
    status: { $in: ['active', 'trialing'] }
  })
  
  if (!subscription) {
    throw new Error('No active subscription found')
  }
  
  // Set cancellation for period end
  subscription.cancelAtPeriodEnd = true
  subscription.canceledAt = new Date()
  await subscription.save()
  
  // User will downgrade automatically at period end
  // Alternatively, immediate downgrade:
  // user.subscriptionTier = 'free'
  // await user.save()
  
  return subscription
}
```

---

## Common Pitfalls

### ❌ Don't
```javascript
// Don't hardcode tier checks
if (user.tier === 'premium') { /* ... */ }

// Don't forget to reset tokens
const tokens = await User.findById(userId).dailyLLMTokens

// Don't compare local time to UTC
if (new Date() > lastReset) { /* WRONG! */ }
```

### ✅ Do
```javascript
// Use feature availability functions
const access = checkFeatureAccess('feature_name', user.tier)

// Use token tracking service
const check = await checkTokenLimit(userId)

// Compare UTC dates
const nowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
const lastUTC = new Date(Date.UTC(lastReset.getUTCFullYear(), lastReset.getUTCMonth(), lastReset.getUTCDate()))
```

---

## Performance Tips

1. **Cache tier checks**: Use Redis for tier lookups in high-traffic scenarios
2. **Batch token resets**: Run a scheduled job to reset tokens instead of per-request
3. **Index by subscription tier**: Add database indexes on `subscriptionTier` and `status`
4. **Use projection**: Only fetch needed fields in queries

---

**Last Updated**: January 2024
**Version**: 1.0

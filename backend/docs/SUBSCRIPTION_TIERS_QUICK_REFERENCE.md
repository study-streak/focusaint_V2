# Subscription Tiers - Quick Reference Guide

## At a Glance

```
FREE                    PREMIUM              PRO
┌─────────────────┐    ┌─────────────────┐   ┌─────────────────┐
│ $0/month        │    │ $4.99/mo        │   │ $19.99/mo       │
│ No card needed  │    │ $3.99/mo (annual)   │ $15.99/mo (annual)
│                 │    │ Focus Plan      │   │ Team Plan       │
│ Start here      │    │ 7-day trial     │   │ 7-day trial     │
└─────────────────┘    └─────────────────┘   └─────────────────┘
```

---

## Usage Limits Comparison

### Daily Session Limits
```
FREE:     3 sessions/day
PREMIUM:  UNLIMITED
PRO:      UNLIMITED
Reset:    UTC Midnight
```

### LLM Token Limits
```
FREE:     1,000 tokens/day  (~2-3 AI requests)
PREMIUM:  10,000 tokens/day (~10-15 AI requests)
PRO:      10,000 tokens/day (~10-15 AI requests)
Reset:    UTC Midnight
```

### History Access
```
FREE:     Last 30 days
PREMIUM:  Unlimited
PRO:      Unlimited
```

---

## Feature Summary

### All Tiers (Free, Premium, Pro)
- ✅ Basic study sessions
- ✅ Habit tracking
- ✅ Streak tracking
- ✅ Comprehension quizzes

### Premium & Pro Only
- ✅ Unlimited sessions
- ✅ AI-generated quizzes (high quota)
- ✅ Progress analytics
- ✅ Summary feedback
- ✅ Spaced-repetition engine
- ✅ Deep Mode (extended sessions)
- ✅ Streak insurance
- ✅ Data export
- ✅ Cloud sync
- ✅ Custom AI persona
- ✅ Private groups
- ✅ Group accountability

### Pro Only
- ✅ Admin dashboard
- ✅ Group analytics
- ✅ Up to 20 team members
- ✅ Custom course builder
- ✅ Dedicated support

---

## Pricing Breakdown

| Tier | Monthly | Annual | Annual Savings |
|------|---------|--------|-----------------|
| FREE | $0 | $0 | - |
| PREMIUM | $4.99 | $47.88 (vs $59.88) | 20% |
| PRO | $19.99 | $191.88 (vs $239.88) | 20% |

---

## API Error Codes by Tier

### Free Users Only
```
403 SESSION_LIMIT_REACHED
  → Exceeded 3 daily sessions
  → Resets at UTC midnight
  
403 TOKEN_LIMIT_EXCEEDED
  → Exceeded 1,000 daily LLM tokens
  → Resets at UTC midnight
  
403 TIER_RESTRICTION
  → Trying to access premium-only feature
  → Data history limited to 30 days
```

### Premium & Pro Users
```
403 TOKEN_LIMIT_EXCEEDED (only if exceeding 10,000)
  → Rare case - suggests heavy AI usage
```

---

## Tier Upgrade Triggers

### When Free Users Hit Limits
1. **3rd Session Limit**: Show upgrade prompt
   - "Upgrade to Premium for unlimited sessions"
   
2. **Token Limit**: Show upgrade prompt
   - "Upgrade to Premium for 10x more AI power"
   
3. **30-Day History Limit**: Show upgrade prompt
   - "Upgrade to Premium for full history access"

4. **Premium Feature Access**: Block with upgrade CTA
   - "This feature requires Premium"

---

## Implementation Quick Start

### Check User's Tier
```javascript
import User from '../models/User.js'

const user = await User.findById(userId)
const tier = user.subscriptionTier // 'free' | 'premium' | 'pro'
```

### Check Session Quota
```javascript
import { checkSessionLimit } from '../utils/sessionCounter.js'

const quota = await checkSessionLimit(user)
// { allowed: true/false, remaining: number, limit: number }

if (!quota.allowed) {
  // Reject session
}
```

### Check Token Quota
```javascript
import { checkTokenLimit } from '../services/tokenTracking.js'

const tokenCheck = await checkTokenLimit(userId)
// { allowed: true/false, remaining: number, limit: number, resetAt: Date }

if (!tokenCheck.allowed) {
  // Reject AI request
}
```

### Track AI Feature Usage
```javascript
import { trackTokenUsage, estimateTokenCount } from '../services/tokenTracking.js'

const tokens = estimateTokenCount(aiResponse)
await trackTokenUsage(userId, tokens, 'quiz_generation')
```

### Restrict Premium Feature
```javascript
import { TierRestrictionError } from '../utils/errors.js'

if (user.subscriptionTier === 'free') {
  throw TierRestrictionError.cloudSync(user.subscriptionTier)
}
```

---

## Testing Free vs Premium

### Test Free User
```javascript
// Create free subscription
const sub = await Subscription.create({
  userId: userId,
  plan: 'free',
  status: 'active'
})

// Update user tier
user.subscriptionTier = 'free'
await user.save()

// Test: Should fail on 4th session
// Test: Should fail with 1001+ tokens
// Test: Should fail on 31+ day history
```

### Test Premium User
```javascript
// Create premium subscription
const sub = await Subscription.create({
  userId: userId,
  plan: 'premium_monthly',
  status: 'active',
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30*24*60*60*1000)
})

// Update user tier
user.subscriptionTier = 'premium'
await user.save()

// Test: Should allow unlimited sessions
// Test: Should allow 10,000 tokens
// Test: Should allow unlimited history
```

---

## Revenue Model

### Current Strategy
- **Free**: User acquisition, education, funnel top
- **Premium**: Individual learners, biggest revenue driver
- **Pro**: Teams & institutions, high LTV, requires sales

### Conversion Targets
- Free → Premium: Trigger after hitting limits
- Premium → Pro: Upsell after team growth (future)

### Upsell Moments
1. 3rd session of the day → "Upgrade for unlimited"
2. Token limit reached → "Upgrade for 10x more AI"
3. History limit hit → "Unlock full history"
4. Feature blocked → "This requires Premium"

---

## Common Questions

**Q: Can a free user use AI features?**
A: Yes, but limited to 1,000 tokens/day (~2-3 requests)

**Q: What happens at period end?**
A: If subscription not renewed, user auto-downgrades to free tier

**Q: How are daily limits reset?**
A: At UTC midnight (00:00). Not user's local time.

**Q: Can users see their remaining quota?**
A: Yes, via `/api/habit/quota` and `/api/ai/token-usage`

**Q: What if a user exceeds limits?**
A: 403 error returned, feature blocked, upgrade prompt shown

**Q: Can limits be customized?**
A: Currently hardcoded per tier. Would require code changes.

**Q: Is there a Pro trial?**
A: Yes, 7-day free trial offered at signup

---

## Database Indexes

For optimal performance:
```javascript
// User model
subscriptionTier index (for tier-based queries)
dailySessionCount index (for quota checks)
dailyLLMTokens index (for token tracking)

// Subscription model
userId index (unique)
status index (for active subscriptions)
currentPeriodEnd index (for renewal checks)
```

---

## Monitoring & Alerts

### KPIs to Track
- Free → Premium conversion rate
- Premium → Pro upgrade rate
- Churn rate (active subs → canceled)
- Token usage by tier
- Session usage by tier
- Trial conversion rate

### Alerts to Set
- ⚠️ Conversion rate drops below 5%
- ⚠️ Churn rate exceeds 10%
- ⚠️ Token usage nearing limits (98%+)
- ⚠️ Failed payments increasing

---

## Files to Reference

- [Complete Documentation](./BUSINESS_LOGIC_LAYER.md)
- [Subscription Controller](../controllers/subscription.controller.js)
- [Session Counter](../utils/sessionCounter.js)
- [Token Tracking Service](../services/tokenTracking.js)
- [Error Handling](./ERROR_HANDLING.md)
- [Subscription Model](../models/Subscription.js)
- [User Model](../models/User.js)

---

**Last Updated**: January 2024
**Quick Reference v1.0**

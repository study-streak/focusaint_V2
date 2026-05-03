# Business Logic Layer Documentation

## Overview

FocusAint implements a **three-tier subscription model** with progressive feature sets and usage limits. This document outlines the complete business logic for subscription management, feature access control, and usage tracking.

---

## Subscription Tiers

### 1. **FREE Tier**
- **Price**: $0/month
- **Payment Required**: No
- **Auto-downgrade**: Users downgrade automatically when subscription expires
- **Status**: Active from signup (default tier)

### 2. **PREMIUM Tier (Focus Plan)**
- **Price**: 
  - Monthly: $4.99/month
  - Annual: $3.99/month (billed annually, 20% savings)
- **Equivalent to**: "Focus" plan in landing page
- **Payment Method**: Dodo Payments or Stripe
- **Trial**: 7-day free trial offered during signup

### 3. **PRO Tier (Team Plan)**
- **Price**:
  - Monthly: $19.99/month
  - Annual: $15.99/month (billed annually, 20% savings)
- **Equivalent to**: "Team" plan in landing page
- **Payment Method**: Dodo Payments or Stripe
- **Trial**: 7-day free trial offered during signup
- **Note**: Currently reserved for enterprise/institutional use

---

## Feature Matrix by Tier

| Feature | Free | Premium | Pro |
|---------|------|---------|-----|
| **Core Features** |
| Basic study sessions | ✅ | ✅ | ✅ |
| Habit tracking | ✅ | ✅ | ✅ |
| Streak tracking | ✅ | ✅ | ✅ |
| Progress analytics | ❌ | ✅ | ✅ |
| **Daily Limits** |
| Gated lessons per day | 3 | Unlimited | Unlimited |
| Study sessions per day | 3 | Unlimited | Unlimited |
| LLM tokens per day | 1,000 | 10,000 | 10,000 |
| **History & Data Access** |
| Data history access | 30 days | Unlimited | Unlimited |
| Data export | ❌ | ✅ | ✅ |
| Cloud sync | ❌ | ✅ | ✅ |
| **AI Features** |
| AI-generated quizzes | ✅* | ✅ | ✅ |
| Study assistant (AI coaching) | ✅* | ✅ | ✅ |
| Summary feedback | ❌ | ✅ | ✅ |
| Custom AI persona | ❌ | ✅ | ✅ |
| **Advanced Features** |
| Spaced-repetition engine | ❌ | ✅ | ✅ |
| Deep Mode (extended sessions) | ❌ | ✅ | ✅ |
| Streak insurance | ❌ | ✅ | ✅ |
| **Collaboration** |
| Active courses | 5 | Unlimited | Unlimited |
| Group accountability | ❌ | ✅ | ✅ |
| Private groups | ❌ | ✅ | ✅ |
| Admin dashboard | ❌ | ❌ | ✅ |
| Group analytics | ❌ | ❌ | ✅ |
| Team members (max) | - | - | 20 |
| Custom course builder | ❌ | ❌ | ✅ |
| **Support** |
| Email support | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ |
| Dedicated support | ❌ | ❌ | ✅ |

*Free tier has limited AI features due to token constraints

---

## Usage Limits

### Session Limits

#### **Free Tier**
- **Daily Session Limit**: 3 sessions per day
- **Reset Time**: UTC Midnight (00:00 UTC)
- **Behavior**: Returns error `SESSION_LIMIT_REACHED` (HTTP 403) when limit exceeded
- **Implementation**: 
  - Tracked in `User.dailySessionCount`
  - Reset tracked in `User.lastSessionReset`
  - `/api/habit/quota` endpoint returns remaining sessions

#### **Premium & Pro Tiers**
- **Daily Session Limit**: Unlimited (-1)
- **Quota Check**: Always returns `remaining: -1, limit: -1, unlimited: true`

---

### LLM Token Limits

All token limits reset daily at UTC midnight (00:00 UTC).

#### **Free Tier**
- **Daily Token Limit**: 1,000 tokens
- **Estimated Usage**: 
  - AI quiz generation: ~200-500 tokens per request
  - Study assistant response: ~100-300 tokens per request
  - Typical user: 2-3 AI requests per day
- **Behavior**: Returns error `TOKEN_LIMIT_EXCEEDED` (HTTP 403) when limit exceeded
- **Tracking**: Stored in `User.dailyLLMTokens`, reset in `User.lastTokenReset`

#### **Premium Tier**
- **Daily Token Limit**: 10,000 tokens
- **Estimated Usage**: ~10-15 AI requests per day
- **Typical Use Case**: Serious learners using AI features regularly

#### **Pro Tier**
- **Daily Token Limit**: 10,000 tokens
- **Estimated Usage**: Equivalent to Premium (same limit)
- **Additional**: Team members may have separate quotas

**Token Estimation**:
- Formula: `tokens ≈ text_length / 4`
- Rough estimate: 1 token ≈ 4 characters
- Actual usage may vary based on LLM model (Gemini, etc.)

---

### History & Data Access Limits

#### **Free Tier**
- **Accessible History**: Last 30 days only
- **Enforcement**: 
  - `/api/habit/history` returns only last 30 days
  - Old data requests are clamped to 30 days ago
  - Response includes `dateRange.isLimited: true`
- **Upgrade Prompt**: UI displays message suggesting premium upgrade

#### **Premium & Pro Tiers**
- **Accessible History**: Unlimited (all historical data)
- **Date Range**: Full user history available
- **Response**: Includes `dateRange.isLimited: false`

---

## API Endpoints

### Subscription Management

#### **Get Subscription Status**
```
GET /api/subscription/status
Authorization: Required
Response:
{
  "hasSubscription": boolean,
  "tier": "free" | "premium" | "pro",
  "plan": "premium_monthly" | "premium_yearly" | "pro_monthly" | "pro_yearly" | "free",
  "status": "active" | "canceled" | "past_due" | "expired" | "trialing",
  "currentPeriodEnd": ISO8601 datetime,
  "cancelAtPeriodEnd": boolean
}
```

#### **Create Subscription**
```
POST /api/subscription/create
Authorization: Required
Body: {
  "plan": "premium_monthly" | "premium_yearly" | "pro_monthly" | "pro_yearly" | "free"
}
Response:
{
  "message": "Free subscription created successfully" | "Checkout session created",
  "subscription": { /* subscription object */ },
  "sessionId": string (for Dodo Payments),
  "url": string (checkout URL for Dodo Payments)
}
```

#### **Cancel Subscription**
```
POST /api/subscription/cancel
Authorization: Required
Response: {
  "message": "Subscription canceled at period end",
  "subscription": { /* updated subscription object */ }
}
```

#### **Get Checkout Session**
```
POST /api/subscription/checkout
Authorization: Required
Body: {
  "plan": "monthly" | "yearly"
}
Response: {
  "sessionId": string,
  "url": string (redirect to payment page)
}
```

---

### Session Management

#### **Get Daily Quota**
```
GET /api/habit/quota
Authorization: Required
Response: {
  "remaining": number (-1 for unlimited),
  "limit": number (-1 for unlimited),
  "unlimited": boolean,
  "resetAt": ISO8601 datetime (next UTC midnight)
}
```

#### **Log Session**
```
POST /api/habit/session
Authorization: Required
Body: {
  "duration": number (seconds),
  "mode": string,
  "habitId": string (optional),
  "focusScore": number (optional)
}
Response: {
  "session": { /* session object */ },
  "streak": number,
  "dailyCount": number,
  "newStreakRecord": boolean
}
Errors:
  - 403 SESSION_LIMIT_REACHED: Free users exceeded 3 daily sessions
```

---

### History & Data Access

#### **Get Habit History**
```
GET /api/habit/history
Authorization: Required
Query Parameters:
  - startDate: ISO8601 (optional, clamped to 30 days for free tier)
  - endDate: ISO8601 (optional)
  - limit: number (default: 100)
  - offset: number (default: 0)

Response: {
  "sessions": [ /* session objects */ ],
  "tier": "free" | "premium" | "pro",
  "dateRange": {
    "start": ISO8601 datetime | null,
    "end": ISO8601 datetime,
    "oldestAllowed": ISO8601 datetime | null (null for premium),
    "isLimited": boolean
  },
  "total": number,
  "count": number
}
```

**Business Rules for Free Users**:
- If no date parameters provided: Return last 30 days
- If `startDate` older than 30 days: Clamp to 30 days ago
- Response always indicates `isLimited: true` for UI upgrade prompts

---

### Token Tracking

#### **Get Token Usage**
```
GET /api/ai/token-usage
Authorization: Required
Response: {
  "current": {
    "used": number,
    "remaining": number,
    "limit": number,
    "resetAt": ISO8601 datetime
  },
  "stats": {
    "last30Days": number (total tokens used in last 30 days),
    "history": [ /* daily token usage array */ ]
  }
}
```

#### **AI Features (Quiz, Study Assistant) - Token Check**
All AI endpoints automatically:
1. Check token limit before processing
2. Return 403 `TOKEN_LIMIT_EXCEEDED` if insufficient tokens
3. Track token usage after successful response

---

## Business Rules & Enforcement

### Rule 1: Tier-Based Session Limiting
**Implementation**: `checkSessionLimit()` in `sessionCounter.js`
```
Free: 3 sessions/day
Premium: Unlimited
Pro: Unlimited
```

**Reset**: UTC midnight (00:00)
**Enforcement**: Prevents free users from exceeding daily limit
**Error Response** (HTTP 403):
```json
{
  "error": "SESSION_LIMIT_REACHED",
  "details": {
    "currentCount": 3,
    "limit": 3,
    "resetAt": "2024-01-02T00:00:00Z"
  }
}
```

### Rule 2: Daily LLM Token Quota
**Implementation**: `checkTokenLimit()` in `tokenTracking.js`
```
Free: 1,000 tokens/day
Premium: 10,000 tokens/day
Pro: 10,000 tokens/day
```

**Reset**: UTC midnight (00:00)
**Enforcement**: All AI features check tokens before processing
**Error Response** (HTTP 403):
```json
{
  "error": "TOKEN_LIMIT_EXCEEDED",
  "details": {
    "used": 950,
    "limit": 1000,
    "resetAt": "2024-01-02T00:00:00Z"
  }
}
```

### Rule 3: History Access Window
**Implementation**: `getHabitHistory()` in `habit.controller.js`
```
Free: Last 30 days only
Premium: Unlimited (all history)
Pro: Unlimited (all history)
```

**Enforcement**: Query filtering at database level
**User Feedback**: `dateRange.isLimited` flag indicates restriction

### Rule 4: Feature Tier Restrictions
**Implementation**: `TierRestrictionError` class in `errors.js`

Protected features trigger `TIER_RESTRICTION` (HTTP 403):
- Cloud sync (requires Premium)
- Deep Mode (requires Premium)
- Data export (requires Premium)
- Spaced-repetition (requires Premium)
- Custom AI persona (requires Premium)
- Streak insurance (requires Premium)
- Private groups (requires Premium)
- Admin dashboard (requires Pro)
- Group analytics (requires Pro)
- Custom course builder (requires Pro)

**Error Response**:
```json
{
  "error": "TIER_RESTRICTION",
  "details": {
    "feature": "cloud_sync",
    "currentTier": "free",
    "requiredTier": "premium",
    "upgradeUrl": "/pricing"
  }
}
```

### Rule 5: Subscription State Transitions
```
Free → Premium/Pro: 
  - Immediate activation
  - Previous subscription canceled
  - Tier updated on User model

Premium/Pro → Free:
  - Automatic downgrade at period end
  - Cancel at period end flag set in Stripe
  - Access to premium features revoked after period end

Premium/Pro → Canceled:
  - Cancel at period end: Keep access until period end
  - Immediate cancel: Revoke access immediately
```

### Rule 6: Trial Period Management
```
Premium & Pro subscriptions:
  - 7-day trial offered
  - No payment charged during trial
  - Auto-conversion at trial end
  - User receives trial expiration email
  - After trial: Normal billing cycle begins
```

---

## Data Models

### User Model Fields
```javascript
{
  // Subscription Info
  subscriptionTier: String {
    enum: ["free", "premium", "pro"],
    default: "free"
  },
  
  // Session Tracking
  dailySessionCount: Number (default: 0),
  lastSessionReset: Date (default: now),
  totalSessions: Number (default: 0),
  
  // Streak Info
  currentStreak: Number (default: 0),
  longestStreak: Number (default: 0),
  lastSessionDate: Date | null,
  
  // Token Tracking
  dailyLLMTokens: Number (default: 0),
  lastTokenReset: Date
}
```

### Subscription Model
```javascript
{
  userId: ObjectId (unique),
  
  // Dodo Payments Fields
  dodoPaymentId: String | null,
  dodoSubscriptionId: String | null,
  
  // Plan Details
  plan: String {
    enum: ['premium_monthly', 'premium_yearly', 'pro_monthly', 'pro_yearly'],
    required: true
  },
  status: String {
    enum: ['active', 'canceled', 'past_due', 'expired', 'trialing'],
    default: 'active'
  },
  
  // Billing Periods
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: Boolean (default: false),
  canceledAt: Date | null,
  
  // Trial
  trialStart: Date | null,
  trialEnd: Date | null,
  
  // Payment History
  lastPaymentDate: Date | null,
  lastPaymentAmount: Number | null,
  failedPaymentAttempts: Number (default: 0),
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### LLMTokenUsage Model
```javascript
{
  userId: ObjectId,
  date: Date (UTC),
  tokensUsed: Number,
  requestCount: Number,
  feature: String (quiz_generation, study_coach, etc.),
  createdAt: Date
}
```

---

## Error Codes & Responses

### 400 - Invalid Request
```json
{
  "error": "Invalid plan.",
  "details": { }
}
```

### 403 - SESSION_LIMIT_REACHED
```json
{
  "error": "SESSION_LIMIT_REACHED",
  "message": "You've reached your daily limit of 3 sessions. Upgrade to premium for unlimited sessions.",
  "details": {
    "currentCount": 3,
    "limit": 3,
    "resetAt": "2024-01-02T00:00:00Z"
  }
}
```

### 403 - TOKEN_LIMIT_EXCEEDED
```json
{
  "error": "TOKEN_LIMIT_EXCEEDED",
  "message": "Daily LLM token limit exceeded. Resets at midnight UTC.",
  "details": {
    "used": 1000,
    "limit": 1000,
    "resetAt": "2024-01-02T00:00:00Z"
  }
}
```

### 403 - TIER_RESTRICTION
```json
{
  "error": "TIER_RESTRICTION",
  "message": "This feature requires a premium subscription.",
  "details": {
    "feature": "cloud_sync",
    "currentTier": "free",
    "requiredTier": "premium",
    "upgradeUrl": "/pricing"
  }
}
```

### 404 - Subscription Not Found
```json
{
  "error": "No active subscription found"
}
```

### 500 - Server Error
```json
{
  "error": "Failed to get subscription status"
}
```

---

## Implementation Details

### Session Counter (`utils/sessionCounter.js`)

**Key Functions**:

#### `checkAndResetDailyCounter(user)`
- Checks if UTC date has changed since last reset
- Resets `dailySessionCount` to 0 if needed
- Updates `lastSessionReset` timestamp

#### `checkSessionLimit(user)`
- Returns unlimited (-1) for Premium/Pro
- Returns remaining quota for Free (0-3)
- Triggers reset check automatically

#### `incrementSessionCounter(userId)`
- Increments session count
- Saves to database
- Part of session logging workflow

---

### Token Tracking (`services/tokenTracking.js`)

**Key Functions**:

#### `checkTokenLimit(userId)`
- Verifies daily token availability
- Returns remaining tokens before midnight
- Throws error if insufficient

#### `trackTokenUsage(userId, tokensUsed, feature)`
- Records usage in `User.dailyLLMTokens`
- Creates entry in `LLMTokenUsage` collection
- Supports feature-level tracking (quiz, study_coach, etc.)

#### `estimateTokenCount(text)`
- Rough estimation: ~4 characters per token
- Used before AI requests to estimate cost

#### `getTokenUsageStats(userId, days = 30)`
- Returns 30-day usage history
- Used for analytics and user reporting

---

### Subscription Controller (`controllers/subscription.controller.js`)

**Key Features**:
- Dodo Payments integration
- Stripe webhook handling (legacy)
- Free subscription creation (no payment required)
- Premium/Pro checkout session creation
- Subscription status retrieval
- Subscription cancellation (at period end or immediate)
- Payment failure handling

---

## Pricing Strategy

### Free Tier
- No revenue
- User acquisition focus
- Upsell to Premium after hitting limits

### Premium Tier ("Focus")
- $4.99/month or $3.99/month (annual)
- Target: Individual learners, serious students
- 20% discount for annual billing
- 7-day free trial

### Pro Tier ("Team")
- $19.99/month or $15.99/month (annual)
- Target: Educational institutions, team leads
- Multi-member support (up to 20)
- Admin dashboard & team analytics
- 20% discount for annual billing
- 7-day free trial

---

## Migration Paths

### Upgrade Scenarios
1. **Free → Premium**: Immediate activation, 7-day trial available
2. **Free → Pro**: Immediate activation, 7-day trial available
3. **Premium → Pro**: Upgrade mid-cycle (pro-rated billing or full billing)

### Downgrade Scenarios
1. **Premium → Free**: Automatic at period end (cancel_at_period_end=true)
2. **Pro → Free**: Automatic at period end
3. **Premium ↔ Pro**: Downgrade to Free only (no cross-premium downgrades)

---

## Metrics & Analytics

### Tracked Events
```javascript
// In metrics.js
- trackUserSignup(tier='free')
- trackSessionCreated(type, userId, tier)
- trackSessionCompleted(type, duration, userId, tier)
- trackSubscriptionCreated(plan, userId)
- trackSubscriptionCanceled(plan, userId)
- trackSubscriptionReactivated(plan, userId)
- trackPaymentSucceeded(amount, plan)
```

### Reporting
- Token usage per tier (daily breakdown)
- Session count per tier
- Conversion rate: Free → Premium/Pro
- Churn rate: Premium → Cancellation
- Trial-to-paid conversion

---

## Testing Checklist

### Subscription Flow
- [ ] Free user signup creates subscription
- [ ] Premium checkout redirects to payment
- [ ] Webhook processes payment success
- [ ] Subscription marked as active
- [ ] User tier updated immediately
- [ ] Cancellation at period end works
- [ ] Immediate cancellation works
- [ ] Trial period functions correctly

### Session Limiting
- [ ] Free user: 3 sessions/day limit enforced
- [ ] Premium user: unlimited sessions allowed
- [ ] Daily reset at UTC midnight works
- [ ] Quota endpoint returns correct values
- [ ] Error message displayed on limit reached

### Token Limiting
- [ ] Free user: 1,000 tokens/day
- [ ] Premium user: 10,000 tokens/day
- [ ] Token reset at UTC midnight
- [ ] AI endpoints check limits before processing
- [ ] Error returned when limit exceeded

### History Access
- [ ] Free users: 30-day limit enforced
- [ ] Premium users: unlimited access
- [ ] Date range clamping works
- [ ] Response includes isLimited flag

### Feature Access
- [ ] Premium features blocked for free users
- [ ] Pro features blocked for non-Pro users
- [ ] Cloud sync requires Premium
- [ ] Admin features require Pro tier

---

## Related Documentation

- [Subscription Setup](SUBSCRIPTION_CREATE_ENDPOINT.md)
- [Payment System](STRIPE_SETUP.md)
- [Error Handling](ERROR_HANDLING.md)
- [Session Counting](SESSION_COUNTING_IMPLEMENTATION.md)
- [Validation](VALIDATION_IMPLEMENTATION_SUMMARY.md)
- [Security Headers](SECURITY_HEADERS.md)

---

## Future Enhancements

1. **Family Plans**: Multi-user Premium/Pro subscriptions
2. **Enterprise Tier**: Custom pricing for large teams
3. **Usage-Based Pricing**: Token quota overage charges
4. **Pause Subscription**: Temporary hold without cancellation
5. **Lifetime Deals**: One-time payment option
6. **Referral Program**: Credits for inviting friends
7. **A/B Testing**: Different pricing/limits for experiments
8. **Regional Pricing**: Country-specific pricing tiers

---

**Last Updated**: January 2024
**Maintained By**: Backend Engineering Team
**Status**: Active & Production Ready

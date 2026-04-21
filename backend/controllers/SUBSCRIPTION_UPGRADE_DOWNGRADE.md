# Subscription Upgrade/Downgrade Implementation

## Overview

This document describes the subscription plan change functionality that allows users to upgrade from monthly to yearly or downgrade from yearly to monthly.

## Endpoint

**POST** `/api/subscription/change-plan`

**Authentication:** Required (JWT token)

## Request Body

```json
{
  "newPlan": "premium_monthly" | "premium_yearly"
}
```

## Response

### Success (200 OK)

```json
{
  "message": "Subscription upgraded successfully",
  "subscription": {
    "id": "subscription_id",
    "plan": "premium_yearly",
    "status": "active",
    "currentPeriodStart": "2024-01-15T00:00:00.000Z",
    "currentPeriodEnd": "2025-01-15T00:00:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Missing newPlan
```json
{
  "error": "newPlan is required"
}
```

#### 400 Bad Request - Invalid Plan
```json
{
  "error": "Invalid plan. Must be premium_monthly or premium_yearly"
}
```

#### 400 Bad Request - Same Plan
```json
{
  "error": "You are already on this plan",
  "currentPlan": "premium_monthly"
}
```

#### 404 Not Found - No Active Subscription
```json
{
  "error": "No active subscription found. Please create a subscription first."
}
```

#### 500 Internal Server Error - Plan Not Configured
```json
{
  "error": "Subscription plan not configured. Please contact support."
}
```

#### 503 Service Unavailable - Stripe Not Configured
```json
{
  "error": "Payment processing is not configured. Please contact support."
}
```

## Implementation Details

### Proration Behavior

The implementation uses Stripe's `proration_behavior: 'always_invoice'` which means:

- **Upgrade (monthly → yearly):** User is charged immediately for the difference, prorated for the remaining time in the current period
- **Downgrade (yearly → monthly):** User receives a credit that will be applied to future invoices

### Stripe API Calls

1. Retrieves the current Stripe subscription
2. Updates the subscription with the new price ID
3. Stripe automatically handles proration and invoicing
4. Updates the local database with the new plan details

### Database Updates

The following fields are updated in the local Subscription document:
- `plan`: The new plan name
- `stripePriceId`: The new Stripe price ID
- `status`: Updated status from Stripe
- `currentPeriodStart`: Updated period start
- `currentPeriodEnd`: Updated period end

### Edge Cases Handled

1. **No Stripe Configuration:** Returns 503 error
2. **Missing newPlan:** Returns 400 error
3. **Invalid Plan:** Returns 400 error
4. **No Active Subscription:** Returns 404 error
5. **Same Plan:** Returns 400 error with current plan info
6. **Stripe API Errors:** Returns appropriate error codes with messages

## Environment Variables Required

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
```

## Usage Example

### Frontend Implementation

```typescript
async function changeSubscriptionPlan(newPlan: 'premium_monthly' | 'premium_yearly') {
  try {
    const response = await fetch('/api/subscription/change-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ newPlan })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    const data = await response.json();
    console.log(data.message); // "Subscription upgraded successfully"
    return data.subscription;
  } catch (error) {
    console.error('Failed to change plan:', error);
    throw error;
  }
}
```

### cURL Example

```bash
curl -X POST http://localhost:5000/api/subscription/change-plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"newPlan": "premium_yearly"}'
```

## Testing Considerations

When testing this functionality:

1. Use Stripe test mode with test API keys
2. Test both upgrade and downgrade scenarios
3. Verify proration amounts in Stripe dashboard
4. Test error cases (invalid plan, no subscription, etc.)
5. Verify database updates after plan change
6. Check that webhook events are properly handled

## Related Files

- `backend/controllers/subscription.controller.js` - Controller implementation
- `backend/routes/subscription.js` - Route definition
- `backend/models/Subscription.js` - Subscription model
- `backend/models/User.js` - User model (tier field)

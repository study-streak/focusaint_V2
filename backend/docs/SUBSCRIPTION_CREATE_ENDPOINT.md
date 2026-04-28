# Subscription Creation Endpoint

## Overview

This document describes the direct subscription creation endpoint implemented for task 12.2.2.

## Endpoint

**POST** `/api/subscription/create`

## Purpose

Creates a Stripe subscription directly without going through the checkout session flow. This endpoint:
1. Creates or retrieves a Stripe customer
2. Creates a Stripe subscription with the provided price ID
3. Saves the subscription to the database
4. Updates the user's tier to 'premium'

## Authentication

Requires JWT authentication via the `authenticateToken` middleware.

## Request Body

```json
{
  "priceId": "price_1234567890",
  "plan": "premium_monthly"
}
```

### Parameters

- `priceId` (string, required): The Stripe Price ID for the subscription plan
- `plan` (string, required): The plan type. Must be either:
  - `premium_monthly`
  - `premium_yearly`

## Response

### Success (201 Created)

```json
{
  "message": "Subscription created successfully",
  "subscription": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "plan": "premium_monthly",
    "status": "active",
    "currentPeriodStart": "2024-01-15T00:00:00.000Z",
    "currentPeriodEnd": "2024-02-15T00:00:00.000Z"
  },
  "user": {
    "tier": "premium"
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Fields
```json
{
  "error": "priceId and plan are required"
}
```

#### 400 Bad Request - Invalid Plan
```json
{
  "error": "Invalid plan. Must be premium_monthly or premium_yearly"
}
```

#### 400 Bad Request - Existing Subscription
```json
{
  "error": "You already have an active subscription",
  "subscription": {
    "plan": "premium_monthly",
    "status": "active",
    "currentPeriodEnd": "2024-02-15T00:00:00.000Z"
  }
}
```

#### 400 Bad Request - Stripe Card Error
```json
{
  "error": "Payment failed: Your card was declined"
}
```

#### 400 Bad Request - Invalid Stripe Request
```json
{
  "error": "Invalid request: No such price: 'price_invalid'"
}
```

#### 404 Not Found
```json
{
  "error": "User not found"
}
```

#### 503 Service Unavailable
```json
{
  "error": "Payment processing is not configured. Please contact support."
}
```

#### 500 Internal Server Error
```json
{
  "error": "Failed to create subscription"
}
```

## Implementation Details

### Flow

1. **Validation**: Checks if Stripe is configured and validates request parameters
2. **User Lookup**: Retrieves the authenticated user from the database
3. **Duplicate Check**: Verifies the user doesn't already have an active subscription
4. **Customer Creation**: Creates a Stripe customer if one doesn't exist, or retrieves existing customer ID
5. **Subscription Creation**: Creates the Stripe subscription with the provided price ID
6. **Database Save**: Saves the subscription details to the MongoDB database
7. **Tier Update**: Updates the user's tier to 'premium'
8. **Response**: Returns subscription details and updated user tier

### Error Handling

- Handles Stripe-specific errors (card errors, invalid requests)
- Validates all required fields before processing
- Checks for existing subscriptions to prevent duplicates
- Provides detailed error messages for debugging

### Database Operations

Creates a `Subscription` document with:
- User reference
- Stripe customer ID
- Stripe subscription ID
- Stripe price ID
- Plan type
- Subscription status
- Billing period dates
- Trial dates (if applicable)

Updates the `User` document:
- Sets `tier` to 'premium'
- Saves `stripeCustomerId` if newly created

## Difference from Checkout Session Flow

This endpoint differs from the `/api/subscription/create-checkout-session` endpoint:

- **Direct Creation**: Creates subscription immediately without redirect to Stripe Checkout
- **No UI Flow**: Doesn't involve Stripe's hosted checkout page
- **Immediate Activation**: Activates premium features immediately upon success
- **Use Case**: Suitable for programmatic subscription creation or custom payment flows

The checkout session flow is better for:
- User-facing payment flows with Stripe's UI
- PCI compliance (Stripe handles card details)
- Built-in payment method collection

## Testing

### Prerequisites

1. Stripe API keys configured in `.env`:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_MONTHLY` or `STRIPE_PRICE_YEARLY`

2. Valid JWT token for authentication

### Example Request

```bash
curl -X POST http://localhost:5000/api/subscription/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "priceId": "price_1234567890",
    "plan": "premium_monthly"
  }'
```

### Test Scenarios

1. **Successful Creation**: Valid priceId and plan
2. **Missing Fields**: Omit priceId or plan
3. **Invalid Plan**: Use invalid plan value
4. **Duplicate Subscription**: Try to create when user already has active subscription
5. **Invalid Price ID**: Use non-existent Stripe price ID
6. **Unauthenticated**: Request without JWT token

## Related Files

- Controller: `backend/controllers/subscription.controller.js`
- Route: `backend/routes/subscription.js`
- Model: `backend/models/Subscription.js`
- User Model: `backend/models/User.js`

## Related Tasks

- Task 12.1: Stripe integration setup
- Task 12.2.1: Subscription model creation
- Task 12.2.3: Subscription cancellation endpoint
- Task 12.2.4: Subscription upgrade/downgrade
- Task 12.2.5: Stripe webhook handler

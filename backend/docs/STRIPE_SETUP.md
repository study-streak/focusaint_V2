# Payment Integration Guide

## Stripe Removed
Stripe is no longer used for payment processing in this project. All Stripe dependencies and code have been removed.

## Dodo Payments (Optional)
The project now supports Dodo Payments as an optional payment provider. If you wish to enable paid subscriptions, integrate Dodo Payments according to their API/SDK documentation.

### To enable payments:
- Add your Dodo Payments integration code in the subscription controller and model.
- Set the `dodoPaymentId` field when creating a paid subscription.
- For free usage, users can create a subscription with the `free` plan and no payment required.

## Environment Variables
No payment provider environment variables are required by default. Add Dodo Payments keys if needed for your integration.
2. Fill in the details:
   - **Name**: Focusaint Premium Monthly
   - **Description**: Monthly subscription to Focusaint Premium features
   - **Pricing model**: Standard pricing
   - **Price**: $9.99 (or your chosen price)
   - **Billing period**: Monthly
   - **Currency**: USD
3. Click **Save product**
4. Copy the **Price ID** (starts with `price_`)

### Create Premium Yearly Plan

1. Click **Add product** again
2. Fill in the details:
   - **Name**: Focusaint Premium Yearly
   - **Description**: Yearly subscription to Focusaint Premium features (save 20%)
   - **Pricing model**: Standard pricing
   - **Price**: $95.99 (or your chosen price)
   - **Billing period**: Yearly
   - **Currency**: USD
3. Click **Save product**
4. Copy the **Price ID** (starts with `price_`)

### Add Price IDs to Environment

Add these to your `backend/.env` file:

```env
STRIPE_PRICE_MONTHLY=price_your_monthly_price_id_here
STRIPE_PRICE_YEARLY=price_your_yearly_price_id_here
```

## Step 4: Set Up Webhooks

Webhooks allow Stripe to notify your application about payment events.

### Local Development (using Stripe CLI)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe CLI:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:5000/api/subscription/webhook
   ```
4. Copy the webhook signing secret (starts with `whsec_`)
5. Add to `backend/.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

### Production (Stripe Dashboard)

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL: `https://yourdomain.com/api/subscription/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add to production environment variables

## Step 5: Test the Integration

### Test Cards

Use these test card numbers in test mode:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

Use any future expiration date, any 3-digit CVC, and any postal code.

### Test Flow

1. Start your backend server
2. Create a checkout session via API
3. Complete payment with test card
4. Verify webhook is received
5. Check that user tier is updated to premium

## Step 6: Production Setup

Before going live:

1. Switch to **Live mode** in Stripe Dashboard
2. Get your **Live API keys** (start with `pk_live_` and `sk_live_`)
3. Update production environment variables
4. Set up production webhook endpoint
5. Complete Stripe account activation (provide business details, bank account)
6. Test with real payment methods in a staging environment

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Validate webhook signatures** to prevent fraud
4. **Use HTTPS** in production
5. **Implement proper error handling** for payment failures
6. **Log all payment events** for audit trail
7. **Set up Stripe Radar** for fraud prevention

## Troubleshooting

### Webhook Not Receiving Events

- Check that webhook URL is accessible from the internet
- Verify webhook signing secret is correct
- Check server logs for errors
- Use Stripe CLI to test locally

### Payment Fails

- Check Stripe Dashboard logs
- Verify API keys are correct
- Ensure customer has valid payment method
- Check for insufficient funds or card restrictions

### Subscription Not Activating

- Verify webhook handler is processing events correctly
- Check database for subscription record
- Ensure user tier is being updated
- Review application logs for errors

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Security Best Practices](https://stripe.com/docs/security)

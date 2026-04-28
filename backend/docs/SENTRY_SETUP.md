# Sentry Error Tracking Setup

This document explains how to set up and configure Sentry for error tracking in the focusaint application.

## Overview

Sentry is integrated into both the backend (Express.js) and frontend (Next.js) to provide comprehensive error tracking, performance monitoring, and user context for debugging production issues.

## Backend Setup

### 1. Installation

The backend uses `@sentry/node` for error tracking:

```bash
cd backend
npm install @sentry/node
```

### 2. Configuration

Sentry is configured in `backend/config/sentry.js` with the following features:

- Environment-specific DSN configuration
- HTTP and Express.js tracing
- Performance profiling
- Sensitive data filtering (passwords, tokens, OTP)
- Error filtering (network errors, browser errors)

### 3. Environment Variables

Add the following to your `.env` file:

```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NODE_ENV=production
```

**Getting your DSN:**
1. Go to [Sentry.io](https://sentry.io)
2. Create a new project or select existing project
3. Go to Settings → Projects → [Your Project] → Client Keys (DSN)
4. Copy the DSN value

### 4. Integration Points

**Server Initialization (`server.js`):**
- Sentry is initialized first before any other middleware
- Request handler captures all incoming requests
- Tracing handler monitors performance
- Error handler captures exceptions before the global error handler

**Error Handler (`middleware/errorHandler.js`):**
- Automatically captures all exceptions
- Adds user context from JWT tokens
- Includes request metadata (path, method, status code)

**Auth Middleware (`middleware/auth.js`):**
- Sets user context for authenticated requests
- Includes user ID, email, and name

## Frontend Setup

### 1. Installation

The frontend uses `@sentry/nextjs` for error tracking:

```bash
cd frontend
npm install @sentry/nextjs
```

### 2. Configuration Files

Three configuration files are created for different Next.js runtimes:

- `sentry.client.config.ts` - Browser-side error tracking with session replay
- `sentry.server.config.ts` - Server-side error tracking
- `sentry.edge.config.ts` - Edge runtime error tracking
- `instrumentation.ts` - Loads appropriate config based on runtime

### 3. Next.js Configuration

The `next.config.mjs` is wrapped with `withSentryConfig` to enable:

- Source map uploads for better stack traces
- Automatic instrumentation of data fetching and API routes
- Tunnel route (`/monitoring`) to bypass ad-blockers
- React component annotations for better debugging

### 4. Environment Variables

Add the following to your `.env.local` file:

```env
# Runtime configuration (public)
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Build-time configuration (private)
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token
```

**Getting your auth token:**
1. Go to [Sentry.io](https://sentry.io)
2. Go to Settings → Account → API → Auth Tokens
3. Create a new token with `project:releases` and `org:read` scopes
4. Copy the token value

### 5. Integration Points

**API Client (`lib/api-client.ts`):**
- Captures API request errors
- Adds breadcrumbs for all API calls
- Includes endpoint and method in error context

**Auth Utilities (`lib/auth-cookie.ts`):**
- Sets user context on login
- Clears user context on logout

**Sentry Helper (`lib/sentry.ts`):**
- Provides utility functions for manual error tracking
- Includes functions for breadcrumbs, user context, and transactions

## Usage Examples

### Backend

**Manual Exception Capture:**
```javascript
import { captureException } from '../config/sentry.js';

try {
  // Some operation
} catch (error) {
  captureException(error, {
    feature: 'payment-processing',
    userId: user.id,
  });
  throw error;
}
```

**Manual Message Capture:**
```javascript
import { captureMessage } from '../config/sentry.js';

captureMessage('Payment webhook received', 'info');
```

**Add Breadcrumb:**
```javascript
import { addBreadcrumb } from '../config/sentry.js';

addBreadcrumb({
  message: 'User started checkout',
  category: 'payment',
  level: 'info',
  data: { amount: 9.99 },
});
```

### Frontend

**Manual Exception Capture:**
```typescript
import { captureException } from '@/lib/sentry';

try {
  // Some operation
} catch (error) {
  captureException(error as Error, {
    component: 'PaymentForm',
    action: 'submit',
  });
  throw error;
}
```

**Set User Context:**
```typescript
import { setUserContext } from '@/lib/sentry';

// After login
setUserContext({
  id: user.id,
  email: user.email,
  username: user.name,
});

// After logout
setUserContext(null);
```

**Add Breadcrumb:**
```typescript
import { addBreadcrumb } from '@/lib/sentry';

addBreadcrumb({
  message: 'User clicked upgrade button',
  category: 'ui',
  level: 'info',
  data: { plan: 'premium' },
});
```

## Sentry Dashboard Configuration

### 1. Alert Rules

Set up the following alert rules in your Sentry project:

**High Error Rate Alert:**
- Condition: Error count > 10 in 1 minute
- Action: Send email to on-call team
- Environment: production

**Performance Degradation Alert:**
- Condition: p95 response time > 1000ms
- Action: Send Slack notification
- Environment: production

**Payment Failure Alert:**
- Condition: Error with tag `feature:payment`
- Action: Send email to finance team
- Environment: production

### 2. Issue Grouping

Configure custom fingerprinting for better issue grouping:

- Group by error message and stack trace
- Separate issues by environment
- Group API errors by endpoint

### 3. Data Scrubbing

Ensure the following data is scrubbed:

- Password fields
- Credit card numbers
- API keys and tokens
- Email addresses (optional)

### 4. Release Tracking

Enable release tracking to:

- Track which version introduced errors
- Monitor error rates per release
- Automatically resolve issues in new releases

## Testing

### Backend Testing

```bash
# Start the backend with Sentry enabled
cd backend
SENTRY_DSN=your-dsn npm run dev

# Trigger a test error
curl -X POST http://localhost:5000/api/test-error
```

### Frontend Testing

```bash
# Start the frontend with Sentry enabled
cd frontend
NEXT_PUBLIC_SENTRY_DSN=your-dsn npm run dev

# Open browser and check console for Sentry initialization
# Trigger a test error by throwing an exception in a component
```

## Production Checklist

Before deploying to production:

- [ ] Set `SENTRY_DSN` in backend environment variables
- [ ] Set `NEXT_PUBLIC_SENTRY_DSN` in frontend environment variables
- [ ] Set `SENTRY_AUTH_TOKEN` for source map uploads
- [ ] Configure alert rules in Sentry dashboard
- [ ] Test error tracking in staging environment
- [ ] Verify source maps are uploaded correctly
- [ ] Set up on-call rotation for alerts
- [ ] Document incident response procedures

## Troubleshooting

### Errors Not Appearing in Sentry

1. Check that `SENTRY_DSN` is set correctly
2. Verify the DSN is for the correct project
3. Check network requests in browser DevTools
4. Ensure Sentry is initialized before errors occur

### Source Maps Not Working

1. Verify `SENTRY_AUTH_TOKEN` is set
2. Check that `productionBrowserSourceMaps: true` in `next.config.mjs`
3. Look for source map upload logs during build
4. Verify the release version matches between code and Sentry

### Too Many Errors

1. Adjust sample rates in configuration
2. Add more errors to `ignoreErrors` list
3. Set up rate limiting in Sentry project settings
4. Filter out non-actionable errors

## Resources

- [Sentry Node.js Documentation](https://docs.sentry.io/platforms/node/)
- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Best Practices](https://docs.sentry.io/product/best-practices/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)

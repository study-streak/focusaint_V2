# Error Handling Guide

This document explains how to use the centralized error handling system in the focusaint backend.

## Overview

The error handling system provides:
- **Custom error classes** for different error types
- **Consistent error response format** across all endpoints
- **Request ID tracking** for error correlation
- **Structured logging** with context
- **Integration-ready** for Sentry and other monitoring tools

## Custom Error Classes

All custom errors extend `AppError` and are located in `backend/utils/errors.js`.

### Available Error Classes

#### 1. ValidationError (400)
Used for input validation failures.

```javascript
import { ValidationError } from '../utils/errors.js'

// Basic usage
throw new ValidationError('Invalid input', [
  { field: 'email', message: 'Invalid email format' },
  { field: 'password', message: 'Password too short' }
])

// From Mongoose validation error
throw ValidationError.fromMongoose(mongooseError)

// From express-validator
throw ValidationError.fromExpressValidator(validationResult(req))
```

#### 2. AuthenticationError (401)
Used for authentication failures.

```javascript
import { AuthenticationError } from '../utils/errors.js'

// Basic usage
throw new AuthenticationError('Invalid credentials')

// Convenience methods
throw AuthenticationError.invalidToken()
throw AuthenticationError.tokenExpired()
throw AuthenticationError.invalidCredentials()
throw AuthenticationError.emailNotVerified()
```

#### 3. AuthorizationError (403)
Used for permission/access control failures.

```javascript
import { AuthorizationError } from '../utils/errors.js'

// Basic usage
throw new AuthorizationError('Access denied')

// Convenience method
throw AuthorizationError.insufficientPermissions('resource')
```

#### 4. TierRestrictionError (403)
Used when a feature requires a higher subscription tier.

```javascript
import { TierRestrictionError } from '../utils/errors.js'

// Basic usage
throw new TierRestrictionError('cloud_sync', 'free', 'premium')

// Convenience methods for common features
throw TierRestrictionError.cloudSync('free')
throw TierRestrictionError.deepMode('free')
throw TierRestrictionError.unlimitedHistory('free')
throw TierRestrictionError.dataExport('free')
throw TierRestrictionError.customAIPersona('free')
throw TierRestrictionError.streakInsurance('free')
throw TierRestrictionError.privateGroups('free')
```

#### 5. NotFoundError (404)
Used when a resource is not found.

```javascript
import { NotFoundError } from '../utils/errors.js'

// Basic usage
throw new NotFoundError('User', userId)

// Convenience methods
throw NotFoundError.user(userId)
throw NotFoundError.session(sessionId)
throw NotFoundError.task(taskId)
throw NotFoundError.group(groupId)
```

#### 6. ConflictError (409)
Used for duplicate resources or state conflicts.

```javascript
import { ConflictError } from '../utils/errors.js'

// Basic usage
throw new ConflictError('Email already exists')

// Convenience methods
throw ConflictError.duplicate('email', 'user@example.com')
throw ConflictError.stateConflict('Cannot delete active session', 'active', 'completed')
```

#### 7. RateLimitError (429)
Used when rate limits are exceeded.

```javascript
import { RateLimitError } from '../utils/errors.js'

throw new RateLimitError(100, 60, resetAt) // 100 requests per 60 seconds
```

#### 8. SessionLimitError (403)
Used when free users exceed daily session limits.

```javascript
import { SessionLimitError } from '../utils/errors.js'

throw new SessionLimitError(3, 3, resetAt) // current: 3, limit: 3
```

#### 9. TokenLimitError (403)
Used when users exceed LLM token limits.

```javascript
import { TokenLimitError } from '../utils/errors.js'

throw new TokenLimitError(1000, 1000, resetAt) // used: 1000, limit: 1000
```

#### 10. ExternalServiceError (502)
Used when external services fail.

```javascript
import { ExternalServiceError } from '../utils/errors.js'

// Basic usage
throw new ExternalServiceError('Stripe', 'Payment failed', originalError)

// Convenience methods
throw ExternalServiceError.stripe('Payment failed', originalError)
throw ExternalServiceError.gemini('API timeout', originalError)
throw ExternalServiceError.email('Failed to send', originalError)
```

#### 11. DatabaseError (500)
Used for database operation failures.

```javascript
import { DatabaseError } from '../utils/errors.js'

// Basic usage
throw new DatabaseError('Query failed', 'findOne', originalError)

// Convenience methods
throw DatabaseError.connectionFailed(originalError)
throw DatabaseError.queryFailed('update', originalError)
```

#### 12. BadRequestError (400)
Generic client error.

```javascript
import { BadRequestError } from '../utils/errors.js'

// Basic usage
throw new BadRequestError('Invalid request')

// Convenience methods
throw BadRequestError.invalidId('userId')
throw BadRequestError.missingField('email')
throw BadRequestError.invalidValue('age', -5, 'positive number')
```

#### 13. ServiceUnavailableError (503)
Used when service is temporarily unavailable.

```javascript
import { ServiceUnavailableError } from '../utils/errors.js'

// Basic usage
throw new ServiceUnavailableError('Service under maintenance', 3600)

// Convenience method
throw ServiceUnavailableError.maintenance(3600) // retry after 3600 seconds
```

## Using Errors in Route Handlers

### With asyncHandler (Recommended)

The `asyncHandler` wrapper automatically catches errors and passes them to the error handler.

```javascript
import { asyncHandler } from '../middleware/errorHandler.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
  
  if (!user) {
    throw NotFoundError.user(req.params.id)
  }
  
  res.json({ success: true, data: user })
}))
```

### Without asyncHandler

Manually catch errors and pass to `next()`.

```javascript
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    
    if (!user) {
      throw NotFoundError.user(req.params.id)
    }
    
    res.json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
})
```

## Error Response Format

All errors return a consistent JSON format:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User with identifier '123' not found",
    "details": {
      "resource": "User",
      "identifier": "123"
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_1705315800000_abc123"
  }
}
```

## Logging

The system includes structured logging with context.

### Using the Logger

```javascript
import { logger, createRequestLogger } from '../utils/logger.js'

// Basic logging
logger.info('User logged in', { userId: user.id })
logger.warn('Slow query detected', { duration: 1500 })
logger.error('Database connection failed', { error: err.message })
logger.debug('Cache hit', { key: 'user:123' })

// Request-specific logging
const reqLogger = createRequestLogger(req)
reqLogger.info('Processing payment', { amount: 100 })
```

### Log Levels

- **ERROR**: Critical errors that need immediate attention
- **WARN**: Warning conditions that should be reviewed
- **INFO**: Informational messages about normal operations
- **DEBUG**: Detailed debugging information

Set log level via environment variable:
```bash
LOG_LEVEL=debug  # error, warn, info, debug
```

## Request ID Tracking

Every request automatically gets a unique ID for tracking.

```javascript
// Access request ID in route handlers
router.get('/endpoint', (req, res) => {
  console.log('Request ID:', req.id)
  res.json({ requestId: req.id })
})

// Request ID is included in all error responses
// Request ID is added to response headers: X-Request-ID
```

## Middleware Setup

The error handling middleware is already configured in `server.js`:

```javascript
import { attachRequestId } from './middleware/requestId.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

// Early in middleware chain
app.use(attachRequestId)

// After all routes
app.use(notFoundHandler)
app.use(errorHandler)
```

## Best Practices

### 1. Use Specific Error Classes

```javascript
// ❌ Bad
throw new Error('User not found')

// ✅ Good
throw NotFoundError.user(userId)
```

### 2. Include Context in Errors

```javascript
// ❌ Bad
throw new BadRequestError('Invalid input')

// ✅ Good
throw new BadRequestError('Invalid input', {
  field: 'email',
  value: email,
  reason: 'invalid_format'
})
```

### 3. Use asyncHandler for Async Routes

```javascript
// ❌ Bad - manual try/catch
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find()
    res.json(users)
  } catch (error) {
    next(error)
  }
})

// ✅ Good - asyncHandler
router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find()
  res.json(users)
}))
```

### 4. Log Important Operations

```javascript
import { logger } from '../utils/logger.js'

router.post('/payment', asyncHandler(async (req, res) => {
  logger.info('Processing payment', {
    userId: req.user.id,
    amount: req.body.amount
  })
  
  const result = await processPayment(req.body)
  
  logger.info('Payment successful', {
    userId: req.user.id,
    transactionId: result.id
  })
  
  res.json({ success: true, data: result })
}))
```

### 5. Handle External Service Errors

```javascript
import { ExternalServiceError } from '../utils/errors.js'

try {
  const result = await stripe.charges.create(chargeData)
} catch (error) {
  throw ExternalServiceError.stripe('Payment failed', error)
}
```

## Testing Error Handling

### Test Error Responses

```javascript
import request from 'supertest'
import app from '../server.js'

describe('Error Handling', () => {
  it('should return 404 for non-existent user', async () => {
    const response = await request(app)
      .get('/api/users/invalid-id')
      .expect(404)
    
    expect(response.body.error.code).toBe('NOT_FOUND')
    expect(response.body.error.requestId).toBeDefined()
  })
  
  it('should return 403 for tier restriction', async () => {
    const response = await request(app)
      .post('/api/sessions/deep-mode')
      .set('Authorization', `Bearer ${freeUserToken}`)
      .expect(403)
    
    expect(response.body.error.code).toBe('TIER_RESTRICTION')
    expect(response.body.error.details.requiredTier).toBe('premium')
  })
})
```

## Integration with Sentry (Future)

The error handler is ready for Sentry integration:

```javascript
// Uncomment in errorHandler.js
import * as Sentry from '@sentry/node'

// In error handler
if (process.env.NODE_ENV === 'production' && !isOperational) {
  Sentry.captureException(err, {
    user: { id: req.user?.userId, email: req.user?.email },
    tags: { endpoint: req.path, method: req.method },
    extra: { requestId, details: err.details }
  })
}
```

## Summary

- Use custom error classes for specific error types
- Always include context in errors
- Use `asyncHandler` for async routes
- Log important operations with context
- Request IDs are automatically tracked
- Error responses are consistent across all endpoints
- System is ready for Sentry integration

For questions or issues, refer to the design document at `.kiro/specs/production-ready-focusaint/design.md`.

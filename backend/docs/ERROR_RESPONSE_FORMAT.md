# Error Response Format Documentation

## Overview

All API errors follow a consistent, standardized format to ensure predictable error handling on the frontend and clear debugging information.

## Standard Error Response Structure

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* Optional additional context */ },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_1234567890_abc123"
  }
}
```

### Fields

- **code** (string, required): Machine-readable error code in UPPER_SNAKE_CASE
- **message** (string, required): Human-readable error description
- **details** (object, optional): Additional context about the error
- **timestamp** (string, required): ISO 8601 timestamp when error occurred
- **requestId** (string, required): Unique identifier for request tracking

## HTTP Status Codes

| Status | Category | Usage |
|--------|----------|-------|
| 400 | Bad Request | Invalid input, validation failures |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions, tier restrictions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource, state conflicts |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server errors |
| 503 | Service Unavailable | External service failures, maintenance |

## Error Codes

### Authentication & Authorization

#### AUTHENTICATION_FAILED (401)
```json
{
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Invalid or expired token",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_1234567890_abc123"
  }
}
```

#### AUTHORIZATION_FAILED (403)
```json
{
  "error": {
    "code": "AUTHORIZATION_FAILED",
    "message": "Insufficient permissions to access this resource",
    "details": {
      "requiredPermission": "admin"
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_1234567890_abc123"
  }
}
```

### Validation Errors

#### VALIDATION_ERROR (400)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "not-an-email"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters",
        "value": "short"
      }
    ],
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_1234567890_abc123"
  }
}
```

### Resource Errors

#### NOT_FOUND (404)
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Task not found",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_1234567890_abc123"
  }
}
```

#### CONFLICT (409)
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "email already exists",
    "details": {
      "field": "email",
      "value": "user@example.com"
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_1234567890_abc123"
  }
}
```

### Rate Limiting

#### RATE_LIMIT_EXCEEDED (429)
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 5,
      "remaining": 0,
      "resetAt": "2024-01-15T10:45:00.000Z"
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_1234567890_abc123"
  }
}
```

### Tier Restrictions

#### SESSION_LIMIT_REACHED (403)
```json
{
  "error": {
    "code": "SESSION_LIMIT_REACHED",
    "message": "You've reached your daily limit of 3 sessions. Upgrade to premium for unlimited sessions.",
    "details": {
      "currentCount": 3,
      "limit": 3,
      "resetAt": "2024-01-16T00:00:00.000Z"
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_1234567890_abc123"
  }
}
```

#### TOKEN_LIMIT_EXCEEDED (403)
```json
{
  "error": {
    "code": "TOKEN_LIMIT_EXCEEDED",
    "message": "Daily LLM token limit exceeded. Resets at midnight UTC.",
    "details": {
      "used": 1000,
      "limit": 1000,
      "resetAt": "2024-01-16T00:00:00.000Z"
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_1234567890_abc123"
  }
}
```

#### TIER_RESTRICTION (403)
```json
{
  "error": {
    "code": "TIER_RESTRICTION",
    "message": "This feature requires a premium subscription.",
    "details": {
      "feature": "cloud_sync",
      "requiredTier": "premium"
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_1234567890_abc123"
  }
}
```

### Server Errors

#### INTERNAL_ERROR (500)
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_1234567890_abc123"
  }
}
```

#### SERVICE_UNAVAILABLE (503)
```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "AI Service is temporarily unavailable. Please try again later.",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_1234567890_abc123"
  }
}
```

#### EXTERNAL_SERVICE_ERROR (502)
```json
{
  "error": {
    "code": "EXTERNAL_SERVICE_ERROR",
    "message": "Stripe error: Payment processing failed",
    "details": {
      "service": "Stripe"
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "req_1234567890_abc123"
  }
}
```

## Usage in Backend

### Using Error Response Utilities

```javascript
import {
  validationError,
  authenticationError,
  notFoundError,
  sessionLimitError
} from '../utils/errorResponses.js'

// Validation error
if (!isValid) {
  return res.status(400).json(
    validationError([
      { field: 'email', message: 'Invalid email format' }
    ], req.id)
  )
}

// Authentication error
if (!token) {
  return res.status(401).json(
    authenticationError('Token required', req.id)
  )
}

// Not found error
if (!task) {
  return res.status(404).json(
    notFoundError('Task', req.id)
  )
}

// Session limit error
if (sessionCount >= 3) {
  return res.status(403).json(
    sessionLimitError({
      currentCount: sessionCount,
      limit: 3,
      resetAt: new Date(tomorrow).toISOString()
    }, req.id)
  )
}
```

### Global Error Handler

The global error handler automatically converts errors to the standard format:

```javascript
// Mongoose validation error → VALIDATION_ERROR
// JWT error → AUTHENTICATION_FAILED
// MongoDB duplicate key → CONFLICT
// CastError → BAD_REQUEST
// Generic error → INTERNAL_ERROR
```

## Frontend Error Handling

### Parsing Error Responses

```typescript
// lib/api-client.ts
async function handleApiError(response: Response) {
  const errorData = await response.json()
  
  // Standard error format
  const error = errorData.error
  
  console.error('API Error:', {
    code: error.code,
    message: error.message,
    details: error.details,
    requestId: error.requestId
  })
  
  // Handle specific error codes
  switch (error.code) {
    case 'AUTHENTICATION_FAILED':
      // Redirect to login
      window.location.href = '/login'
      break
      
    case 'SESSION_LIMIT_REACHED':
      // Show upgrade modal
      showUpgradeModal('sessions')
      break
      
    case 'TOKEN_LIMIT_EXCEEDED':
      // Show token limit message
      showTokenLimitMessage(error.details)
      break
      
    case 'VALIDATION_ERROR':
      // Display field-specific errors
      displayValidationErrors(error.details)
      break
      
    default:
      // Generic error message
      showErrorToast(error.message)
  }
  
  throw new APIError(error)
}
```

### TypeScript Types

```typescript
// types/api.ts
export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
    requestId: string
  }
}

export interface ValidationError {
  field: string
  message: string
  value?: any
}

export class APIError extends Error {
  code: string
  details?: any
  requestId: string
  
  constructor(error: ErrorResponse['error']) {
    super(error.message)
    this.code = error.code
    this.details = error.details
    this.requestId = error.requestId
  }
}
```

## Success Response Format

For consistency, success responses also follow a standard format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* Response data */ },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Paginated Responses

```json
{
  "success": true,
  "data": [ /* Array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Request ID Tracking

Every request receives a unique ID for tracking:

### Backend
```javascript
// Middleware attaches request ID
app.use(attachRequestId)

// Access in routes
console.log('Request ID:', req.id)

// Include in responses
res.setHeader('X-Request-ID', req.id)
```

### Frontend
```typescript
// Extract from response headers
const requestId = response.headers.get('X-Request-ID')

// Include in error reports
Sentry.captureException(error, {
  tags: { requestId }
})
```

## Testing Error Responses

### Unit Tests

```javascript
describe('Error Responses', () => {
  it('should return validation error format', () => {
    const error = validationError([
      { field: 'email', message: 'Invalid email' }
    ], 'req_123')
    
    expect(error.error.code).toBe('VALIDATION_ERROR')
    expect(error.error.message).toBe('Invalid input data')
    expect(error.error.details).toHaveLength(1)
    expect(error.error.requestId).toBe('req_123')
  })
  
  it('should return authentication error format', () => {
    const error = authenticationError('Invalid token', 'req_123')
    
    expect(error.error.code).toBe('AUTHENTICATION_FAILED')
    expect(error.error.message).toBe('Invalid token')
  })
})
```

### Integration Tests

```javascript
describe('API Error Handling', () => {
  it('should return 400 for invalid input', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'invalid' })
    
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.details).toBeDefined()
  })
  
  it('should return 401 for missing token', async () => {
    const res = await request(app)
      .get('/api/user/profile')
    
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('AUTHENTICATION_FAILED')
  })
})
```

## Best Practices

### DO

✅ Use standard error codes consistently
✅ Include helpful details for debugging
✅ Log errors with request IDs
✅ Return appropriate HTTP status codes
✅ Sanitize error messages (no sensitive data)
✅ Include timestamp for all errors
✅ Use request IDs for tracking

### DON'T

❌ Expose internal implementation details
❌ Include stack traces in production
❌ Return different formats for different endpoints
❌ Include sensitive data in error messages
❌ Use generic error messages without context
❌ Forget to log errors server-side

## Error Code Registry

Maintain a central registry of all error codes:

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| BAD_REQUEST | 400 | Generic client error |
| AUTHENTICATION_FAILED | 401 | Invalid/missing auth |
| AUTHORIZATION_FAILED | 403 | Insufficient permissions |
| TIER_RESTRICTION | 403 | Feature requires premium |
| SESSION_LIMIT_REACHED | 403 | Daily session limit hit |
| TOKEN_LIMIT_EXCEEDED | 403 | LLM token limit hit |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Duplicate/state conflict |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Unexpected server error |
| SERVICE_UNAVAILABLE | 503 | Service down/maintenance |
| EXTERNAL_SERVICE_ERROR | 502 | External API failure |

## Monitoring & Alerting

### Error Tracking

```javascript
// Log errors with context
console.error('API Error:', {
  requestId: req.id,
  code: error.code,
  message: error.message,
  userId: req.user?.userId,
  path: req.path,
  method: req.method
})

// Send to Sentry
Sentry.captureException(error, {
  tags: {
    errorCode: error.code,
    requestId: req.id
  },
  user: {
    id: req.user?.userId
  }
})
```

### Metrics

Track error rates by code:
- VALIDATION_ERROR rate
- AUTHENTICATION_FAILED rate
- RATE_LIMIT_EXCEEDED rate
- INTERNAL_ERROR rate (should be < 1%)

Alert on:
- Error rate > 5%
- INTERNAL_ERROR rate > 1%
- Spike in specific error codes

# Structured Logging System

## Overview

The focusaint backend uses Winston for production-grade structured logging with automatic log rotation, multiple log levels, and environment-aware formatting.

## Features

- **Multiple Log Levels**: error, warn, info, http, debug
- **Structured JSON Logging**: Machine-readable logs for production
- **Pretty Console Logs**: Human-readable logs for development
- **Automatic Log Rotation**: Daily rotation with configurable retention
- **Slow Query Detection**: Automatic logging of slow database queries (>1s)
- **Request/Response Logging**: Comprehensive HTTP request tracking
- **Context Enrichment**: Request ID, user ID, and metadata in all logs
- **Sentry Integration**: Automatic error reporting to Sentry

## Log Levels

The system uses Winston's npm log levels:

| Level | Priority | Usage |
|-------|----------|-------|
| error | 0 | Application errors, exceptions, critical issues |
| warn  | 1 | Warning conditions, slow queries, degraded performance |
| info  | 2 | General informational messages, startup, shutdown |
| http  | 3 | HTTP request/response logging |
| debug | 4 | Detailed debugging information, query details |

## Configuration

### Environment Variables

```bash
# Set log level (default: 'debug' in dev, 'info' in production)
LOG_LEVEL=info

# Disable all logging (useful for testing)
LOG_SILENT=false
```

### Log Level Recommendations

- **Development**: `LOG_LEVEL=debug` - Most verbose, includes all query details
- **Staging**: `LOG_LEVEL=info` - Balanced logging for testing
- **Production**: `LOG_LEVEL=warn` - Only warnings and errors

## Log Storage

### Development
- Console output with pretty formatting
- File logs in `backend/logs/` directory:
  - `combined-YYYY-MM-DD.log` - All logs (info and above)
  - `error-YYYY-MM-DD.log` - Error logs only
  - `debug-YYYY-MM-DD.log` - Debug logs (development only)

### Production
- Console output as structured JSON
- File logs in `backend/logs/` directory (non-serverless)
- Serverless (Vercel): Logs to `/tmp/logs` (ephemeral)

## Log Retention

| Log Type | Retention Period |
|----------|------------------|
| Combined logs | 30 days |
| Error logs | 90 days |
| Debug logs | 7 days (dev only) |

Logs are automatically rotated daily and old logs are deleted based on retention policy.

## Usage

### Basic Logging

```javascript
import logger from './utils/logger.js'

// Error logging
logger.error('Database connection failed', { 
  error: err.message,
  retryCount: 3
})

// Warning logging
logger.warn('Slow query detected', { 
  duration: '1500ms',
  collection: 'users'
})

// Info logging
logger.info('User logged in', { 
  userId: user._id,
  email: user.email
})

// HTTP logging (automatic via middleware)
logger.http('GET /api/user/profile 200', {
  requestId: 'req_123',
  duration: '45ms'
})

// Debug logging
logger.debug('Cache hit', { 
  key: 'user:123',
  ttl: 300
})
```

### Request Logger

Create a logger with request context:

```javascript
import { createRequestLogger } from './utils/logger.js'

export const myMiddleware = (req, res, next) => {
  const reqLogger = createRequestLogger(req)
  
  reqLogger.info('Processing request', { 
    body: req.body 
  })
  
  // All logs will include request context automatically
  next()
}
```

### Error Logging

```javascript
import { logError } from './utils/logger.js'

try {
  await riskyOperation()
} catch (error) {
  logError(error, {
    operation: 'riskyOperation',
    userId: req.user?.userId
  })
  throw error
}
```

### Database Query Logging

Automatic logging is configured via Mongoose plugin:

```javascript
// Queries are automatically logged with duration
// Slow queries (>1s) are logged as warnings
const users = await User.find({ active: true })
// Logs: "Database find on users" with duration
```

### External Service Logging

```javascript
import { logExternalService } from './utils/logger.js'

const startTime = Date.now()
try {
  const result = await stripeAPI.createCharge(...)
  const duration = Date.now() - startTime
  
  logExternalService('Stripe', 'createCharge', duration, true, {
    chargeId: result.id,
    amount: result.amount
  })
} catch (error) {
  const duration = Date.now() - startTime
  
  logExternalService('Stripe', 'createCharge', duration, false, {
    error: error.message
  })
}
```

## Middleware

### Request/Response Logging

Automatically logs all HTTP requests and responses:

```javascript
import { requestLoggingMiddleware } from './utils/logger.js'

app.use(requestLoggingMiddleware)
```

Logs include:
- Request ID
- HTTP method and path
- Status code
- Response time
- User ID (if authenticated)
- IP address
- User agent

### Slow Query Detection

Automatically logs requests that exceed threshold:

```javascript
import { slowQueryMiddleware } from './utils/logger.js'

// Log requests taking longer than 1 second
app.use(slowQueryMiddleware(1000))
```

## Log Format

### Development (Console)

```
2024-01-15 10:30:45 [info]: User logged in
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "requestId": "req_abc123"
}
```

### Production (JSON)

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "User logged in",
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "requestId": "req_abc123",
  "env": "production"
}
```

## Best Practices

### 1. Use Appropriate Log Levels

```javascript
// ✅ Good
logger.error('Payment processing failed', { orderId, error })
logger.warn('Cache miss, fetching from database', { key })
logger.info('User registered successfully', { userId })
logger.debug('Cache key generated', { key, ttl })

// ❌ Bad
logger.info('Critical error occurred') // Should be error
logger.error('User clicked button') // Should be debug or not logged
```

### 2. Include Context

```javascript
// ✅ Good
logger.error('Database query failed', {
  operation: 'findOne',
  collection: 'users',
  filter: { email: 'user@example.com' },
  error: err.message
})

// ❌ Bad
logger.error('Query failed')
```

### 3. Avoid Logging Sensitive Data

```javascript
// ✅ Good
logger.info('User authenticated', { 
  userId: user._id,
  email: user.email 
})

// ❌ Bad
logger.info('User authenticated', { 
  password: user.password, // Never log passwords!
  token: jwt // Never log tokens!
})
```

### 4. Use Structured Data

```javascript
// ✅ Good
logger.info('Order created', {
  orderId: order._id,
  amount: order.total,
  items: order.items.length
})

// ❌ Bad
logger.info(`Order ${order._id} created with ${order.items.length} items`)
```

## Monitoring and Alerts

### Log Aggregation

In production, logs should be aggregated to a centralized logging service:

- **AWS CloudWatch**: For AWS deployments
- **Google Cloud Logging**: For GCP deployments
- **Datadog**: For multi-cloud monitoring
- **Loggly**: For log aggregation and search
- **Papertrail**: For simple log management

### Alert Configuration

Set up alerts for critical log patterns:

```javascript
// Error rate > 1%
level: "error" AND count > 10 per minute

// Slow queries
level: "warn" AND message: "Slow query detected"

// Database connection issues
message: "MongoDB connection" AND level: "error"

// High response times
duration > 1000ms AND count > 50 per minute
```

## Troubleshooting

### Logs Not Appearing

1. Check `LOG_LEVEL` environment variable
2. Verify `LOG_SILENT` is not set to `true`
3. Check file permissions on `backend/logs/` directory
4. Verify Winston is installed: `npm list winston`

### Log Files Growing Too Large

1. Verify log rotation is working (check for dated log files)
2. Reduce `LOG_LEVEL` in production (use `warn` or `error`)
3. Adjust retention periods in `logger.js`
4. Consider using external log aggregation service

### Missing Context in Logs

1. Ensure `attachRequestId` middleware runs before logging
2. Use `createRequestLogger(req)` for request-scoped logging
3. Pass context objects to all log calls

## Performance Considerations

- Logging has minimal performance impact (<1ms per log entry)
- File I/O is asynchronous and non-blocking
- Log rotation happens in background
- Consider reducing log level in high-traffic production environments
- Use external log aggregation for better performance at scale

## Integration with Sentry

Errors logged at `error` level are automatically sent to Sentry (if configured):

```javascript
logger.error('Payment failed', { 
  orderId: '123',
  error: err.message 
})
// Automatically sent to Sentry with full context
```

## Testing

Disable logging in tests:

```bash
LOG_SILENT=true npm test
```

Or programmatically:

```javascript
process.env.LOG_SILENT = 'true'
```

## Migration from Console Logging

Replace console statements with logger:

```javascript
// Before
console.log('User logged in')
console.error('Error:', error)
console.warn('Warning:', message)

// After
logger.info('User logged in')
logger.error('Error occurred', { error: error.message })
logger.warn('Warning condition', { message })
```

## Additional Resources

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Winston Daily Rotate File](https://github.com/winstonjs/winston-daily-rotate-file)
- [Logging Best Practices](https://www.loggly.com/ultimate-guide/node-logging-basics/)

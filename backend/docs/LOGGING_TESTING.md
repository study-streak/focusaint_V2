# Testing the Logging System

## Quick Start

1. **Set log level in your `.env` file:**
   ```bash
   LOG_LEVEL=debug
   ```

2. **Start the server:**
   ```bash
   cd backend
   npm run dev
   ```

3. **Make some API requests** and watch the logs in your console

## What You Should See

### Server Startup
```
2024-01-15 10:30:45 [info]: MongoDB connected
{
  "poolSize": "2-10",
  "host": "localhost",
  "database": "focusaint"
}

2024-01-15 10:30:45 [info]: focusaint server running on http://localhost:5000
{
  "port": 5000
}
```

### HTTP Requests
```
2024-01-15 10:31:12 [http]: POST /api/auth/login
{
  "requestId": "req_abc123",
  "method": "POST",
  "path": "/api/auth/login",
  "ip": "::1",
  "userAgent": "Mozilla/5.0..."
}

2024-01-15 10:31:12 [http]: POST /api/auth/login 200
{
  "requestId": "req_abc123",
  "method": "POST",
  "path": "/api/auth/login",
  "statusCode": 200,
  "duration": "145ms"
}
```

### Database Queries
```
2024-01-15 10:31:12 [debug]: Database findOne on users
{
  "operation": "findOne",
  "collection": "users",
  "duration": "23ms"
}
```

### Slow Queries (>1s)
```
2024-01-15 10:32:45 [warn]: Slow database query: find on habitsessions
{
  "operation": "find",
  "collection": "habitsessions",
  "duration": "1234ms"
}

2024-01-15 10:32:45 [warn]: Slow request detected
{
  "requestId": "req_def456",
  "method": "GET",
  "path": "/api/habit/sessions",
  "duration": "1250ms",
  "threshold": "1000ms",
  "statusCode": 200
}
```

### Errors
```
2024-01-15 10:33:00 [error]: Invalid credentials
{
  "errorName": "AuthenticationError",
  "errorMessage": "Invalid credentials",
  "errorCode": "INVALID_CREDENTIALS",
  "statusCode": 401,
  "requestId": "req_ghi789",
  "path": "/api/auth/login",
  "method": "POST",
  "userId": undefined
}
```

## Log Files

Check the `backend/logs/` directory for log files:

```bash
ls -la backend/logs/

# You should see:
# combined-2024-01-15.log  (all logs)
# error-2024-01-15.log     (errors only)
# debug-2024-01-15.log     (debug logs, dev only)
```

## Testing Different Log Levels

### Error Level (Production)
```bash
LOG_LEVEL=error npm run dev
```
Only errors will be logged. Good for production.

### Warn Level
```bash
LOG_LEVEL=warn npm run dev
```
Warnings and errors. Good for production monitoring.

### Info Level (Staging)
```bash
LOG_LEVEL=info npm run dev
```
Info, warnings, and errors. Good for staging.

### Debug Level (Development)
```bash
LOG_LEVEL=debug npm run dev
```
Everything including database queries. Good for development.

## Testing Scenarios

### 1. Test Normal Request Flow
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Expected logs:
- HTTP request log
- Database query log (findOne on users)
- HTTP response log

### 2. Test Error Handling
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@example.com","password":"wrong"}'
```

Expected logs:
- HTTP request log
- Database query log
- Error log (Invalid credentials)
- HTTP response log (401)

### 3. Test Slow Query Detection
Create a slow query by adding a delay in your code temporarily:
```javascript
// In any route handler
await new Promise(resolve => setTimeout(resolve, 1500))
```

Expected logs:
- Slow request warning with duration

### 4. Test Database Connection
Stop MongoDB and restart the server:
```bash
# Stop MongoDB
sudo systemctl stop mongod  # Linux
brew services stop mongodb-community  # Mac

# Start server
npm run dev
```

Expected logs:
- MongoDB connection failed errors
- Retry attempts
- Final failure after max retries

## Verifying Log Rotation

1. **Check current log files:**
   ```bash
   ls -la backend/logs/
   ```

2. **Wait for next day or manually create dated files:**
   ```bash
   touch backend/logs/combined-2024-01-14.log
   touch backend/logs/combined-2024-01-13.log
   ```

3. **Verify old logs are kept according to retention policy:**
   - Combined logs: 30 days
   - Error logs: 90 days
   - Debug logs: 7 days

## Troubleshooting

### No logs appearing
1. Check `LOG_LEVEL` is set correctly
2. Verify `LOG_SILENT` is not set to `true`
3. Check console for Winston initialization errors

### Log files not created
1. Check `backend/logs/` directory exists and is writable
2. Verify you're not running in Vercel (uses /tmp/logs)
3. Check file permissions

### Logs too verbose
1. Increase `LOG_LEVEL` to `info` or `warn`
2. Reduce logging in high-traffic routes
3. Consider using external log aggregation

### Missing context in logs
1. Ensure `attachRequestId` middleware runs early
2. Use `createRequestLogger(req)` for request-scoped logs
3. Pass context objects to all log calls

## Production Checklist

Before deploying to production:

- [ ] Set `LOG_LEVEL=warn` or `LOG_LEVEL=error`
- [ ] Verify `SENTRY_DSN` is configured for error tracking
- [ ] Set up log aggregation service (CloudWatch, Datadog, etc.)
- [ ] Configure alerts for error rate > 1%
- [ ] Test log rotation is working
- [ ] Verify sensitive data is not logged (passwords, tokens)
- [ ] Set up monitoring dashboard for log metrics

## Integration with Monitoring

### Sentry Integration
Errors are automatically sent to Sentry when `SENTRY_DSN` is configured:

```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

### CloudWatch (AWS)
Stream logs to CloudWatch:
```bash
# Install CloudWatch agent
npm install winston-cloudwatch

# Configure in logger.js
```

### Datadog
Stream logs to Datadog:
```bash
# Install Datadog transport
npm install @datadog/winston

# Configure in logger.js
```

## Performance Impact

Logging has minimal performance impact:
- Console logging: <1ms per log
- File logging: <2ms per log (async)
- Log rotation: Background process, no impact

Monitor your application performance and adjust log levels if needed.

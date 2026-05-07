# Rate Limiting Implementation

## Overview

Comprehensive rate limiting middleware using `express-rate-limit` with Redis store for distributed rate limiting across multiple server instances.

## Features

- **Redis-backed storage**: Persistent rate limiting across server restarts and multiple instances
- **Per-user rate limiting**: Uses JWT user ID for authenticated requests
- **IP-based rate limiting**: Falls back to IP address for unauthenticated requests
- **Endpoint-specific limits**: Different rate limits for different endpoint categories
- **Graceful degradation**: Falls back to memory store if Redis is unavailable
- **Standard headers**: Returns `RateLimit-*` headers with limit information
- **Retry-After headers**: Includes retry timing in error responses

## Configuration

### Environment Variables

Add to your `.env` file:

```env
REDIS_URL=redis://localhost:6379
```

For Redis Cloud or remote instances:
```env
REDIS_URL=redis://username:password@host:port
```

### Rate Limit Configurations

| Endpoint Category | Window | Max Requests | Key Generator |
|------------------|--------|--------------|---------------|
| Login | 15 min | 5 | IP address |
| Signup | 1 hour | 3 | IP address |
| Password Reset | 1 hour | 3 | IP address |
| OTP Requests | 15 min | 5 | IP address |
| AI Chat | 1 hour | 20 | User ID or IP |
| Session Creation | 1 min | 10 | User ID or IP |
| File Upload | 15 min | 10 | User ID or IP |
| General API | 1 min | 100 | User ID or IP |
| Strict Operations | 1 hour | 10 | User ID or IP |

## Usage

### In Routes

```javascript
import { 
  authLoginLimiter, 
  aiChatLimiter,
  sessionCreateLimiter 
} from '../middleware/rateLimit.js';

// Apply to specific routes
router.post('/login', authLoginLimiter, async (req, res) => {
  // Login logic
});

router.post('/ai/chat', authenticateToken, aiChatLimiter, async (req, res) => {
  // AI chat logic
});
```

### In Server.js

```javascript
import { extractUserForRateLimit } from './middleware/extractUser.js';
import { apiLimiter } from './middleware/rateLimit.js';

// Extract user info BEFORE rate limiting
app.use(extractUserForRateLimit);

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter);
```

## Error Response Format

When rate limit is exceeded:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many login attempts. Please try again in 15 minutes.",
    "details": {
      "limit": 5,
      "windowMs": 900000,
      "retryAfter": 900
    },
    "timestamp": "2024-01-14T15:30:00Z",
    "requestId": "req_abc123"
  }
}
```

## Response Headers

All requests include rate limit headers:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1705245600
```

When limit is exceeded:
```
Retry-After: 900
```

## Key Generator Logic

The rate limiting uses intelligent key generation:

1. **Authenticated requests**: Uses `req.user.id` (extracted from JWT)
2. **Unauthenticated requests**: Uses `req.ip` or `req.connection.remoteAddress`

This ensures:
- Users are rate-limited per account (not per IP)
- Multiple users behind the same IP don't affect each other
- Unauthenticated endpoints are protected from IP-based abuse

## Redis Connection

The middleware automatically:
- Connects to Redis on startup
- Implements exponential backoff retry (up to 10 attempts)
- Falls back to memory store if Redis is unavailable
- Logs connection status and errors

## Testing

### Test Rate Limiting

```bash
# Test login rate limit (5 requests in 15 min)
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
```

### Check Redis Connection

```bash
# Connect to Redis CLI
redis-cli

# Check rate limit keys
KEYS rate-limit:*

# View specific key
GET rate-limit:/api/auth/login:192.168.1.1
```

## Production Considerations

### Redis Setup

For production, use a managed Redis service:
- **AWS ElastiCache**: Fully managed Redis
- **Redis Cloud**: Official Redis hosting
- **DigitalOcean Managed Redis**: Simple setup
- **Upstash**: Serverless Redis with REST API

### Scaling

The Redis-backed rate limiting automatically works across:
- Multiple server instances
- Load-balanced deployments
- Horizontal scaling scenarios

### Monitoring

Monitor these metrics:
- Rate limit hit rate (how often limits are reached)
- Redis connection health
- Memory store fallback usage
- Top rate-limited endpoints

## Customization

### Create Custom Rate Limiter

```javascript
import { createRateLimiter } from './middleware/rateLimit.js';

export const customLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 requests
  message: 'Custom rate limit message',
  keyGenerator: (req) => {
    // Custom key logic
    return req.user?.id || req.ip;
  }
});
```

### Adjust Existing Limits

Edit `backend/middleware/rateLimit.js` and modify the configuration:

```javascript
export const authLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5, // Change this value
  message: 'Too many login attempts.',
  keyGenerator: (req) => req.ip
});
```

## Troubleshooting

### Redis Connection Issues

If you see "Redis connection failed" warnings:
1. Check Redis is running: `redis-cli ping`
2. Verify REDIS_URL in .env
3. Check firewall/network settings
4. System will fall back to memory store automatically

### Rate Limits Not Working

1. Ensure `extractUserForRateLimit` runs before rate limiters
2. Check middleware order in server.js
3. Verify Redis connection is successful
4. Check rate limiter is applied to the route

### Different Limits Per User Tier

For tier-based rate limiting (free vs premium):

```javascript
export const tierAwareLimiter = (req, res, next) => {
  const limit = req.user?.tier === 'premium' ? 1000 : 100;
  
  const limiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: limit,
    keyGenerator: (req) => req.user?.id || req.ip
  });
  
  return limiter(req, res, next);
};
```

## Security Best Practices

1. **Always use Redis in production**: Memory store doesn't persist across restarts
2. **Secure Redis**: Use authentication and TLS for Redis connections
3. **Monitor rate limit abuse**: Track IPs/users hitting limits frequently
4. **Adjust limits based on usage**: Review and tune limits based on legitimate traffic
5. **Combine with other security**: Rate limiting is one layer; use with auth, validation, etc.

## Related Files

- `backend/middleware/rateLimit.js` - Main rate limiting configuration
- `backend/middleware/extractUser.js` - JWT user extraction for per-user limiting
- `backend/server.js` - Rate limiter integration
- `backend/.env.example` - Environment variable template

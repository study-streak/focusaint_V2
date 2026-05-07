# CSRF Protection Implementation

## Overview

This application implements CSRF (Cross-Site Request Forgery) protection using the **double-submit cookie pattern**. This is a modern, secure alternative to the deprecated `csurf` package.

## How It Works

### 1. Token Generation
- When a client makes any request, the server generates a random CSRF token
- The token is stored in a cookie named `csrf-token`
- The cookie is readable by JavaScript (`httpOnly: false`) so the client can access it

### 2. Token Validation
- For state-changing requests (POST, PUT, PATCH, DELETE), the client must:
  1. Read the CSRF token from the `csrf-token` cookie
  2. Include it in the `X-CSRF-Token` request header
- The server validates that the cookie token matches the header token
- If they don't match or are missing, the request is rejected with a 403 error

### 3. Security Properties
- **Same-Origin Policy**: Attackers cannot read cookies from other domains
- **Timing-Safe Comparison**: Prevents timing attacks when comparing tokens
- **Cryptographically Secure**: Uses `crypto.randomBytes()` for token generation
- **SameSite Cookie**: Set to `strict` to prevent cross-site cookie sending

## Implementation Details

### Backend Middleware

**File**: `backend/middleware/csrf.js`

Three main exports:

1. **`csrfTokenGenerator`**: Generates and sets CSRF token in cookie
   - Applied to all requests before routes
   - Only generates new token if one doesn't exist

2. **`csrfProtection`**: Validates CSRF token on state-changing requests
   - Applied to all `/api` routes
   - Skips validation for GET, HEAD, OPTIONS (safe methods)
   - Returns 403 if validation fails

3. **`getCsrfToken`**: Endpoint to fetch CSRF token
   - Available at `/api/csrf-token`
   - Useful for SPAs that need the token on initial load

### Frontend Integration

**File**: `frontend/lib/api-client.ts`

The `APIClient` class automatically handles CSRF tokens:

1. **`getCsrfToken()`**: Reads token from cookie
2. **`ensureCsrfToken()`**: Fetches token from server if not in cookie
3. **`request()`**: Automatically adds `X-CSRF-Token` header for POST/PUT/PATCH/DELETE

All API calls through `APIClient` are automatically protected.

## Usage Examples

### Backend Route (No Changes Required)

```javascript
// Routes automatically protected by CSRF middleware
router.post('/api/user/profile', authenticateToken, async (req, res) => {
  // Your route logic here
  // CSRF validation happens automatically before this
});
```

### Frontend API Call (No Changes Required)

```typescript
// CSRF token automatically included
await APIClient.post('/user/profile', {
  name: 'John Doe',
  email: 'john@example.com'
});
```

### Manual CSRF Token Fetch (If Needed)

```typescript
// Fetch CSRF token explicitly
const response = await fetch('http://localhost:5000/api/csrf-token', {
  credentials: 'include'
});
const { csrfToken } = await response.json();
```

## Configuration

### Environment Variables

```env
NODE_ENV=production  # Enables secure cookies (HTTPS only)
```

### Cookie Settings

- **Name**: `csrf-token`
- **HttpOnly**: `false` (client needs to read it)
- **Secure**: `true` in production (HTTPS only)
- **SameSite**: `strict`
- **Max-Age**: 24 hours

## Error Responses

### Missing Cookie Token
```json
{
  "error": {
    "code": "CSRF_TOKEN_MISSING",
    "message": "CSRF token missing from cookie",
    "timestamp": "2024-01-14T15:30:00Z"
  }
}
```

### Missing Header Token
```json
{
  "error": {
    "code": "CSRF_TOKEN_MISSING",
    "message": "CSRF token missing from request header",
    "timestamp": "2024-01-14T15:30:00Z"
  }
}
```

### Invalid Token
```json
{
  "error": {
    "code": "CSRF_TOKEN_INVALID",
    "message": "CSRF token validation failed",
    "timestamp": "2024-01-14T15:30:00Z"
  }
}
```

## Testing CSRF Protection

### Test Valid Request
```bash
# 1. Get CSRF token
curl -c cookies.txt http://localhost:5000/api/csrf-token

# 2. Extract token from cookie
TOKEN=$(grep csrf-token cookies.txt | awk '{print $7}')

# 3. Make authenticated request with CSRF token
curl -b cookies.txt \
  -H "X-CSRF-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -X POST \
  -d '{"name":"Test"}' \
  http://localhost:5000/api/user/profile
```

### Test Invalid Request (Should Fail)
```bash
# Request without CSRF token (should return 403)
curl -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -X POST \
  -d '{"name":"Test"}' \
  http://localhost:5000/api/user/profile
```

## Security Considerations

### Why Double-Submit Cookie Pattern?

1. **No Server-Side State**: Tokens don't need to be stored in database/session
2. **Scalable**: Works well with load balancers and multiple servers
3. **Simple**: Easy to implement and understand
4. **Effective**: Prevents CSRF attacks reliably

### Limitations

- Requires cookies to be enabled
- Vulnerable if attacker can inject cookies (rare, requires other vulnerabilities)
- Not suitable for public APIs (use API keys instead)

### Best Practices

✅ **Do**:
- Use HTTPS in production (secure cookies)
- Set `SameSite=strict` on cookies
- Use timing-safe comparison for token validation
- Generate cryptographically secure random tokens

❌ **Don't**:
- Store CSRF tokens in localStorage (vulnerable to XSS)
- Use predictable token generation
- Skip CSRF protection on state-changing endpoints
- Disable CORS when using CSRF protection

## Troubleshooting

### "CSRF token missing from cookie"
- Ensure `credentials: 'include'` is set in fetch requests
- Check that cookies are enabled in browser
- Verify CORS is configured to allow credentials

### "CSRF token validation failed"
- Token in cookie doesn't match token in header
- Token may have expired (24 hour lifetime)
- Try fetching a new token from `/api/csrf-token`

### Cookies not being set
- Check CORS configuration allows credentials
- Ensure `SameSite` attribute is compatible with your setup
- In production, verify HTTPS is enabled for secure cookies

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetsecurity.org/cheatsheets/cross-site-request-forgery-prevention-cheat-sheet/)
- [Double Submit Cookie Pattern](https://cheatsheetsecurity.org/cheatsheets/cross-site-request-forgery-prevention-cheat-sheet/#double-submit-cookie)
- [MDN: SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)

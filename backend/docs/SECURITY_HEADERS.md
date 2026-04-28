# Security Headers Implementation

## Overview

This document describes the security headers implementation for the focusaint backend API. The implementation uses helmet.js and custom middleware to provide comprehensive protection against common web vulnerabilities.

## Implemented Security Headers

### 1. HTTP Strict Transport Security (HSTS)

**Purpose**: Forces browsers to use HTTPS connections only, preventing protocol downgrade attacks.

**Configuration**:
```javascript
strictTransportSecurity: {
  maxAge: 31536000,        // 1 year
  includeSubDomains: true, // Apply to all subdomains
  preload: true            // Allow browser preload list inclusion
}
```

**Protection Against**:
- Man-in-the-middle attacks
- Protocol downgrade attacks
- Cookie hijacking

### 2. Content Security Policy (CSP)

**Purpose**: Controls which resources can be loaded and executed, preventing XSS and data injection attacks.

**Configuration**:
```javascript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "http://localhost:3000", "https://api.stripe.com"],
    frameSrc: ["'self'", "https://js.stripe.com"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [] // Production only
  }
}
```

**Protection Against**:
- Cross-Site Scripting (XSS)
- Data injection attacks
- Unauthorized resource loading

**Notes**:
- `'unsafe-inline'` is allowed for scripts and styles to support frontend frameworks
- Adjust `connectSrc` to include your production frontend URL
- Add additional trusted domains as needed for third-party integrations

### 3. X-Frame-Options

**Purpose**: Prevents the application from being embedded in iframes, protecting against clickjacking.

**Configuration**:
```javascript
frameguard: {
  action: "deny" // Completely deny framing
}
```

**Protection Against**:
- Clickjacking attacks
- UI redressing attacks

### 4. X-Content-Type-Options

**Purpose**: Prevents browsers from MIME-sniffing responses, forcing them to respect declared content types.

**Configuration**:
```javascript
noSniff: true
```

**Protection Against**:
- MIME type confusion attacks
- Drive-by downloads

### 5. Additional Security Headers

#### X-DNS-Prefetch-Control
Disables DNS prefetching to prevent information leakage.

#### X-Download-Options
Prevents IE from executing downloads in the site's context.

#### X-Permitted-Cross-Domain-Policies
Restricts Adobe Flash/PDF cross-domain requests.

#### Referrer-Policy
Controls how much referrer information is sent with requests.

```javascript
referrerPolicy: {
  policy: "strict-origin-when-cross-origin"
}
```

#### X-XSS-Protection
Enables XSS filtering in legacy browsers.

## CORS Configuration

### Strict Origin Validation

The CORS middleware implements strict origin validation to prevent unauthorized cross-origin requests.

**Configuration**:
```javascript
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.CORS_ORIGIN || "http://localhost:3000",
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "http://localhost:3001"
    ].filter(Boolean)

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS policy`))
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "X-Requested-With"],
  exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
  maxAge: 86400 // 24 hours
}
```

**Features**:
- Whitelist-based origin validation
- Credentials support for cookies and auth headers
- Rate limit headers exposed to clients
- Preflight request caching

## Custom Security Middleware

### Additional Headers

The `additionalSecurityMiddleware` function adds extra security measures:

1. **Remove X-Powered-By**: Hides Express framework information
2. **Legacy CSP Headers**: Adds X-Content-Security-Policy and X-WebKit-CSP for older browsers
3. **Cache Control**: Prevents caching of sensitive endpoints (auth, user data)

```javascript
// Prevent caching of sensitive endpoints
if (req.path.includes("/api/auth") || req.path.includes("/api/user")) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private")
  res.setHeader("Pragma", "no-cache")
  res.setHeader("Expires", "0")
}
```

## Environment-Specific Configuration

### Development vs Production

The security configuration adapts based on the environment:

**Development**:
- Less strict CSP (allows more inline scripts/styles)
- No HTTPS upgrade enforcement
- Detailed error messages
- Security violation logging

**Production**:
- Strict CSP enforcement
- HTTPS upgrade enforcement via CSP
- Generic error messages
- Security violation reporting

## Usage

### Integration in server.js

The security headers are applied early in the middleware chain:

```javascript
import { securityHeaders, corsOptions, additionalSecurityMiddleware } from "./middleware/securityHeaders.js"

// Apply security headers (must be early)
app.use(securityHeaders)
app.use(additionalSecurityMiddleware)
app.use(cors(corsOptions))
```

### Environment Variables

Required environment variables in `.env`:

```bash
# CORS Configuration
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=https://your-production-domain.com

# Node Environment
NODE_ENV=production
```

## Testing Security Headers

### Manual Testing

Use browser DevTools Network tab to inspect response headers:

1. Open DevTools (F12)
2. Navigate to Network tab
3. Make a request to the API
4. Check response headers

Expected headers:
- `Strict-Transport-Security`
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `X-DNS-Prefetch-Control`

### Automated Testing

Use security scanning tools:

```bash
# Using securityheaders.com
curl -I https://your-api-domain.com/api/health

# Using Mozilla Observatory
# Visit: https://observatory.mozilla.org/

# Using OWASP ZAP
# Run automated security scan
```

### Testing CORS

```bash
# Test allowed origin
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://localhost:5000/api/auth/login

# Test blocked origin
curl -H "Origin: http://malicious-site.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://localhost:5000/api/auth/login
```

## Security Best Practices

### 1. Keep Dependencies Updated

Regularly update helmet.js and other security dependencies:

```bash
npm update helmet
npm audit fix
```

### 2. Monitor Security Advisories

- Subscribe to Node.js security announcements
- Monitor helmet.js GitHub releases
- Use Snyk or similar tools for vulnerability scanning

### 3. Regular Security Audits

- Run `npm audit` regularly
- Perform penetration testing before major releases
- Review and update CSP directives as needed

### 4. Production Checklist

Before deploying to production:

- [ ] Verify HTTPS is enforced
- [ ] Update CORS_ORIGIN to production domain
- [ ] Remove development origins from allowedOrigins
- [ ] Test all security headers are present
- [ ] Verify CSP doesn't block legitimate resources
- [ ] Test CORS with production frontend
- [ ] Enable HSTS preloading (after testing)
- [ ] Set up security monitoring and alerts

## Troubleshooting

### CSP Violations

If legitimate resources are blocked by CSP:

1. Check browser console for CSP violation reports
2. Identify the blocked resource domain
3. Add domain to appropriate CSP directive
4. Test thoroughly before deploying

### CORS Errors

If CORS errors occur:

1. Verify origin is in allowedOrigins list
2. Check credentials flag matches frontend
3. Ensure preflight requests are handled
4. Verify allowed methods and headers

### HSTS Issues

If HSTS causes issues:

1. Ensure HTTPS is properly configured
2. Test with shorter maxAge first (e.g., 300 seconds)
3. Gradually increase maxAge after testing
4. Use browser HSTS clearing if needed (chrome://net-internals/#hsts)

## References

- [helmet.js Documentation](https://helmetjs.github.io/)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [CORS Specification](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

## Related Documentation

- [RATE_LIMITING.md](./RATE_LIMITING.md) - API rate limiting implementation
- [CSRF_PROTECTION.md](../middleware/CSRF_PROTECTION.md) - CSRF token implementation
- [ERROR_HANDLING.md](./ERROR_HANDLING.md) - Error handling and logging

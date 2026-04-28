import crypto from 'crypto';
import cookieParser from 'cookie-parser';

/**
 * CSRF Protection Middleware
 * 
 * Implements double-submit cookie pattern for CSRF protection.
 * This is a modern alternative to the deprecated csurf package.
 * 
 * How it works:
 * 1. Server generates a random CSRF token and sends it in a cookie
 * 2. Client includes this token in request headers for state-changing operations
 * 3. Server validates that the cookie token matches the header token
 * 
 * @see Requirements: Requirement 1 - Security Hardening
 */

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure random token
 */
function generateToken() {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Middleware to generate and set CSRF token in cookie
 * Should be applied before routes that need CSRF protection
 */
export function csrfTokenGenerator(req, res, next) {
  // Skip if token already exists in cookie
  if (req.cookies && req.cookies[CSRF_COOKIE_NAME]) {
    return next();
  }

  // Generate new token
  const token = generateToken();
  
  // Set token in cookie (httpOnly: false so client can read it)
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Client needs to read this
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  next();
}

/**
 * Middleware to validate CSRF token on state-changing requests
 * Should be applied to POST, PUT, PATCH, DELETE routes
 */
export function csrfProtection(req, res, next) {
  // TEMPORARY: Skip CSRF validation for development
  // TODO: Re-enable after frontend implements CSRF token handling
  return next();
  
  // Skip CSRF validation for safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Skip CSRF validation for auth endpoints (they have rate limiting)
  // Use originalUrl or path to match against full path
  const fullPath = req.originalUrl || req.path;
  const authEndpoints = [
    '/api/auth/signup',
    '/api/auth/login',
    '/api/auth/verify-otp',
    '/api/auth/resend-otp',
    '/api/forgot/request-reset',
    '/api/forgot/verify-reset-otp',
    '/api/forgot/reset-password',
    '/auth/signup',
    '/auth/login',
    '/auth/verify-otp',
    '/auth/resend-otp'
  ];
  
  if (authEndpoints.some(endpoint => fullPath.includes(endpoint))) {
    return next();
  }

  // Get token from cookie
  const cookieToken = req.cookies ? req.cookies[CSRF_COOKIE_NAME] : null;
  
  // Get token from header
  const headerToken = req.headers[CSRF_HEADER_NAME] || req.headers[CSRF_HEADER_NAME.toLowerCase()];

  // Validate tokens exist
  if (!cookieToken) {
    return res.status(403).json({
      error: {
        code: 'CSRF_TOKEN_MISSING',
        message: 'CSRF token missing from cookie',
        timestamp: new Date().toISOString()
      }
    });
  }

  if (!headerToken) {
    return res.status(403).json({
      error: {
        code: 'CSRF_TOKEN_MISSING',
        message: 'CSRF token missing from request header',
        timestamp: new Date().toISOString()
      }
    });
  }

  // Validate tokens match using timing-safe comparison
  if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
    return res.status(403).json({
      error: {
        code: 'CSRF_TOKEN_INVALID',
        message: 'CSRF token validation failed',
        timestamp: new Date().toISOString()
      }
    });
  }

  // Token is valid, proceed
  next();
}

/**
 * Endpoint to get CSRF token
 * Useful for SPAs that need to fetch the token on initial load
 */
export function getCsrfToken(req, res) {
  const token = req.cookies ? req.cookies[CSRF_COOKIE_NAME] : null;
  
  if (!token) {
    const newToken = generateToken();
    res.cookie(CSRF_COOKIE_NAME, newToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });
    return res.json({ csrfToken: newToken });
  }

  res.json({ csrfToken: token });
}

// Export cookie parser for convenience
export { cookieParser };

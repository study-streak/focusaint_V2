import helmet from "helmet"

/**
 * Security Headers Middleware
 * 
 * Implements comprehensive security headers using helmet.js
 * Addresses Requirement 1: Security Hardening
 * 
 * Features:
 * - HSTS (HTTP Strict Transport Security)
 * - Content Security Policy (CSP)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - And other security headers via helmet
 */

/**
 * Configure helmet with production-ready security settings
 */
export const securityHeaders = helmet({
  // 1.3.2: Configure HSTS headers
  // Enforce HTTPS for 1 year, include subdomains, allow preloading
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },

  // 1.3.3: Configure Content Security Policy
  // Restrict resource loading to prevent XSS attacks
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for some frontend frameworks
        "https://cdn.jsdelivr.net", // For CDN resources if needed
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Tailwind and inline styles
        "https://fonts.googleapis.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
      ],
      imgSrc: [
        "'self'",
        "data:", // For base64 images
        "https:", // Allow HTTPS images
      ],
      connectSrc: [
        "'self'",
        process.env.CORS_ORIGIN || "http://localhost:3000",
      ],
      frameSrc: [
        "'self'",
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
    },
  },

  // 1.3.4: Add X-Frame-Options header
  // Prevent clickjacking attacks by disallowing iframe embedding
  frameguard: {
    action: "deny", // Completely deny framing
  },

  // 1.3.5: Add X-Content-Type-Options header
  // Prevent MIME type sniffing
  noSniff: true,

  // Additional security headers provided by helmet
  
  // X-DNS-Prefetch-Control: Control DNS prefetching
  dnsPrefetchControl: {
    allow: false,
  },

  // X-Download-Options: Prevent IE from executing downloads in site context
  ieNoOpen: true,

  // X-Permitted-Cross-Domain-Policies: Restrict Adobe Flash/PDF cross-domain requests
  permittedCrossDomainPolicies: {
    permittedPolicies: "none",
  },

  // Referrer-Policy: Control referrer information
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },

  // X-XSS-Protection: Enable XSS filter (legacy browsers)
  xssFilter: true,
})

/**
 * CORS configuration with strict origin validation
 * 1.3.6: Configure CORS with strict origin validation
 */
export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true)
    }

    // List of allowed origins
    const allowedOrigins = [
      process.env.CORS_ORIGIN || "http://localhost:3000",
      process.env.FRONTEND_URL,
      "http://localhost:3000", // Development
      "http://localhost:3001", // Alternative dev port
      "https://www.focusaint.com",
      "http://www.focusaint.com",
      "https://focusaint.com",
      "http://focusaint.com",
    ].filter(Boolean) // Remove undefined values

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS policy`))
    }
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-CSRF-Token",
    "X-Requested-With",
  ],
  exposedHeaders: [
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
  ],
  maxAge: 86400, // Cache preflight requests for 24 hours
}

/**
 * Additional security middleware for production environments
 */
export const additionalSecurityMiddleware = (req, res, next) => {
  // Remove X-Powered-By header to hide Express
  res.removeHeader("X-Powered-By")

  // Add custom security headers
  res.setHeader("X-Content-Security-Policy", "default-src 'self'")
  res.setHeader("X-WebKit-CSP", "default-src 'self'")
  
  // Prevent caching of sensitive endpoints
  if (req.path.includes("/api/auth") || req.path.includes("/api/user")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private")
    res.setHeader("Pragma", "no-cache")
    res.setHeader("Expires", "0")
  }

  next()
}

/**
 * Environment-specific security configuration
 */
export const getSecurityConfig = () => {
  const isProduction = process.env.NODE_ENV === "production"
  
  return {
    // Only enforce HSTS in production with HTTPS
    enforceHSTS: isProduction,
    
    // Stricter CSP in production
    strictCSP: isProduction,
    
    // Log security violations in development
    logViolations: !isProduction,
  }
}

export default securityHeaders

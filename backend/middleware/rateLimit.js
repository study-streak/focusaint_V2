// Comprehensive rate limiting middleware with Redis store
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import dotenv from 'dotenv'
dotenv.config();
// Redis client configuration
let redisClient = null;
let redisStore = null;

// Initialize Redis client
async function initializeRedis() {
  // console.log(process.env.REDIS_URL)
  try {
    redisClient = createClient({
    username: process.env.REDIS_USERNAME ||'',
    password: process.env.REDIS_PASSWORD || '',
    url:process.env.REDIS_URL,
    socket: {
        
    },

      
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    await redisClient.connect();

    // Create Redis store for rate limiting
    redisStore = new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
    });

    return true;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    console.warn('Rate limiting will use memory store as fallback');
    return false;
  }
}

// Initialize Redis on module load
initializeRedis();

// Helper function to create rate limiter with consistent configuration
function createRateLimiter(options) {
  const defaultOptions = {
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    store: redisStore, // Use Redis store if available
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    handler: (req, res) => {
      const retryAfter = Math.ceil(options.windowMs / 1000);
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: options.message || 'Too many requests, please try again later.',
          details: {
            limit: options.max,
            windowMs: options.windowMs,
            retryAfter: retryAfter
          },
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
}

// Authentication endpoints - strict limits
export const authLoginLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 15 minutes
  // windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many login attempts. Please try again in 15 minutes.'
  // Remove custom keyGenerator to use default (which handles IPv6 correctly)
});

export const authSignupLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Increased for testing and high growth
  message: 'Too many signup attempts. Please try again in 1 hour.'
});

export const authPasswordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: 'Too many password reset requests. Please try again in 1 hour.'
});

export const authOTPLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 OTP requests per 15 minutes
  message: 'Too many OTP requests. Please try again in 15 minutes.'
});

// AI endpoints - token-aware limits
export const aiChatLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Increased for Deep Mode support
  message: 'AI request limit exceeded. Please try again later.',
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use default IP handling
    return req.user?.id;
  }
});

// Session endpoints - per-user limits
export const sessionCreateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 session creations per minute
  message: 'Too many session creation requests. Please slow down.',
  keyGenerator: (req) => {
    return req.user?.id;
  }
});

// File upload endpoints - strict limits
export const fileUploadLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per 15 minutes
  message: 'Too many file uploads. Please try again later.',
  keyGenerator: (req) => {
    return req.user?.id;
  }
});

// General API endpoints - moderate limits
export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests. Please try again later.',
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use default IP handling
    return req.user?.id;
  }
});

// Strict limiter for sensitive operations
export const strictLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Rate limit exceeded for this operation.',
  keyGenerator: (req) => {
    return req.user?.id;
  }
});

// Export Redis client for cleanup
export { redisClient };

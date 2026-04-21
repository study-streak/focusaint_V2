import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  TierRestrictionError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  SessionLimitError,
  TokenLimitError,
  ExternalServiceError,
  DatabaseError,
  BadRequestError,
  ServiceUnavailableError
} from "../utils/errors.js"
import { generateRequestId } from "../utils/errorResponses.js"
import { logError, createRequestLogger } from "../utils/logger.js"
import { captureException, setUserContext } from "../config/sentry.js"

/**
 * Global error handler middleware
 * Converts all errors to standardized format with request ID tracking
 * 
 * This middleware:
 * 1. Ensures every error has a request ID for tracking
 * 2. Logs errors with context for debugging
 * 3. Converts errors to consistent JSON format
 * 4. Handles both custom AppError instances and native errors
 * 5. Sanitizes error messages in production
 */
export const errorHandler = (err, req, res, next) => {
  // Ensure request has an ID
  const requestId = req.id || generateRequestId()
  
  // Initialize status code early so it is safe to use in all branches
  let statusCode = err.statusCode || 500
  
  // Determine if this is an operational error or programming error
  const isOperational = err.isOperational || err instanceof AppError
  
  // Create request logger with context
  const reqLogger = createRequestLogger(req)
  
  // Log error with full context
  logError(err, {
    requestId,
    path: req.path,
    method: req.method,
    userId: req.user?.userId,
    userEmail: req.user?.email,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    body: process.env.NODE_ENV === 'development' ? req.body : undefined,
    query: process.env.NODE_ENV === 'development' ? req.query : undefined,
    isOperational
  })

  // Send to Sentry for non-operational errors or in production
  if (process.env.SENTRY_DSN) {
    // Set user context if available
    if (req.user) {
      setUserContext({
        _id: req.user.userId,
        email: req.user.email,
        name: req.user.name
      })
    }
    
    // Capture exception with context
    captureException(err, {
      requestId,
      path: req.path,
      method: req.method,
      statusCode,
      isOperational,
      details: err.details
    })
  }

  // Build error response
  let errorResponse

  // Handle custom AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode
    errorResponse = {
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
        timestamp: new Date().toISOString(),
        requestId
      }
    }
  }
  // Handle Mongoose validation errors
  else if (err.name === "ValidationError") {
    const validationError = ValidationError.fromMongoose(err)
    statusCode = 400
    errorResponse = {
      error: {
        code: validationError.code,
        message: validationError.message,
        details: validationError.errors,
        timestamp: new Date().toISOString(),
        requestId
      }
    }
  }
  // Handle MongoDB cast errors (invalid ObjectId)
  else if (err.name === "CastError") {
    const badRequestError = BadRequestError.invalidId(err.path)
    statusCode = 400
    errorResponse = {
      error: {
        code: badRequestError.code,
        message: badRequestError.message,
        details: { field: err.path, value: err.value },
        timestamp: new Date().toISOString(),
        requestId
      }
    }
  }
  // Handle JWT errors
  else if (err.name === "JsonWebTokenError") {
    const authError = AuthenticationError.invalidToken()
    statusCode = 401
    errorResponse = {
      error: {
        code: authError.code,
        message: authError.message,
        timestamp: new Date().toISOString(),
        requestId
      }
    }
  }
  else if (err.name === "TokenExpiredError") {
    const authError = AuthenticationError.tokenExpired()
    statusCode = 401
    errorResponse = {
      error: {
        code: authError.code,
        message: authError.message,
        timestamp: new Date().toISOString(),
        requestId
      }
    }
  }
  // Handle MongoDB duplicate key errors
  else if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field"
    const conflictError = ConflictError.duplicate(field, err.keyValue?.[field])
    statusCode = 409
    errorResponse = {
      error: {
        code: conflictError.code,
        message: conflictError.message,
        details: conflictError.details,
        timestamp: new Date().toISOString(),
        requestId
      }
    }
  }
  // Handle generic errors
  else {
    statusCode = err.statusCode || 500
    
    // Sanitize error message in production
    const message = process.env.NODE_ENV === "development" 
      ? err.message 
      : statusCode >= 500 
        ? "An unexpected error occurred" 
        : err.message

    errorResponse = {
      error: {
        code: err.code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST'),
        message,
        ...(process.env.NODE_ENV === "development" && err.details && { details: err.details }),
        timestamp: new Date().toISOString(),
        requestId
      }
    }
  }

  // Add retry-after header for rate limit and service unavailable errors
  if (err instanceof RateLimitError || err instanceof ServiceUnavailableError) {
    if (err.retryAfter) {
      res.setHeader('Retry-After', err.retryAfter)
    }
  }

  // Send error response
  res.status(statusCode).json(errorResponse)
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 * 
 * Usage:
 * router.get('/endpoint', asyncHandler(async (req, res) => {
 *   // async code that might throw
 * }))
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * 404 Not Found handler
 * Should be placed after all routes
 */
export const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError('Endpoint', req.originalUrl)
  next(error)
}

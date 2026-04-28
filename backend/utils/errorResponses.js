/**
 * Standardized Error Response Utilities
 * 
 * Provides consistent error response formats across all API endpoints
 * Following the design specification from design.md
 */

/**
 * Generate a unique request ID
 * @returns {string} Unique request ID
 */
export function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Create a standardized error response object
 * @param {string} code - Error code (e.g., "VALIDATION_ERROR", "AUTHENTICATION_FAILED")
 * @param {string} message - Human-readable error message
 * @param {any} details - Additional error details (optional)
 * @param {string} requestId - Request ID for tracking (optional)
 * @returns {object} Standardized error response
 */
export function createErrorResponse(code, message, details = null, requestId = null) {
  return {
    error: {
      code,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
      requestId: requestId || generateRequestId()
    }
  }
}

/**
 * Validation error response
 * @param {Array} errors - Array of validation errors
 * @param {string} requestId - Request ID
 * @returns {object} Validation error response
 */
export function validationError(errors, requestId = null) {
  return createErrorResponse(
    "VALIDATION_ERROR",
    "Invalid input data",
    errors,
    requestId
  )
}

/**
 * Authentication error response
 * @param {string} message - Custom message (optional)
 * @param {string} requestId - Request ID
 * @returns {object} Authentication error response
 */
export function authenticationError(message = "Invalid or expired token", requestId = null) {
  return createErrorResponse(
    "AUTHENTICATION_FAILED",
    message,
    null,
    requestId
  )
}

/**
 * Authorization error response (tier restrictions, permissions)
 * @param {string} message - Custom message
 * @param {object} details - Additional details (e.g., required tier, current tier)
 * @param {string} requestId - Request ID
 * @returns {object} Authorization error response
 */
export function authorizationError(message, details = null, requestId = null) {
  return createErrorResponse(
    "AUTHORIZATION_FAILED",
    message,
    details,
    requestId
  )
}

/**
 * Resource not found error
 * @param {string} resource - Resource type (e.g., "User", "Task", "Session")
 * @param {string} requestId - Request ID
 * @returns {object} Not found error response
 */
export function notFoundError(resource = "Resource", requestId = null) {
  return createErrorResponse(
    "NOT_FOUND",
    `${resource} not found`,
    null,
    requestId
  )
}

/**
 * Rate limit exceeded error
 * @param {object} details - Rate limit details (limit, resetAt, etc.)
 * @param {string} requestId - Request ID
 * @returns {object} Rate limit error response
 */
export function rateLimitError(details, requestId = null) {
  return createErrorResponse(
    "RATE_LIMIT_EXCEEDED",
    "Too many requests. Please try again later.",
    details,
    requestId
  )
}

/**
 * Session limit reached error (free tier)
 * @param {object} details - Session limit details
 * @param {string} requestId - Request ID
 * @returns {object} Session limit error response
 */
export function sessionLimitError(details, requestId = null) {
  return createErrorResponse(
    "SESSION_LIMIT_REACHED",
    "You've reached your daily limit of 3 sessions. Upgrade to premium for unlimited sessions.",
    details,
    requestId
  )
}

/**
 * Token limit exceeded error (LLM tokens)
 * @param {object} details - Token usage details
 * @param {string} requestId - Request ID
 * @returns {object} Token limit error response
 */
export function tokenLimitError(details, requestId = null) {
  return createErrorResponse(
    "TOKEN_LIMIT_EXCEEDED",
    "Daily LLM token limit exceeded. Resets at midnight UTC.",
    details,
    requestId
  )
}

/**
 * Tier restriction error (feature requires premium)
 * @param {string} feature - Feature name
 * @param {string} requestId - Request ID
 * @returns {object} Tier restriction error response
 */
export function tierRestrictionError(feature, requestId = null) {
  return createErrorResponse(
    "TIER_RESTRICTION",
    `This feature requires a premium subscription.`,
    { feature, requiredTier: "premium" },
    requestId
  )
}

/**
 * Conflict error (duplicate resource, state conflict)
 * @param {string} message - Conflict description
 * @param {object} details - Conflict details
 * @param {string} requestId - Request ID
 * @returns {object} Conflict error response
 */
export function conflictError(message, details = null, requestId = null) {
  return createErrorResponse(
    "CONFLICT",
    message,
    details,
    requestId
  )
}

/**
 * Bad request error (generic client error)
 * @param {string} message - Error message
 * @param {object} details - Additional details
 * @param {string} requestId - Request ID
 * @returns {object} Bad request error response
 */
export function badRequestError(message, details = null, requestId = null) {
  return createErrorResponse(
    "BAD_REQUEST",
    message,
    details,
    requestId
  )
}

/**
 * Internal server error
 * @param {string} message - Error message (avoid exposing internal details)
 * @param {string} requestId - Request ID
 * @returns {object} Internal error response
 */
export function internalError(message = "An unexpected error occurred", requestId = null) {
  return createErrorResponse(
    "INTERNAL_ERROR",
    message,
    null,
    requestId
  )
}

/**
 * Service unavailable error (external service down, maintenance)
 * @param {string} service - Service name
 * @param {string} requestId - Request ID
 * @returns {object} Service unavailable error response
 */
export function serviceUnavailableError(service = "Service", requestId = null) {
  return createErrorResponse(
    "SERVICE_UNAVAILABLE",
    `${service} is temporarily unavailable. Please try again later.`,
    null,
    requestId
  )
}

/**
 * External service error (Stripe, Gemini API, etc.)
 * @param {string} service - Service name
 * @param {string} message - Error message
 * @param {string} requestId - Request ID
 * @returns {object} External service error response
 */
export function externalServiceError(service, message, requestId = null) {
  return createErrorResponse(
    "EXTERNAL_SERVICE_ERROR",
    `${service} error: ${message}`,
    { service },
    requestId
  )
}

/**
 * Middleware to attach request ID to all requests
 */
export function attachRequestId(req, res, next) {
  req.id = generateRequestId()
  res.setHeader("X-Request-ID", req.id)
  next()
}

/**
 * Express error handler middleware
 * Converts errors to standardized format
 */
export function errorHandlerMiddleware(err, req, res, next) {
  // Log error for debugging
  console.error("Error:", {
    requestId: req.id,
    error: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
    userId: req.user?.userId
  })

  // Determine status code
  let statusCode = err.statusCode || 500
  let errorResponse

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400
    errorResponse = validationError(
      Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      })),
      req.id
    )
  } else if (err.name === "CastError") {
    statusCode = 400
    errorResponse = badRequestError(
      "Invalid ID format",
      { field: err.path, value: err.value },
      req.id
    )
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401
    errorResponse = authenticationError("Invalid token", req.id)
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401
    errorResponse = authenticationError("Token expired", req.id)
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409
    const field = Object.keys(err.keyPattern)[0]
    errorResponse = conflictError(
      `${field} already exists`,
      { field },
      req.id
    )
  } else {
    // Generic error
    errorResponse = internalError(
      process.env.NODE_ENV === "development" 
        ? err.message 
        : "An unexpected error occurred",
      req.id
    )
  }

  res.status(statusCode).json(errorResponse)
}

/**
 * Success response helper
 * @param {object} data - Response data
 * @param {string} message - Success message (optional)
 * @returns {object} Success response
 */
export function successResponse(data, message = null) {
  return {
    success: true,
    ...(message && { message }),
    data,
    timestamp: new Date().toISOString()
  }
}

/**
 * Paginated response helper
 * @param {Array} items - Array of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {object} Paginated response
 */
export function paginatedResponse(items, page, limit, total) {
  return {
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    },
    timestamp: new Date().toISOString()
  }
}

export default {
  generateRequestId,
  createErrorResponse,
  validationError,
  authenticationError,
  authorizationError,
  notFoundError,
  rateLimitError,
  sessionLimitError,
  tokenLimitError,
  tierRestrictionError,
  conflictError,
  badRequestError,
  internalError,
  serviceUnavailableError,
  externalServiceError,
  attachRequestId,
  errorHandlerMiddleware,
  successResponse,
  paginatedResponse
}

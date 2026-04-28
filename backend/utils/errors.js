/**
 * Custom Error Classes for Centralized Error Handling
 * 
 * These classes extend the base Error class to provide structured error handling
 * across the application with consistent error codes, messages, and metadata.
 */

/**
 * Base Application Error
 * All custom errors extend this class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = true // Distinguishes operational errors from programming errors
    
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details
    }
  }
}

/**
 * Validation Error (400)
 * Used for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400, 'VALIDATION_ERROR', errors)
    this.errors = errors
  }

  static fromMongoose(mongooseError) {
    const errors = Object.values(mongooseError.errors).map(err => ({
      field: err.path,
      message: err.message,
      value: err.value,
      kind: err.kind
    }))
    return new ValidationError('Validation failed', errors)
  }

  static fromExpressValidator(validationResult) {
    const errors = validationResult.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
      location: err.location
    }))
    return new ValidationError('Validation failed', errors)
  }
}

/**
 * Authentication Error (401)
 * Used for authentication failures (invalid/missing credentials)
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', details = null) {
    super(message, 401, 'AUTHENTICATION_FAILED', details)
  }

  static invalidToken(message = 'Invalid or expired token') {
    return new AuthenticationError(message, { reason: 'invalid_token' })
  }

  static tokenExpired(message = 'Token has expired') {
    return new AuthenticationError(message, { reason: 'token_expired' })
  }

  static invalidCredentials(message = 'Invalid email or password') {
    return new AuthenticationError(message, { reason: 'invalid_credentials' })
  }

  static emailNotVerified(message = 'Email not verified') {
    return new AuthenticationError(message, { reason: 'email_not_verified' })
  }
}

/**
 * Authorization Error (403)
 * Used for permission/access control failures
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Access denied', details = null) {
    super(message, 403, 'AUTHORIZATION_FAILED', details)
  }

  static insufficientPermissions(resource = 'resource') {
    return new AuthorizationError(
      `You don't have permission to access this ${resource}`,
      { reason: 'insufficient_permissions', resource }
    )
  }
}

/**
 * Tier Restriction Error (403)
 * Used when a feature requires a higher subscription tier
 */
export class TierRestrictionError extends AppError {
  constructor(feature, currentTier = 'free', requiredTier = 'premium', message = null) {
    const defaultMessage = message || `This feature requires a ${requiredTier} subscription`
    super(
      defaultMessage,
      403,
      'TIER_RESTRICTION',
      {
        feature,
        currentTier,
        requiredTier,
        upgradeUrl: '/pricing'
      }
    )
    this.feature = feature
    this.currentTier = currentTier
    this.requiredTier = requiredTier
  }

  static cloudSync(currentTier = 'free') {
    return new TierRestrictionError(
      'cloud_sync',
      currentTier,
      'premium',
      'Cloud sync is only available for premium users. Upgrade to sync your data across devices.'
    )
  }

  static deepMode(currentTier = 'free') {
    return new TierRestrictionError(
      'deep_mode',
      currentTier,
      'premium',
      'Deep Mode is only available for premium users. Upgrade for unlimited focus sessions.'
    )
  }

  static unlimitedHistory(currentTier = 'free') {
    return new TierRestrictionError(
      'unlimited_history',
      currentTier,
      'premium',
      'Full history access is only available for premium users. Free users can access the last 30 days.'
    )
  }

  static dataExport(currentTier = 'free') {
    return new TierRestrictionError(
      'data_export',
      currentTier,
      'premium',
      'Data export is only available for premium users.'
    )
  }

  static customAIPersona(currentTier = 'free') {
    return new TierRestrictionError(
      'custom_ai_persona',
      currentTier,
      'premium',
      'Custom AI persona is only available for premium users.'
    )
  }

  static streakInsurance(currentTier = 'free') {
    return new TierRestrictionError(
      'streak_insurance',
      currentTier,
      'premium',
      'Streak insurance is only available for premium users.'
    )
  }

  static privateGroups(currentTier = 'free') {
    return new TierRestrictionError(
      'private_groups',
      currentTier,
      'premium',
      'Private accountability groups are only available for premium users.'
    )
  }
}

/**
 * Resource Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource', identifier = null) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`
    super(message, 404, 'NOT_FOUND', { resource, identifier })
    this.resource = resource
  }

  static user(userId) {
    return new NotFoundError('User', userId)
  }

  static session(sessionId) {
    return new NotFoundError('Session', sessionId)
  }

  static task(taskId) {
    return new NotFoundError('Task', taskId)
  }

  static group(groupId) {
    return new NotFoundError('Accountability Group', groupId)
  }
}

/**
 * Conflict Error (409)
 * Used for duplicate resources or state conflicts
 */
export class ConflictError extends AppError {
  constructor(message, details = null) {
    super(message, 409, 'CONFLICT', details)
  }

  static duplicate(field, value) {
    return new ConflictError(
      `${field} already exists`,
      { field, value, reason: 'duplicate' }
    )
  }

  static stateConflict(message, currentState, expectedState) {
    return new ConflictError(message, {
      reason: 'state_conflict',
      currentState,
      expectedState
    })
  }
}

/**
 * Rate Limit Error (429)
 */
export class RateLimitError extends AppError {
  constructor(limit, windowSeconds, resetAt) {
    super(
      'Too many requests. Please try again later.',
      429,
      'RATE_LIMIT_EXCEEDED',
      {
        limit,
        window: windowSeconds,
        resetAt: resetAt || new Date(Date.now() + windowSeconds * 1000).toISOString()
      }
    )
  }
}

/**
 * Session Limit Error (403)
 * Used when free users exceed daily session limits
 */
export class SessionLimitError extends AppError {
  constructor(currentCount, limit, resetAt) {
    super(
      `You've reached your daily limit of ${limit} sessions. Upgrade to premium for unlimited sessions.`,
      403,
      'SESSION_LIMIT_REACHED',
      {
        currentCount,
        limit,
        resetAt: resetAt || new Date(Date.now() + 86400000).toISOString() // 24 hours
      }
    )
  }
}

/**
 * Token Limit Error (403)
 * Used when users exceed LLM token limits
 */
export class TokenLimitError extends AppError {
  constructor(used, limit, resetAt) {
    super(
      'Daily LLM token limit exceeded. Resets at midnight UTC.',
      403,
      'TOKEN_LIMIT_EXCEEDED',
      {
        used,
        limit,
        resetAt: resetAt || new Date(Date.now() + 86400000).toISOString()
      }
    )
  }
}

/**
 * External Service Error (502)
 * Used when external services (Stripe, Gemini, etc.) fail
 */
export class ExternalServiceError extends AppError {
  constructor(service, message, originalError = null) {
    super(
      `${service} is temporarily unavailable`,
      502,
      'EXTERNAL_SERVICE_ERROR',
      {
        service,
        message,
        originalError: originalError?.message
      }
    )
    this.service = service
    this.originalError = originalError
  }


  static gemini(message, originalError) {
    return new ExternalServiceError('Gemini AI', message, originalError)
  }

  static email(message, originalError) {
    return new ExternalServiceError('Email Service', message, originalError)
  }
}

/**
 * Database Error (500)
 * Used for database operation failures
 */
export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', operation = null, originalError = null) {
    super(
      message,
      500,
      'DATABASE_ERROR',
      {
        operation,
        originalError: originalError?.message
      }
    )
    this.originalError = originalError
  }

  static connectionFailed(originalError) {
    return new DatabaseError(
      'Failed to connect to database',
      'connection',
      originalError
    )
  }

  static queryFailed(operation, originalError) {
    return new DatabaseError(
      'Database query failed',
      operation,
      originalError
    )
  }
}

/**
 * Bad Request Error (400)
 * Generic client error
 */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details = null) {
    super(message, 400, 'BAD_REQUEST', details)
  }

  static invalidId(field = 'id') {
    return new BadRequestError(
      `Invalid ${field} format`,
      { field, reason: 'invalid_format' }
    )
  }

  static missingField(field) {
    return new BadRequestError(
      `Missing required field: ${field}`,
      { field, reason: 'missing_field' }
    )
  }

  static invalidValue(field, value, expectedType) {
    return new BadRequestError(
      `Invalid value for ${field}`,
      { field, value, expectedType, reason: 'invalid_value' }
    )
  }
}

/**
 * Service Unavailable Error (503)
 */
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', retryAfter = null) {
    super(
      message,
      503,
      'SERVICE_UNAVAILABLE',
      retryAfter ? { retryAfter } : null
    )
    this.retryAfter = retryAfter
  }

  static maintenance(estimatedDuration = null) {
    return new ServiceUnavailableError(
      'Service is under maintenance. Please try again later.',
      estimatedDuration
    )
  }
}

// Export all error classes
export default {
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
}

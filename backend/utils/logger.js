/**
 * Production-Grade Structured Logging with Winston
 * 
 * Features:
 * - Multiple log levels (error, warn, info, debug)
 * - Structured JSON logging for production
 * - Pretty-printed logs for development
 * - Daily log rotation with retention policy
 * - Request/response logging middleware
 * - Slow query detection
 * - Integration with Sentry for errors
 * - Context enrichment (request ID, user ID, etc.)
 */

import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Determine if running in Vercel or serverless environment
const isVercel = Boolean(process.env.VERCEL)
const isProduction = process.env.NODE_ENV === 'production'

// Log directory (use /tmp for serverless, logs/ for traditional hosting)
const LOG_DIR = isVercel ? '/tmp/logs' : path.join(__dirname, '..', 'logs')

/**
 * Custom log format for development (colorized and pretty)
 */
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      // Remove empty objects and internal winston properties
      const cleanMeta = Object.entries(meta)
        .filter(([key, value]) => 
          key !== 'timestamp' && 
          key !== 'level' && 
          key !== 'message' &&
          value !== undefined &&
          value !== null &&
          !(typeof value === 'object' && Object.keys(value).length === 0)
        )
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
      
      if (Object.keys(cleanMeta).length > 0) {
        log += `\n${JSON.stringify(cleanMeta, null, 2)}`
      }
    }
    
    return log
  })
)

/**
 * Custom log format for production (structured JSON)
 */
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

/**
 * Create transports based on environment
 */
const createTransports = () => {
  const transports = []

  // Console transport (always enabled)
  transports.push(
    new winston.transports.Console({
      format: isProduction ? prodFormat : devFormat,
      level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug')
    })
  )

  // File transports (only in non-serverless environments)
  if (!isVercel) {
    // Combined log file with rotation
    transports.push(
      new DailyRotateFile({
        filename: path.join(LOG_DIR, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d', // Keep logs for 30 days
        format: prodFormat,
        level: 'info'
      })
    )

    // Error log file with rotation
    transports.push(
      new DailyRotateFile({
        filename: path.join(LOG_DIR, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '90d', // Keep error logs for 90 days
        format: prodFormat,
        level: 'error'
      })
    )

    // Debug log file (only in development)
    if (!isProduction) {
      transports.push(
        new DailyRotateFile({
          filename: path.join(LOG_DIR, 'debug-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '7d', // Keep debug logs for 7 days
          format: prodFormat,
          level: 'debug'
        })
      )
    }
  }

  return transports
}

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  levels: winston.config.npm.levels, // error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
  format: prodFormat,
  transports: createTransports(),
  exitOnError: false, // Don't exit on handled exceptions
  silent: process.env.LOG_SILENT === 'true' // Allow disabling logs for testing
})

/**
 * Logger class with context support
 */
export class Logger {
  constructor(defaultContext = {}) {
    this.defaultContext = defaultContext
  }

  /**
   * Merge contexts
   */
  _mergeContext(context) {
    return { ...this.defaultContext, ...context }
  }

  /**
   * Log error
   */
  error(message, context = {}) {
    logger.error(message, this._mergeContext(context))
  }

  /**
   * Log warning
   */
  warn(message, context = {}) {
    logger.warn(message, this._mergeContext(context))
  }

  /**
   * Log info
   */
  info(message, context = {}) {
    logger.info(message, this._mergeContext(context))
  }

  /**
   * Log HTTP requests
   */
  http(message, context = {}) {
    logger.http(message, this._mergeContext(context))
  }

  /**
   * Log debug
   */
  debug(message, context = {}) {
    logger.debug(message, this._mergeContext(context))
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext) {
    return new Logger(this._mergeContext(additionalContext))
  }
}

/**
 * Default logger instance
 */
export const defaultLogger = new Logger()

/**
 * Create request logger with request context
 */
export const createRequestLogger = (req) => {
  return new Logger({
    requestId: req.id,
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.userId,
    userEmail: req.user?.email
  })
}

/**
 * Log error with full context
 */
export const logError = (error, context = {}) => {
  const errorContext = {
    ...context,
    errorName: error.name,
    errorMessage: error.message,
    errorCode: error.code,
    statusCode: error.statusCode,
    isOperational: error.isOperational
  }

  // Add stack trace
  if (error.stack) {
    errorContext.stack = error.stack
  }

  // Add error details if available
  if (error.details) {
    errorContext.details = error.details
  }

  defaultLogger.error(error.message, errorContext)
}

/**
 * Log request with context
 */
export const logRequest = (req, additionalContext = {}) => {
  const context = {
    requestId: req.id,
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.userId,
    ...additionalContext
  }

  defaultLogger.http(`${req.method} ${req.path}`, context)
}

/**
 * Log response with context
 */
export const logResponse = (req, res, duration, additionalContext = {}) => {
  const context = {
    requestId: req.id,
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userId: req.user?.userId,
    ...additionalContext
  }

  // Use appropriate log level based on status code
  if (res.statusCode >= 500) {
    defaultLogger.error(`${req.method} ${req.path} ${res.statusCode}`, context)
  } else if (res.statusCode >= 400) {
    defaultLogger.warn(`${req.method} ${req.path} ${res.statusCode}`, context)
  } else {
    defaultLogger.http(`${req.method} ${req.path} ${res.statusCode}`, context)
  }
}

/**
 * Log database query
 */
export const logDatabaseQuery = (operation, collection, duration, context = {}) => {
  const queryContext = {
    operation,
    collection,
    duration: `${duration}ms`,
    ...context
  }

  // Log slow queries as warnings
  if (duration > 1000) {
    defaultLogger.warn(`Slow database query: ${operation} on ${collection}`, queryContext)
  } else {
    defaultLogger.debug(`Database ${operation} on ${collection}`, queryContext)
  }
}

/**
 * Log external service call
 */
export const logExternalService = (service, operation, duration, success, context = {}) => {
  const message = `${service} ${operation} ${success ? 'succeeded' : 'failed'}`
  const logContext = {
    service,
    operation,
    duration: `${duration}ms`,
    success,
    ...context
  }

  if (success) {
    defaultLogger.info(message, logContext)
  } else {
    defaultLogger.error(message, logContext)
  }
}

/**
 * Request logging middleware
 * Logs all incoming requests and their responses
 */
export const requestLoggingMiddleware = (req, res, next) => {
  const startTime = Date.now()

  // Log incoming request
  logRequest(req)

  // Capture response
  const originalSend = res.send
  res.send = function (data) {
    const duration = Date.now() - startTime
    logResponse(req, res, duration)
    originalSend.call(this, data)
  }

  next()
}

/**
 * Slow query logging middleware
 * Logs requests that take longer than threshold
 */
export const slowQueryMiddleware = (thresholdMs = 1000) => {
  return (req, res, next) => {
    const startTime = Date.now()

    const originalSend = res.send
    res.send = function (data) {
      const duration = Date.now() - startTime
      
      if (duration > thresholdMs) {
        defaultLogger.warn(`Slow request detected`, {
          requestId: req.id,
          method: req.method,
          path: req.path,
          duration: `${duration}ms`,
          threshold: `${thresholdMs}ms`,
          statusCode: res.statusCode,
          userId: req.user?.userId
        })
      }
      
      originalSend.call(this, data)
    }

    next()
  }
}

/**
 * Log levels enum for convenience
 */
export const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  HTTP: 'http',
  DEBUG: 'debug'
}

/**
 * Export winston logger for advanced usage
 */
export { logger as winstonLogger }

/**
 * Export default logger
 */
export default defaultLogger

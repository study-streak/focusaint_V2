import * as Sentry from '@sentry/node';

// Track whether Sentry is initialized
let isSentryInitialized = false;

/**
 * Initialize Sentry for error tracking and performance monitoring
 * @param {Express.Application} app - Express application instance
 */
export function initSentry(app) {
  const sentryDsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  
  // Only initialize Sentry if DSN is provided
  if (!sentryDsn) {
    console.log('⚠ Sentry DSN not configured - error tracking disabled');
    isSentryInitialized = false;
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment,
    
    // Set sample rate based on environment
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Set profiles sample rate
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Integrations
    integrations: [
      // Enable HTTP calls tracing
      Sentry.httpIntegration({ tracing: true }),
      
      // Enable Express.js middleware tracing
      // Enable Express.js middleware tracing
      Sentry.expressIntegration({ app }),
    ],
    
    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      
      // Remove sensitive body data
      if (event.request?.data) {
        const data = event.request.data;
        if (typeof data === 'object') {
          delete data.password;
          delete data.token;
          delete data.otp;
        }
      }
      
      return event;
    },
    
    // Ignore certain errors
    ignoreErrors: [
      // Browser errors that shouldn't reach backend
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      // Network errors
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
    ],
  });

  isSentryInitialized = true;
  console.log(`✓ Sentry initialized for ${environment} environment`);
}

/**
 * Get Sentry request handler middleware
 * Must be used before any other middleware
 */
export function sentryRequestHandler() {
  if (!isSentryInitialized || !Sentry.Handlers) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.requestHandler();
}

/**
 * Get Sentry tracing handler middleware
 * Must be used before any other middleware
 */
export function sentryTracingHandler() {
  if (!isSentryInitialized || !Sentry.Handlers) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.tracingHandler();
}

/**
 * Get Sentry error handler middleware
 * Must be used after all controllers and before other error handlers
 */
export function sentryErrorHandler() {
  if (!isSentryInitialized || !Sentry.Handlers) {
    return (err, req, res, next) => next(err);
  }
  return Sentry.Handlers.errorHandler();
}

/**
 * Capture an exception manually
 * @param {Error} error - Error to capture
 * @param {Object} context - Additional context
 */
export function captureException(error, context = {}) {
  if (!isSentryInitialized) return;
  
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message manually
 * @param {string} message - Message to capture
 * @param {string} level - Severity level (fatal, error, warning, info, debug)
 */
export function captureMessage(message, level = 'info') {
  if (!isSentryInitialized) return;
  
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for Sentry events
 * @param {Object} user - User object
 */
export function setUserContext(user) {
  if (!isSentryInitialized) return;
  
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  
  Sentry.setUser({
    id: user._id?.toString() || user.id,
    email: user.email,
    username: user.name,
  });
}

/**
 * Add breadcrumb for debugging
 * @param {Object} breadcrumb - Breadcrumb data
 */
export function addBreadcrumb(breadcrumb) {
  if (!isSentryInitialized) return;
  
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Start a new transaction for performance monitoring
 * @param {string} name - Transaction name
 * @param {string} op - Operation type
 * @returns {Transaction} Sentry transaction
 */
export function startTransaction(name, op = 'http.server') {
  if (!isSentryInitialized) return null;
  
  return Sentry.startTransaction({
    name,
    op,
  });
}

export default Sentry;

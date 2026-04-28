import * as Sentry from '@sentry/nextjs';

/**
 * Capture an exception manually
 * @param error - Error to capture
 * @param context - Additional context
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message manually
 * @param message - Message to capture
 * @param level - Severity level
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
) {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for Sentry events
 * @param user - User object
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
} | null) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Add breadcrumb for debugging
 * @param breadcrumb - Breadcrumb data
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  data?: Record<string, any>;
}) {
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Start a new span for performance monitoring
 * @param name - Span name
 * @param op - Operation type
 */
export function startSpan(name: string, op = 'pageload') {
  return Sentry.startSpan({
    name,
    op,
  }, (span) => span);
}

/**
 * Set custom context for Sentry events
 * @param key - Context key
 * @param value - Context value
 */
export function setContext(key: string, value: Record<string, any>) {
  Sentry.setContext(key, value);
}

/**
 * Set a tag for filtering events
 * @param key - Tag key
 * @param value - Tag value
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * Clear user context
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

export default Sentry;
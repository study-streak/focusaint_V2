import { captureMessage, addBreadcrumb } from '../config/sentry.js';
import logger from '../utils/logger.js';

/**
 * Metrics Service
 * Tracks custom business and technical metrics for monitoring and analytics
 */

// In-memory metrics store (for development)
// In production, this should be replaced with a proper metrics backend (e.g., Prometheus, DataDog)
const metricsStore = {
  counters: new Map(),
  gauges: new Map(),
  histograms: new Map(),
};

/**
 * Increment a counter metric
 * @param {string} name - Metric name
 * @param {number} value - Value to increment by (default: 1)
 * @param {Object} tags - Additional tags for the metric
 */
export function incrementCounter(name, value = 1, tags = {}) {
  const key = `${name}:${JSON.stringify(tags)}`;
  const current = metricsStore.counters.get(key) || 0;
  metricsStore.counters.set(key, current + value);
  
  logger.debug('Metric counter incremented', { name, value, tags });
  
  // Add breadcrumb for Sentry
  addBreadcrumb({
    category: 'metric',
    message: `Counter: ${name}`,
    level: 'info',
    data: { value, tags }
  });
}

/**
 * Set a gauge metric (current value)
 * @param {string} name - Metric name
 * @param {number} value - Current value
 * @param {Object} tags - Additional tags for the metric
 */
export function setGauge(name, value, tags = {}) {
  const key = `${name}:${JSON.stringify(tags)}`;
  metricsStore.gauges.set(key, value);
  
  logger.debug('Metric gauge set', { name, value, tags });
}

/**
 * Record a histogram value (for timing/distribution metrics)
 * @param {string} name - Metric name
 * @param {number} value - Value to record
 * @param {Object} tags - Additional tags for the metric
 */
export function recordHistogram(name, value, tags = {}) {
  const key = `${name}:${JSON.stringify(tags)}`;
  const values = metricsStore.histograms.get(key) || [];
  values.push(value);
  metricsStore.histograms.set(key, values);
  
  logger.debug('Metric histogram recorded', { name, value, tags });
}

/**
 * Track user signup
 */
export function trackUserSignup(tier = 'free') {
  incrementCounter('user.signup', 1, { tier });
  captureMessage(`New user signup: ${tier}`, 'info');
}

/**
 * Track user login
 */
export function trackUserLogin(userId) {
  incrementCounter('user.login', 1);
  addBreadcrumb({
    category: 'auth',
    message: 'User login',
    level: 'info',
    data: { userId }
  });
}

/**
 * Track session creation
 */
export function trackSessionCreated(type, userId, tier) {
  incrementCounter('session.created', 1, { type, tier });
  logger.info('Session created', { type, userId, tier });
}

/**
 * Track session completion
 */
export function trackSessionCompleted(type, duration, userId, tier) {
  incrementCounter('session.completed', 1, { type, tier });
  recordHistogram('session.duration', duration, { type, tier });
  logger.info('Session completed', { type, duration, userId, tier });
}

/**
 * Track subscription events
 */
export function trackSubscriptionCreated(plan, userId) {
  incrementCounter('subscription.created', 1, { plan });
  captureMessage(`New subscription: ${plan}`, 'info');
  logger.info('Subscription created', { plan, userId });
}

export function trackSubscriptionCanceled(plan, userId) {
  incrementCounter('subscription.canceled', 1, { plan });
  logger.info('Subscription canceled', { plan, userId });
}

export function trackSubscriptionReactivated(plan, userId) {
  incrementCounter('subscription.reactivated', 1, { plan });
  logger.info('Subscription reactivated', { plan, userId });
}

/**
 * Track payment events
 */
export function trackPaymentSucceeded(amount, plan) {
  incrementCounter('payment.succeeded', 1, { plan });
  recordHistogram('payment.amount', amount, { plan });
  logger.info('Payment succeeded', { amount, plan });
}

export function trackPaymentFailed(plan, reason) {
  incrementCounter('payment.failed', 1, { plan, reason });
  captureMessage(`Payment failed: ${plan} - ${reason}`, 'warning');
  logger.warn('Payment failed', { plan, reason });
}

/**
 * Track AI token usage
 */
export function trackAITokenUsage(tokens, feature, userId, tier) {
  incrementCounter('ai.tokens.used', tokens, { feature, tier });
  recordHistogram('ai.tokens.per_request', tokens, { feature, tier });
  logger.debug('AI tokens used', { tokens, feature, userId, tier });
}

/**
 * Track Focus Score updates
 */
export function trackFocusScoreUpdate(userId, score, previousScore) {
  setGauge('focus_score.current', score, { userId });
  const change = score - (previousScore || 0);
  recordHistogram('focus_score.change', change);
  logger.info('Focus Score updated', { userId, score, change });
}

/**
 * Track API endpoint performance
 */
export function trackAPIPerformance(endpoint, method, duration, statusCode) {
  recordHistogram('api.response_time', duration, { endpoint, method, statusCode });
  incrementCounter('api.requests', 1, { endpoint, method, statusCode });
  
  // Alert on slow requests
  if (duration > 1000) {
    logger.warn('Slow API request detected', { endpoint, method, duration, statusCode });
  }
}

/**
 * Track database query performance
 */
export function trackDatabaseQuery(operation, collection, duration) {
  recordHistogram('db.query_time', duration, { operation, collection });
  
  // Alert on slow queries
  if (duration > 1000) {
    logger.warn('Slow database query detected', { operation, collection, duration });
  }
}

/**
 * Track error rates
 */
export function trackError(type, endpoint, statusCode) {
  incrementCounter('errors.total', 1, { type, endpoint, statusCode });
  logger.error('Error tracked', { type, endpoint, statusCode });
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(feature, userId, tier) {
  incrementCounter('feature.usage', 1, { feature, tier });
  logger.info('Feature used', { feature, userId, tier });
}

/**
 * Track conversion events
 */
export function trackConversion(fromTier, toTier, userId) {
  incrementCounter('conversion.tier_upgrade', 1, { fromTier, toTier });
  captureMessage(`User upgraded: ${fromTier} → ${toTier}`, 'info');
  logger.info('User tier conversion', { fromTier, toTier, userId });
}

/**
 * Get current metrics snapshot
 * @returns {Object} Current metrics
 */
export function getMetricsSnapshot() {
  return {
    counters: Object.fromEntries(metricsStore.counters),
    gauges: Object.fromEntries(metricsStore.gauges),
    histograms: Object.fromEntries(
      Array.from(metricsStore.histograms.entries()).map(([key, values]) => [
        key,
        {
          count: values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          p50: percentile(values, 50),
          p95: percentile(values, 95),
          p99: percentile(values, 99),
        }
      ])
    ),
    timestamp: new Date().toISOString()
  };
}

/**
 * Calculate percentile from array of values
 */
function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Reset metrics (useful for testing)
 */
export function resetMetrics() {
  metricsStore.counters.clear();
  metricsStore.gauges.clear();
  metricsStore.histograms.clear();
  logger.info('Metrics reset');
}

/**
 * Middleware to track API performance
 */
export function metricsMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Track when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const endpoint = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode;
    
    trackAPIPerformance(endpoint, method, duration, statusCode);
    
    // Track errors
    if (statusCode >= 400) {
      const errorType = statusCode >= 500 ? 'server_error' : 'client_error';
      trackError(errorType, endpoint, statusCode);
    }
  });
  
  next();
}

export default {
  incrementCounter,
  setGauge,
  recordHistogram,
  trackUserSignup,
  trackUserLogin,
  trackSessionCreated,
  trackSessionCompleted,
  trackSubscriptionCreated,
  trackSubscriptionCanceled,
  trackSubscriptionReactivated,
  trackPaymentSucceeded,
  trackPaymentFailed,
  trackAITokenUsage,
  trackFocusScoreUpdate,
  trackAPIPerformance,
  trackDatabaseQuery,
  trackError,
  trackFeatureUsage,
  trackConversion,
  getMetricsSnapshot,
  resetMetrics,
  metricsMiddleware,
};

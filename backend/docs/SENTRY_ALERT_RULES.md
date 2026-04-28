# Sentry Alert Rules Configuration Guide

This guide provides step-by-step instructions for setting up error alerting rules in the Sentry dashboard for the focusaint application.

## Prerequisites

- Sentry account with admin access
- Project created in Sentry
- Integration with notification channels (email, Slack, etc.)

## Alert Rule Categories

### 1. High Error Rate Alert

**Purpose:** Detect sudden spikes in error rates that may indicate a production incident.

**Configuration Steps:**

1. Navigate to **Alerts** → **Create Alert Rule**
2. Select **Issues** as the alert type
3. Configure the following:
   - **Name:** High Error Rate - Production
   - **Environment:** production
   - **When:** An event is captured
   - **If:** The issue is seen more than **10 times** in **1 minute**
   - **Then:** Send a notification to **#incidents** (Slack) and **on-call@focusaint.com** (Email)
   - **Action Interval:** Every **5 minutes**

**Filters:**
- Environment: `production`
- Level: `error` or `fatal`

**Notification Channels:**
- Email: on-call team
- Slack: #incidents channel
- PagerDuty: Critical incidents

---

### 2. Performance Degradation Alert

**Purpose:** Monitor API response times and alert when performance degrades.

**Configuration Steps:**

1. Navigate to **Alerts** → **Create Alert Rule**
2. Select **Metric** as the alert type
3. Configure the following:
   - **Name:** API Performance Degradation
   - **Environment:** production
   - **Metric:** `transaction.duration`
   - **When:** The p95 of `transaction.duration` is **above 1000ms**
   - **Over:** The last **5 minutes**
   - **Then:** Send a notification to **#performance** (Slack)
   - **Action Interval:** Every **10 minutes**

**Filters:**
- Environment: `production`
- Transaction: `http.server`

**Notification Channels:**
- Slack: #performance channel
- Email: engineering team

---

### 3. Authentication Failure Alert

**Purpose:** Detect potential security issues or authentication system failures.

**Configuration Steps:**

1. Navigate to **Alerts** → **Create Alert Rule**
2. Select **Issues** as the alert type
3. Configure the following:
   - **Name:** Authentication Failures
   - **Environment:** production
   - **When:** An event is captured
   - **If:** The issue matches the filter `error.type:AuthenticationError` and is seen more than **20 times** in **5 minutes**
   - **Then:** Send a notification to **#security** (Slack) and **security@focusaint.com** (Email)
   - **Action Interval:** Every **5 minutes**

**Filters:**
- Environment: `production`
- Error Type: `AuthenticationError`
- Level: `error`

**Notification Channels:**
- Email: security team
- Slack: #security channel

---

### 4. Payment Processing Alert

**Purpose:** Immediately alert on payment-related errors to prevent revenue loss.

**Configuration Steps:**

1. Navigate to **Alerts** → **Create Alert Rule**
2. Select **Issues** as the alert type
3. Configure the following:
   - **Name:** Payment Processing Errors
   - **Environment:** production
   - **When:** An event is captured
   - **If:** The issue has tag `feature:payment` and is seen more than **1 time** in **1 minute**
   - **Then:** Send a notification to **#payments** (Slack) and **finance@focusaint.com** (Email)
   - **Action Interval:** Every **1 minute**

**Filters:**
- Environment: `production`
- Tag: `feature:payment`
- Level: `error` or `fatal`

**Notification Channels:**
- Email: finance team
- Slack: #payments channel
- PagerDuty: High priority

---

### 5. Database Connection Alert

**Purpose:** Alert when database connection issues occur.

**Configuration Steps:**

1. Navigate to **Alerts** → **Create Alert Rule**
2. Select **Issues** as the alert type
3. Configure the following:
   - **Name:** Database Connection Errors
   - **Environment:** production
   - **When:** An event is captured
   - **If:** The issue matches the filter `error.type:DatabaseError` and is seen more than **5 times** in **2 minutes**
   - **Then:** Send a notification to **#infrastructure** (Slack) and **ops@focusaint.com** (Email)
   - **Action Interval:** Every **5 minutes**

**Filters:**
- Environment: `production`
- Error Type: `DatabaseError`
- Level: `error` or `fatal`

**Notification Channels:**
- Email: operations team
- Slack: #infrastructure channel
- PagerDuty: Critical incidents

---

### 6. Rate Limit Exceeded Alert

**Purpose:** Monitor rate limiting to detect potential abuse or misconfiguration.

**Configuration Steps:**

1. Navigate to **Alerts** → **Create Alert Rule**
2. Select **Issues** as the alert type
3. Configure the following:
   - **Name:** Rate Limit Exceeded
   - **Environment:** production
   - **When:** An event is captured
   - **If:** The issue matches the filter `error.type:RateLimitError` and is seen more than **50 times** in **5 minutes**
   - **Then:** Send a notification to **#security** (Slack)
   - **Action Interval:** Every **10 minutes**

**Filters:**
- Environment: `production`
- Error Type: `RateLimitError`
- Level: `warning` or `error`

**Notification Channels:**
- Slack: #security channel
- Email: security team (optional)

---

### 7. Unhandled Promise Rejection Alert

**Purpose:** Catch unhandled promise rejections that may indicate bugs.

**Configuration Steps:**

1. Navigate to **Alerts** → **Create Alert Rule**
2. Select **Issues** as the alert type
3. Configure the following:
   - **Name:** Unhandled Promise Rejections
   - **Environment:** production
   - **When:** An event is captured
   - **If:** The issue matches the filter `error.type:UnhandledRejection` and is seen more than **5 times** in **5 minutes**
   - **Then:** Send a notification to **#engineering** (Slack)
   - **Action Interval:** Every **10 minutes**

**Filters:**
- Environment: `production`
- Error Type: `UnhandledRejection`
- Level: `error`

**Notification Channels:**
- Slack: #engineering channel

---

### 8. New Issue Alert

**Purpose:** Get notified when a new type of error appears in production.

**Configuration Steps:**

1. Navigate to **Alerts** → **Create Alert Rule**
2. Select **Issues** as the alert type
3. Configure the following:
   - **Name:** New Production Issues
   - **Environment:** production
   - **When:** An issue is first seen
   - **Then:** Send a notification to **#engineering** (Slack)
   - **Action Interval:** Every **1 minute**

**Filters:**
- Environment: `production`
- Issue State: `new`

**Notification Channels:**
- Slack: #engineering channel

---

## Notification Channel Setup

### Email Configuration

1. Navigate to **Settings** → **Integrations** → **Email**
2. Add email addresses:
   - `on-call@focusaint.com` - On-call team
   - `security@focusaint.com` - Security team
   - `finance@focusaint.com` - Finance team
   - `ops@focusaint.com` - Operations team
3. Configure email templates for better readability

### Slack Configuration

1. Navigate to **Settings** → **Integrations** → **Slack**
2. Click **Add Workspace**
3. Authorize Sentry to access your Slack workspace
4. Configure channels:
   - `#incidents` - Critical production issues
   - `#performance` - Performance degradation
   - `#security` - Security-related alerts
   - `#payments` - Payment processing errors
   - `#infrastructure` - Infrastructure issues
   - `#engineering` - General engineering alerts
5. Test each channel integration

### PagerDuty Configuration (Optional)

1. Navigate to **Settings** → **Integrations** → **PagerDuty**
2. Click **Add Integration**
3. Enter your PagerDuty API key
4. Map Sentry alerts to PagerDuty services:
   - Critical: Payment errors, database failures
   - High: Authentication failures, high error rates
   - Medium: Performance degradation

---

## Alert Rule Best Practices

### 1. Avoid Alert Fatigue

- Set appropriate thresholds to avoid too many alerts
- Use action intervals to prevent duplicate notifications
- Group similar errors together
- Mute non-actionable alerts

### 2. Prioritize Alerts

- **Critical:** Payment errors, database failures, authentication issues
- **High:** High error rates, performance degradation
- **Medium:** New issues, rate limit exceeded
- **Low:** Individual errors, warnings

### 3. Test Alert Rules

Before enabling in production:

1. Create a test project in Sentry
2. Configure alert rules with lower thresholds
3. Trigger test errors to verify notifications
4. Adjust thresholds based on test results

### 4. Review and Adjust

- Review alert effectiveness weekly
- Adjust thresholds based on false positive rate
- Add new rules as new features are deployed
- Remove or modify rules that are too noisy

---

## Alert Response Procedures

### High Error Rate Alert

1. Check Sentry dashboard for error details
2. Identify affected endpoints or features
3. Check server logs and metrics
4. Determine if rollback is needed
5. Communicate status to team
6. Implement fix and deploy
7. Monitor error rate after deployment

### Performance Degradation Alert

1. Check performance monitoring dashboard
2. Identify slow endpoints or queries
3. Review recent deployments
4. Check database query performance
5. Scale resources if needed
6. Optimize slow queries or code
7. Monitor performance after changes

### Payment Processing Alert

1. **IMMEDIATE ACTION REQUIRED**
2. Check Stripe dashboard for payment status
3. Verify payment webhook processing
4. Check database for payment records
5. Contact affected customers if needed
6. Escalate to finance team
7. Implement fix and verify payments resume

---

## Monitoring Alert Effectiveness

### Metrics to Track

1. **Alert Volume:** Number of alerts per day/week
2. **False Positive Rate:** Percentage of alerts that don't require action
3. **Response Time:** Time from alert to acknowledgment
4. **Resolution Time:** Time from alert to issue resolution
5. **Alert Coverage:** Percentage of production issues caught by alerts

### Monthly Review Checklist

- [ ] Review alert volume trends
- [ ] Identify and mute noisy alerts
- [ ] Add alerts for new features
- [ ] Update thresholds based on traffic growth
- [ ] Review notification channel effectiveness
- [ ] Update on-call rotation
- [ ] Document new alert response procedures

---

## Additional Resources

- [Sentry Alerts Documentation](https://docs.sentry.io/product/alerts/)
- [Sentry Integrations](https://docs.sentry.io/product/integrations/)
- [Alert Best Practices](https://docs.sentry.io/product/alerts/best-practices/)
- [Notification Settings](https://docs.sentry.io/product/alerts/notifications/)

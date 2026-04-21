# Uptime Monitoring Setup Guide

This guide explains how to set up uptime monitoring for focusaint to achieve the 99.5% uptime target.

## Uptime Target

**Target:** 99.5% uptime
- **Allowed downtime per month:** ~3.6 hours
- **Allowed downtime per year:** ~43.8 hours

## Health Check Endpoints

The application provides several health check endpoints for monitoring:

### 1. Basic Health Check
```
GET /api/health
```

Returns:
- Status: healthy/unhealthy
- Timestamp
- Database connection status
- Uptime

**Use for:** Basic uptime monitoring

### 2. Detailed Health Check
```
GET /api/health/detailed
```

Returns:
- All basic health info
- System metrics (CPU, memory)
- Process metrics
- Environment info

**Use for:** Detailed diagnostics and debugging

### 3. Readiness Probe
```
GET /api/health/ready
```

Returns: `{ ready: true/false }`

**Use for:** Kubernetes/container readiness checks

### 4. Liveness Probe
```
GET /api/health/live
```

Returns: `{ alive: true }`

**Use for:** Kubernetes/container liveness checks

### 5. Metrics Endpoint
```
GET /api/health/metrics
```

Returns: Application metrics snapshot

**Use for:** Performance monitoring and analytics

## Recommended Monitoring Services

### Option 1: UptimeRobot (Free Tier Available)

**Setup:**
1. Sign up at https://uptimerobot.com
2. Create a new monitor:
   - Monitor Type: HTTP(s)
   - URL: `https://yourdomain.com/api/health`
   - Monitoring Interval: 5 minutes
   - Alert Contacts: Your email/SMS
3. Set up alert rules:
   - Alert when down
   - Alert when response time > 2000ms

**Pros:**
- Free tier includes 50 monitors
- 5-minute check intervals
- Email/SMS alerts
- Status page generation

**Cons:**
- Limited to 5-minute intervals on free tier

### Option 2: Pingdom (Paid)

**Setup:**
1. Sign up at https://www.pingdom.com
2. Create uptime check:
   - URL: `https://yourdomain.com/api/health`
   - Check interval: 1 minute
   - Locations: Multiple global locations
3. Configure alerts:
   - Email notifications
   - SMS notifications (optional)
   - Webhook integrations

**Pros:**
- 1-minute check intervals
- Multiple check locations
- Detailed performance reports
- Root cause analysis

**Cons:**
- Paid service (starts at $10/month)

### Option 3: Better Uptime (Modern Alternative)

**Setup:**
1. Sign up at https://betteruptime.com
2. Create monitor:
   - URL: `https://yourdomain.com/api/health`
   - Check interval: 30 seconds
   - Regions: Multiple
3. Set up incident management:
   - On-call schedules
   - Escalation policies
   - Status page

**Pros:**
- Modern UI/UX
- Incident management features
- Status page included
- Generous free tier

**Cons:**
- Newer service (less established)

### Option 4: Datadog (Enterprise)

**Setup:**
1. Sign up at https://www.datadoghq.com
2. Install Datadog agent on server
3. Configure synthetic monitoring:
   - HTTP check on `/api/health`
   - Check interval: 1 minute
   - Multiple locations
4. Set up monitors and alerts

**Pros:**
- Comprehensive monitoring platform
- APM, logs, metrics in one place
- Advanced alerting and dashboards
- Great for large-scale applications

**Cons:**
- Expensive (starts at $15/host/month)
- Overkill for small applications

## Recommended Setup for focusaint

### Development/Staging
- **Service:** UptimeRobot (Free)
- **Interval:** 5 minutes
- **Endpoint:** `/api/health`
- **Alerts:** Email only

### Production
- **Service:** Better Uptime or Pingdom
- **Interval:** 1-2 minutes
- **Endpoints to monitor:**
  - `/api/health` (primary)
  - `/api/health/ready` (secondary)
- **Alerts:**
  - Email (immediate)
  - SMS (after 5 minutes down)
  - Slack/Discord webhook (optional)

## Alert Configuration

### Critical Alerts (Immediate)
- Service is down (HTTP 5xx or no response)
- Database connection failed
- Response time > 5000ms

### Warning Alerts (5-minute delay)
- Response time > 2000ms consistently
- Memory usage > 85%
- CPU usage > 80%

### Info Alerts (Daily digest)
- Average response time trends
- Uptime percentage
- Error rate summary

## Monitoring Best Practices

### 1. Multiple Check Locations
Monitor from at least 3 different geographic locations to avoid false positives from regional issues.

### 2. Appropriate Check Intervals
- **Production:** 1-2 minutes
- **Staging:** 5 minutes
- **Development:** 10-15 minutes

### 3. Escalation Policy
```
1. Alert sent to primary on-call (immediate)
2. If not acknowledged in 5 minutes → escalate to secondary
3. If not acknowledged in 10 minutes → escalate to manager
4. If not resolved in 30 minutes → page entire team
```

### 4. Status Page
Create a public status page to communicate outages:
- Current status
- Incident history
- Scheduled maintenance
- Subscribe to updates

### 5. Maintenance Windows
Schedule maintenance during low-traffic periods:
- Announce 24-48 hours in advance
- Use status page for updates
- Keep maintenance under 2 hours

## Integration with Sentry

Sentry is already configured for error tracking. To integrate with uptime monitoring:

1. **Sentry Alerts:**
   - Configure alert rules in Sentry dashboard
   - Set thresholds for error rates
   - Connect to Slack/email for notifications

2. **Correlation:**
   - When uptime monitor detects downtime, check Sentry for errors
   - Use Sentry's release tracking to correlate issues with deployments

## Monitoring Dashboard

Create a monitoring dashboard that displays:

### Key Metrics
- Current uptime percentage (30-day rolling)
- Average response time (24-hour)
- Error rate (requests/minute)
- Active users (current)

### Health Indicators
- Database status
- Redis status (if applicable)
- External service status (Stripe, Gemini API)

### Recent Incidents
- Last 5 incidents
- Resolution time
- Root cause

## Uptime Calculation

```javascript
// Calculate uptime percentage
const totalMinutes = 30 * 24 * 60; // 30 days
const downtimeMinutes = 180; // 3 hours
const uptimePercentage = ((totalMinutes - downtimeMinutes) / totalMinutes) * 100;
// Result: 99.58%
```

## Incident Response Procedure

### When Alert Fires

1. **Acknowledge** (within 5 minutes)
   - Acknowledge alert in monitoring service
   - Post in team chat: "Investigating [issue]"

2. **Investigate** (within 10 minutes)
   - Check health endpoints
   - Review Sentry errors
   - Check server logs
   - Verify database connectivity

3. **Communicate** (within 15 minutes)
   - Update status page
   - Post incident details
   - Provide ETA for resolution

4. **Resolve** (ASAP)
   - Fix the issue
   - Verify service is healthy
   - Monitor for 10 minutes

5. **Post-Mortem** (within 24 hours)
   - Document what happened
   - Identify root cause
   - Create action items to prevent recurrence

## Testing Uptime Monitoring

### Simulate Downtime
```bash
# Stop the server temporarily
pm2 stop focusaint-backend

# Wait for alert (should arrive within check interval)

# Restart server
pm2 start focusaint-backend

# Verify recovery alert
```

### Test Alert Delivery
1. Configure test alert in monitoring service
2. Verify email delivery
3. Verify SMS delivery (if configured)
4. Test webhook integrations

## Cost Estimation

### Free Tier (Development)
- UptimeRobot: $0/month
- Sentry: $0/month (up to 5k events)
- **Total:** $0/month

### Paid Tier (Production)
- Better Uptime: $20/month
- Sentry: $26/month (50k events)
- **Total:** $46/month

### Enterprise Tier
- Datadog: $15/host/month + $31/million spans
- PagerDuty: $21/user/month
- **Total:** ~$100-200/month

## Recommended for focusaint

**Phase 1 (MVP/Beta):**
- UptimeRobot (Free)
- Sentry (Free tier)
- Manual status updates

**Phase 2 (Launch):**
- Better Uptime ($20/month)
- Sentry Pro ($26/month)
- Automated status page

**Phase 3 (Scale):**
- Datadog or New Relic
- PagerDuty for on-call
- Advanced monitoring and APM

## Additional Resources

- [UptimeRobot Documentation](https://uptimerobot.com/api/)
- [Better Uptime Documentation](https://docs.betteruptime.com/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [HTTP Status Codes](https://httpstatuses.com/)

---

**Last Updated:** March 4, 2026
**Target Uptime:** 99.5%

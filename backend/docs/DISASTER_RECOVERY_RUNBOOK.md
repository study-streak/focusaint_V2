# Disaster Recovery Runbook

## Document Control

**Version:** 1.0  
**Last Updated:** 2024-01-15  
**Owner:** DevOps Team  
**Review Cycle:** Quarterly  
**Next Review:** 2024-04-15

## Purpose

This runbook provides step-by-step procedures for responding to and recovering from disaster scenarios affecting the focusaint production environment. It is designed to be used during high-stress situations and assumes the reader may be unfamiliar with the system.

**Recovery Objectives:**
- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 24 hours (daily backups)
- **Uptime Target:** 99.5% annually

## Emergency Contacts

### Primary Response Team

| Role | Name | Phone | Email | Backup |
|------|------|-------|-------|--------|
| Incident Commander | [Name] | [Phone] | [Email] | [Backup Name] |
| Database Administrator | [Name] | [Phone] | [Email] | [Backup Name] |
| DevOps Lead | [Name] | [Phone] | [Email] | [Backup Name] |
| Backend Lead | [Name] | [Phone] | [Email] | [Backup Name] |
| Frontend Lead | [Name] | [Phone] | [Email] | [Backup Name] |

### External Contacts

| Service | Contact | Support Level | Phone/Email |
|---------|---------|---------------|-------------|
| MongoDB Atlas | Support Portal | Premium | support.mongodb.com |
| Vercel | Support Portal | Pro | vercel.com/support |
| Stripe | Dashboard | Standard | support.stripe.com |
| AWS/Cloud Provider | Console | Business | [Support Link] |

### Escalation Path

1. **Level 1:** On-call engineer (immediate response)
2. **Level 2:** Team lead (15 minutes)
3. **Level 3:** CTO/VP Engineering (30 minutes)
4. **Level 4:** CEO/Executive team (1 hour)

---

## Disaster Scenarios

### Scenario Classification

| Severity | Impact | Response Time | Examples |
|----------|--------|---------------|----------|
| **P0 - Critical** | Complete service outage | Immediate | Database loss, infrastructure failure |
| **P1 - High** | Major feature unavailable | < 1 hour | Payment system down, auth failure |
| **P2 - Medium** | Degraded performance | < 4 hours | Slow queries, partial data loss |
| **P3 - Low** | Minor issues | < 24 hours | Non-critical feature bug |

---

## Disaster Response Framework

### Phase 1: Detection & Assessment (0-15 minutes)

#### 1.1 Incident Detection

**Monitoring Alerts:**
- Sentry error rate spike
- Uptime monitor failure
- Database connection errors
- API response time degradation
- User reports via support channels

**Initial Actions:**
```bash
# Check system status
curl https://api.focusaint.com/health

# Check monitoring dashboard
# → Open Sentry dashboard
# → Open application monitoring

# Check infrastructure
docker-compose ps
# or
kubectl get pods -n production
```

#### 1.2 Severity Assessment

**Questions to answer:**
1. Is the service completely down or degraded?
2. How many users are affected?
3. Is data at risk?
4. Is this a security incident?
5. What is the business impact?

**Severity Matrix:**

| Users Affected | Data Loss Risk | Downtime | Severity |
|----------------|----------------|----------|----------|
| All | Yes | Any | P0 |
| All | No | > 1 hour | P0 |
| > 50% | Yes | Any | P0 |
| > 50% | No | > 2 hours | P1 |
| < 50% | No | > 4 hours | P2 |
| < 10% | No | Any | P3 |

#### 1.3 Incident Declaration

**For P0/P1 incidents:**

1. **Declare incident** in team communication channel
   ```
   🚨 INCIDENT DECLARED - P0
   Issue: [Brief description]
   Impact: [User impact]
   Incident Commander: [Name]
   War Room: [Link to video call]
   ```

2. **Assemble response team**
   - Page on-call engineer
   - Notify relevant team leads
   - Start war room video call

3. **Create incident document**
   - Use incident template
   - Document timeline
   - Track actions taken


### Phase 2: Containment (15-30 minutes)

#### 2.1 Stop the Bleeding

**Immediate actions to prevent further damage:**

**If database is corrupted:**
```bash
# Stop all write operations
# Put application in read-only mode
export MAINTENANCE_MODE=true
docker-compose restart backend

# Or stop the service entirely
docker-compose stop backend
```

**If security breach suspected:**
```bash
# Rotate all API keys immediately
node backend/scripts/rotate-api-keys.js --emergency

# Invalidate all user sessions
node backend/scripts/invalidate-sessions.js --all

# Enable IP whitelist for admin endpoints
node backend/scripts/enable-ip-whitelist.js
```

**If external service failure:**
```bash
# Enable circuit breaker for failing service
node backend/scripts/circuit-breaker.js --service stripe --enable

# Switch to fallback mode
export FALLBACK_MODE=true
docker-compose restart backend
```

#### 2.2 User Communication

**Status page update:**
```bash
# Update status page
curl -X POST https://status.focusaint.com/api/incidents \
  -H "Authorization: Bearer $STATUS_PAGE_TOKEN" \
  -d '{
    "name": "Service Disruption",
    "status": "investigating",
    "message": "We are investigating reports of service issues."
  }'
```

**Communication templates:**

**Initial notification (within 15 minutes):**
```
We are aware of an issue affecting [service/feature]. 
Our team is investigating and will provide updates every 30 minutes.
Status: https://status.focusaint.com
```

**Update notification (every 30 minutes):**
```
Update: We have identified the issue as [brief description].
Our team is working on a fix. Estimated resolution: [time]
```

**Resolution notification:**
```
The issue has been resolved. All services are now operational.
We apologize for the inconvenience. Post-mortem: [link]
```

### Phase 3: Recovery (30 minutes - 4 hours)

#### 3.1 Database Recovery

**See detailed procedures in:** [RECOVERY_PROCEDURES.md](./RECOVERY_PROCEDURES.md)

**Quick reference:**

```bash
# 1. List available backups
node backend/scripts/list-backups.js

# 2. Download latest backup
node backend/scripts/download-backup.js --latest

# 3. Restore database
node backend/scripts/restore-database.js \
  --backup ./backups/focusaint-YYYY-MM-DD.archive

# 4. Verify restore
node backend/scripts/verify-restore.js

# 5. Restart services
docker-compose up -d
```

**Expected duration:** 2-4 hours depending on database size

#### 3.2 Infrastructure Recovery

**Complete infrastructure failure:**

```bash
# 1. Verify cloud provider status
# Check AWS/GCP/Azure status page

# 2. Restore from infrastructure-as-code
cd infrastructure/
terraform init
terraform plan
terraform apply

# 3. Restore application
docker-compose pull
docker-compose up -d

# 4. Restore database (see 3.1)

# 5. Verify all services
./scripts/health-check.sh
```

#### 3.3 Application Recovery

**Application crash/corruption:**

```bash
# 1. Rollback to last known good version
git log --oneline -10
git checkout <last-good-commit>

# 2. Rebuild and deploy
npm run build
docker-compose build
docker-compose up -d

# 3. Verify deployment
curl https://api.focusaint.com/health
npm run test:smoke
```

#### 3.4 Data Corruption Recovery

**Partial data corruption:**

```bash
# 1. Identify corrupted data
node backend/scripts/validate-data.js --collection users

# 2. Export corrupted records
mongoexport --db focusaint --collection users \
  --query '{"corrupted": true}' \
  --out corrupted_users.json

# 3. Restore from backup to temp database
node backend/scripts/restore-database.js \
  --backup ./backups/latest.archive \
  --target-db focusaint_temp

# 4. Extract clean records
mongoexport --db focusaint_temp --collection users \
  --query '{"_id": {"$in": [...]}}' \
  --out clean_users.json

# 5. Import clean records
mongoimport --db focusaint --collection users \
  --file clean_users.json \
  --mode upsert

# 6. Verify data integrity
node backend/scripts/validate-data.js --collection users
```

### Phase 4: Verification (30 minutes - 1 hour)

#### 4.1 System Health Checks

**Automated verification:**

```bash
# Run comprehensive health check
node backend/scripts/health-check.js --comprehensive

# Expected output:
# ✓ Database connection: OK
# ✓ Redis connection: OK
# ✓ API endpoints: OK (50/50)
# ✓ External services: OK (Stripe, Email)
# ✓ Data integrity: OK
```

**Manual verification checklist:**

- [ ] Homepage loads correctly
- [ ] User can sign up
- [ ] User can log in
- [ ] User can create a session
- [ ] User can view dashboard
- [ ] Payment flow works (test mode)
- [ ] Email notifications send
- [ ] AI features respond
- [ ] Data syncs across devices

#### 4.2 Performance Verification

```bash
# Check API response times
node backend/scripts/performance-check.js

# Expected:
# p50: < 200ms
# p95: < 500ms
# p99: < 1000ms

# Check database query performance
node backend/scripts/slow-query-check.js

# Expected: No queries > 1000ms
```

#### 4.3 Data Integrity Verification

```bash
# Verify document counts
node backend/scripts/verify-counts.js

# Verify critical data
node backend/scripts/verify-critical-data.js

# Check for data anomalies
node backend/scripts/detect-anomalies.js
```

### Phase 5: Post-Recovery (1-24 hours)

#### 5.1 Monitoring

**Intensive monitoring period (first 4 hours):**

```bash
# Monitor error rates
watch -n 60 'curl -s https://api.focusaint.com/metrics | jq .error_rate'

# Monitor response times
watch -n 60 'curl -s https://api.focusaint.com/metrics | jq .response_time_p95'

# Monitor database performance
watch -n 60 'mongosh --eval "db.serverStatus().connections"'
```

**Alert thresholds (tighter during recovery):**
- Error rate > 0.5% (normal: 1%)
- Response time p95 > 400ms (normal: 500ms)
- Database connections > 70% (normal: 80%)

#### 5.2 User Communication

**Resolution announcement:**

```
✅ RESOLVED: The issue affecting [service] has been resolved.

What happened: [Brief explanation]
Impact: [Duration and scope]
Resolution: [What was done]

We apologize for the disruption. A detailed post-mortem will be 
published within 48 hours at: https://status.focusaint.com/incidents/[id]

Thank you for your patience.
```

#### 5.3 Incident Documentation

**Required documentation:**

1. **Incident timeline**
   - Detection time
   - Response actions
   - Resolution time
   - Key decisions made

2. **Impact assessment**
   - Users affected
   - Duration of outage
   - Data loss (if any)
   - Revenue impact

3. **Root cause analysis**
   - What happened
   - Why it happened
   - Contributing factors

4. **Action items**
   - Immediate fixes
   - Long-term improvements
   - Process changes

**Template location:** `.kiro/templates/incident-report.md`

---

## Specific Disaster Scenarios

### DS-1: Complete Database Loss

**Symptoms:**
- Cannot connect to database
- All API endpoints returning 500 errors
- "Connection refused" or "Database not found" errors

**Recovery procedure:**

```bash
# 1. Confirm database is truly lost
mongosh $MONGODB_URI --eval "db.stats()"
# If this fails, database is inaccessible

# 2. Check if it's a connection issue
ping <database-host>
telnet <database-host> 27017

# 3. If database is truly lost, restore from backup
node backend/scripts/list-backups.js
node backend/scripts/download-backup.js --latest
node backend/scripts/restore-database.js \
  --backup ./backups/focusaint-latest.archive \
  --drop-existing

# 4. Verify restore
node backend/scripts/verify-restore.js

# 5. Restart application
docker-compose restart backend

# 6. Monitor for 1 hour
tail -f logs/backend.log
```

**Expected duration:** 2-4 hours  
**Data loss:** Up to 24 hours (last backup)

### DS-2: Infrastructure Failure (Complete Outage)

**Symptoms:**
- All services unreachable
- DNS not resolving
- Cloud provider dashboard shows issues

**Recovery procedure:**

```bash
# 1. Check cloud provider status
# Visit status page: status.aws.com, status.azure.com, etc.

# 2. If provider issue, wait for resolution
# If our infrastructure issue, proceed:

# 3. Restore infrastructure from code
cd infrastructure/
terraform init
terraform plan -out=recovery.plan
terraform apply recovery.plan

# 4. Deploy application
docker-compose pull
docker-compose up -d

# 5. Restore database (if needed)
# See DS-1

# 6. Update DNS (if needed)
# Update DNS records to point to new infrastructure

# 7. Verify all services
./scripts/comprehensive-health-check.sh
```

**Expected duration:** 4-8 hours  
**Data loss:** Depends on database status

### DS-3: Security Breach

**Symptoms:**
- Unauthorized access detected
- Suspicious database modifications
- API keys compromised
- User data accessed

**Recovery procedure:**

```bash
# 1. IMMEDIATE: Isolate the system
# Disable all external access
iptables -A INPUT -j DROP
# Or use cloud provider firewall

# 2. Rotate ALL credentials
node backend/scripts/rotate-all-credentials.js --emergency

# 3. Invalidate all user sessions
node backend/scripts/invalidate-sessions.js --all

# 4. Analyze breach
# Check access logs
grep "suspicious-ip" /var/log/nginx/access.log
# Check database audit logs
node backend/scripts/audit-log-analysis.js --since "2024-01-15"

# 5. Restore from pre-breach backup
# Identify last known good backup
node backend/scripts/list-backups.js
# Restore to point before breach
node backend/scripts/restore-database.js \
  --backup ./backups/focusaint-pre-breach.archive

# 6. Patch vulnerability
# Apply security patches
# Update dependencies
npm audit fix --force

# 7. Re-enable access with new credentials
# Update firewall rules
# Deploy patched application

# 8. Notify affected users
node backend/scripts/send-breach-notification.js
```

**Expected duration:** 4-12 hours  
**Legal requirements:** May need to notify authorities within 72 hours (GDPR)

### DS-4: Data Corruption

**Symptoms:**
- Users reporting incorrect data
- Database validation errors
- Inconsistent data across collections

**Recovery procedure:**

```bash
# 1. Stop writes to prevent further corruption
export READ_ONLY_MODE=true
docker-compose restart backend

# 2. Identify scope of corruption
node backend/scripts/validate-all-data.js > corruption-report.txt

# 3. Determine corruption timeline
# Check when corruption started
node backend/scripts/find-corruption-start.js

# 4. Restore affected data from backup
# Restore to temporary database
node backend/scripts/restore-database.js \
  --backup ./backups/focusaint-pre-corruption.archive \
  --target-db focusaint_temp

# 5. Extract clean data
node backend/scripts/extract-clean-data.js \
  --source focusaint_temp \
  --target focusaint \
  --affected-collections users,habitsessions

# 6. Verify data integrity
node backend/scripts/validate-all-data.js

# 7. Re-enable writes
export READ_ONLY_MODE=false
docker-compose restart backend
```

**Expected duration:** 2-6 hours  
**Data loss:** Depends on corruption scope

### DS-5: Payment System Failure

**Symptoms:**
- Stripe webhooks failing
- Users cannot subscribe
- Payment processing errors

**Recovery procedure:**

```bash
# 1. Check Stripe status
curl https://status.stripe.com/api/v2/status.json

# 2. If Stripe is down, enable fallback mode
export PAYMENT_FALLBACK_MODE=true
# Queue subscription requests for later processing
docker-compose restart backend

# 3. If our integration is broken:
# Check webhook endpoint
curl -X POST https://api.focusaint.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"type": "test"}'

# 4. Verify Stripe webhook configuration
node backend/scripts/verify-stripe-webhooks.js

# 5. Re-register webhooks if needed
node backend/scripts/register-stripe-webhooks.js

# 6. Process queued subscriptions
node backend/scripts/process-queued-subscriptions.js

# 7. Verify payment flow
node backend/scripts/test-payment-flow.js --test-mode
```

**Expected duration:** 1-2 hours  
**Business impact:** Lost revenue during outage

### DS-6: Email Service Failure

**Symptoms:**
- OTP emails not sending
- Users cannot verify accounts
- Notification emails failing

**Recovery procedure:**

```bash
# 1. Check email service status
node backend/scripts/test-email.js --to test@example.com

# 2. Switch to backup email provider
export EMAIL_PROVIDER=backup
export EMAIL_API_KEY=$BACKUP_EMAIL_KEY
docker-compose restart backend

# 3. Retry failed emails
node backend/scripts/retry-failed-emails.js --since "1 hour ago"

# 4. Verify email delivery
node backend/scripts/test-email.js --to test@example.com

# 5. Monitor email queue
watch -n 60 'node backend/scripts/email-queue-status.js'
```

**Expected duration:** 30 minutes - 1 hour  
**User impact:** Cannot verify accounts or receive notifications

---

## Recovery Tools & Scripts

### Essential Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `list-backups.js` | List available backups | `node backend/scripts/list-backups.js` |
| `download-backup.js` | Download backup from storage | `node backend/scripts/download-backup.js --latest` |
| `restore-database.js` | Restore database from backup | `node backend/scripts/restore-database.js --backup <file>` |
| `verify-restore.js` | Verify restored data | `node backend/scripts/verify-restore.js` |
| `test-recovery.js` | Test recovery procedures | `node backend/scripts/test-recovery.js` |
| `health-check.js` | Comprehensive health check | `node backend/scripts/health-check.js` |
| `validate-data.js` | Validate data integrity | `node backend/scripts/validate-data.js` |

### Monitoring Commands

```bash
# Check system status
curl https://api.focusaint.com/health | jq

# Check error rate
curl https://api.focusaint.com/metrics | jq .error_rate

# Check database connections
mongosh --eval "db.serverStatus().connections"

# Check Redis status
redis-cli ping

# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top -bn1 | head -20
```

---

## Testing & Validation

### Monthly Recovery Test

**Schedule:** First Sunday of each month, 2:00 AM UTC

**Procedure:**

```bash
# Run automated recovery test
node backend/scripts/test-recovery.js

# Expected output:
# ✓ Test data created
# ✓ Backup created
# ✓ Database dropped
# ✓ Backup restored
# ✓ Data verified
# Total duration: < 4 hours
```

**Success criteria:**
- All steps complete without errors
- Total duration < 4 hours (RTO)
- Data integrity 100%
- No data loss

### Quarterly Disaster Drill

**Schedule:** Last Saturday of quarter, 10:00 AM

**Procedure:**
1. Simulate realistic disaster scenario
2. Assemble response team
3. Execute recovery procedures
4. Document lessons learned
5. Update runbook

**Scenarios to test:**
- Q1: Complete database loss
- Q2: Infrastructure failure
- Q3: Security breach
- Q4: Data corruption

---

## Continuous Improvement

### Post-Incident Review

**Within 48 hours of incident:**

1. **Conduct blameless post-mortem**
   - What happened?
   - Why did it happen?
   - How did we respond?
   - What went well?
   - What could be improved?

2. **Document action items**
   - Immediate fixes
   - Short-term improvements (< 1 month)
   - Long-term improvements (< 3 months)
   - Process changes

3. **Assign owners and deadlines**

4. **Publish post-mortem** (internal and external)

### Runbook Updates

**Update this runbook when:**
- New disaster scenario encountered
- Recovery procedure changes
- New tools or scripts added
- Contact information changes
- Infrastructure changes

**Review schedule:**
- After every P0/P1 incident
- After quarterly disaster drill
- Quarterly scheduled review

---

## Appendices

### Appendix A: Backup Locations

**Production backups:**
- Primary: `s3://focusaint-backups-primary/`
- Secondary: `s3://focusaint-backups-secondary/` (different region)
- Retention: 30 days daily, 12 months monthly

**Access:**
```bash
# Configure AWS CLI
aws configure --profile focusaint-backups

# List backups
aws s3 ls s3://focusaint-backups-primary/ --profile focusaint-backups
```

### Appendix B: Service Dependencies

**Critical dependencies:**
1. MongoDB (P0 - cannot operate without)
2. Redis (P1 - can operate with degraded performance)
3. Stripe (P1 - affects revenue but not core features)
4. Email Service (P2 - can queue for later)
5. Gemini API (P2 - can disable AI features)

### Appendix C: Rollback Procedures

**Application rollback:**

```bash
# 1. Identify last good version
git log --oneline -10

# 2. Rollback code
git revert <bad-commit>
# or
git checkout <last-good-commit>

# 3. Rebuild and deploy
npm run build
docker-compose build
docker-compose up -d

# 4. Verify
curl https://api.focusaint.com/health
```

**Database rollback:**

```bash
# 1. Stop application
docker-compose stop backend

# 2. Restore from backup
node backend/scripts/restore-database.js \
  --backup ./backups/focusaint-pre-change.archive \
  --drop-existing

# 3. Restart application
docker-compose start backend
```

### Appendix D: Communication Templates

**Incident notification (Slack/Teams):**
```
🚨 INCIDENT: P0 - [Brief Description]

Status: Investigating
Impact: [User impact]
Started: [Time]
Incident Commander: @[name]
War Room: [Video call link]

Updates will be posted every 30 minutes.
```

**Status page update:**
```
Title: Service Disruption - [Component]
Status: Investigating | Identified | Monitoring | Resolved
Message: [User-friendly description of issue and current status]
```

**User email notification:**
```
Subject: Service Update - [Date]

Dear focusaint user,

We experienced a service disruption on [date] from [time] to [time].

What happened: [Brief explanation]
Impact: [What users experienced]
Resolution: [What we did to fix it]

We sincerely apologize for any inconvenience this may have caused.

If you have any questions, please contact support@focusaint.com

The focusaint Team
```

---

## Quick Reference Card

**Print this page and keep it accessible**

### Emergency Response Checklist

- [ ] Detect and assess severity
- [ ] Declare incident (P0/P1)
- [ ] Assemble response team
- [ ] Update status page
- [ ] Stop the bleeding (containment)
- [ ] Execute recovery procedure
- [ ] Verify system health
- [ ] Monitor intensively
- [ ] Communicate resolution
- [ ] Document incident
- [ ] Conduct post-mortem

### Key Commands

```bash
# Health check
curl https://api.focusaint.com/health

# List backups
node backend/scripts/list-backups.js

# Restore database
node backend/scripts/restore-database.js --backup <file>

# Verify restore
node backend/scripts/verify-restore.js

# Check logs
docker-compose logs -f backend
```

### Emergency Contacts

- Incident Commander: [Phone]
- Database Admin: [Phone]
- DevOps Lead: [Phone]

### Recovery Time Targets

- Detection: < 15 minutes
- Assessment: < 15 minutes
- Containment: < 30 minutes
- Recovery: < 4 hours
- Total RTO: 4 hours

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-15 | DevOps Team | Initial version |

---

**END OF RUNBOOK**

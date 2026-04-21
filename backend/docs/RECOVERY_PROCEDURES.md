# Database Recovery Procedures

## Overview

This document outlines the procedures for recovering the focusaint MongoDB database from backups in the event of data loss, corruption, or disaster scenarios.

**Recovery Time Objective (RTO):** 4 hours
**Recovery Point Objective (RPO):** 24 hours (daily backups)

## Prerequisites

- Access to backup storage location (S3 or equivalent)
- MongoDB client tools installed (`mongorestore`, `mongosh`)
- Appropriate credentials and permissions
- Network access to MongoDB instance

## Recovery Scenarios

### Scenario 1: Complete Database Loss

**When to use:** Entire database is lost or corrupted beyond repair

**Steps:**

1. **Stop the application**
   ```bash
   # Stop backend services
   docker-compose stop backend
   # Or if running directly
   pm2 stop focusaint-backend
   ```

2. **Verify backup availability**
   ```bash
   # List available backups
   node backend/scripts/list-backups.js
   ```

3. **Download backup from storage**
   ```bash
   # Download latest backup
   node backend/scripts/download-backup.js --latest
   # Or specific backup by date
   node backend/scripts/download-backup.js --date 2024-01-15
   ```

4. **Restore database**
   ```bash
   # Run restore script
   node backend/scripts/restore-database.js --backup ./backups/focusaint-2024-01-15.archive
   ```

5. **Verify data integrity**
   ```bash
   # Run verification script
   node backend/scripts/verify-restore.js
   ```

6. **Restart application**
   ```bash
   docker-compose start backend
   # Or
   pm2 start focusaint-backend
   ```

7. **Monitor application logs**
   ```bash
   docker-compose logs -f backend
   ```

**Expected Duration:** 2-4 hours depending on database size

---

### Scenario 2: Partial Data Loss (Single Collection)

**When to use:** Specific collection is corrupted but rest of database is intact

**Steps:**

1. **Identify affected collection**
   ```bash
   # Check collection status
   mongosh --eval "db.getCollectionNames()"
   ```

2. **Download backup**
   ```bash
   node backend/scripts/download-backup.js --latest
   ```

3. **Restore specific collection**
   ```bash
   # Restore only the affected collection
   node backend/scripts/restore-database.js \
     --backup ./backups/focusaint-2024-01-15.archive \
     --collection users
   ```

4. **Verify collection data**
   ```bash
   node backend/scripts/verify-restore.js --collection users
   ```

**Expected Duration:** 30 minutes - 1 hour

---

### Scenario 3: Point-in-Time Recovery

**When to use:** Need to restore to a specific point in time (e.g., before bad data was written)

**Steps:**

1. **Identify target restore point**
   ```bash
   # List backups with timestamps
   node backend/scripts/list-backups.js --detailed
   ```

2. **Create backup of current state** (safety measure)
   ```bash
   node backend/scripts/backup-database.js --tag "pre-restore-$(date +%Y%m%d-%H%M%S)"
   ```

3. **Download target backup**
   ```bash
   node backend/scripts/download-backup.js --date 2024-01-15
   ```

4. **Restore to point in time**
   ```bash
   node backend/scripts/restore-database.js \
     --backup ./backups/focusaint-2024-01-15.archive \
     --drop-existing
   ```

5. **Verify and reconcile**
   ```bash
   node backend/scripts/verify-restore.js
   # Manual verification of critical data
   ```

**Expected Duration:** 2-3 hours

---

### Scenario 4: Accidental Data Deletion

**When to use:** User data or records were accidentally deleted

**Steps:**

1. **Stop writes to affected data**
   ```bash
   # Put application in read-only mode if possible
   # Or stop the service temporarily
   ```

2. **Identify last good backup**
   ```bash
   node backend/scripts/list-backups.js
   ```

3. **Extract deleted data from backup**
   ```bash
   # Restore to temporary database
   node backend/scripts/restore-database.js \
     --backup ./backups/focusaint-2024-01-15.archive \
     --target-db focusaint_temp
   ```

4. **Export deleted records**
   ```bash
   # Export specific records
   mongoexport --db focusaint_temp --collection users \
     --query '{"_id": {"$in": ["id1", "id2"]}}' \
     --out deleted_users.json
   ```

5. **Import into production**
   ```bash
   mongoimport --db focusaint --collection users \
     --file deleted_users.json \
     --mode upsert
   ```

6. **Clean up temporary database**
   ```bash
   mongosh --eval "db.getSiblingDB('focusaint_temp').dropDatabase()"
   ```

**Expected Duration:** 1-2 hours

---

## Pre-Recovery Checklist

Before starting any recovery procedure:

- [ ] Notify team members and stakeholders
- [ ] Document the incident (what happened, when, impact)
- [ ] Verify backup integrity and availability
- [ ] Ensure sufficient disk space for restore
- [ ] Create backup of current state (if possible)
- [ ] Put application in maintenance mode
- [ ] Notify users of downtime (if applicable)

## Post-Recovery Checklist

After completing recovery:

- [ ] Verify all collections are present
- [ ] Check document counts match expected values
- [ ] Test critical application functions
- [ ] Verify user authentication works
- [ ] Check data integrity (no corruption)
- [ ] Review application logs for errors
- [ ] Monitor performance metrics
- [ ] Document recovery process and duration
- [ ] Conduct post-mortem analysis
- [ ] Update runbook with lessons learned

## Recovery Time Estimates

| Database Size | Full Restore | Collection Restore | Verification |
|--------------|--------------|-------------------|--------------|
| < 1 GB       | 15-30 min    | 5-10 min         | 10 min       |
| 1-10 GB      | 30-90 min    | 10-20 min        | 20 min       |
| 10-50 GB     | 1-3 hours    | 20-40 min        | 30 min       |
| > 50 GB      | 3-6 hours    | 40-90 min        | 60 min       |

## Troubleshooting

### Issue: Backup file not found

**Solution:**
```bash
# Check backup storage
aws s3 ls s3://focusaint-backups/
# Or check local backup directory
ls -lh /var/backups/mongodb/
```

### Issue: Insufficient disk space

**Solution:**
```bash
# Check available space
df -h
# Clean up old logs or temporary files
# Or restore to a different volume
```

### Issue: Connection timeout during restore

**Solution:**
```bash
# Increase timeout in restore script
# Or restore in smaller batches
node backend/scripts/restore-database.js \
  --backup ./backups/focusaint.archive \
  --batch-size 1000
```

### Issue: Index rebuild taking too long

**Solution:**
```bash
# Restore without indexes first
mongorestore --noIndexRestore --archive=backup.archive
# Rebuild indexes in background
node backend/scripts/rebuild-indexes.js --background
```

## Emergency Contacts

- **Database Administrator:** [Contact Info]
- **DevOps Lead:** [Contact Info]
- **CTO/Technical Lead:** [Contact Info]
- **MongoDB Support:** [Support Plan Details]

## Related Documentation

- [Backup Procedures](./BACKUP_PROCEDURES.md)
- [Disaster Recovery Runbook](./DISASTER_RECOVERY_RUNBOOK.md)
- [Database Migration Guide](./DATABASE_MIGRATIONS.md)
- [Monitoring and Alerting](./MONITORING.md)

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2024-01-15 | 1.0 | Initial version | DevOps Team |

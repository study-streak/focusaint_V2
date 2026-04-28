# Database Indexes Documentation

## Overview

This document describes all database indexes implemented in the focusaint application for optimal query performance. Indexes are critical for production performance, especially as the user base grows.

## Index Strategy

Our indexing strategy follows these principles:

1. **Query Pattern Analysis**: Indexes are created based on common query patterns
2. **Compound Indexes**: Multi-field indexes for queries filtering on multiple fields
3. **Sort Optimization**: Descending indexes (-1) for queries that sort by date/score
4. **Unique Constraints**: Unique indexes for fields that must be unique (email, userId)

## User Collection Indexes

### 1. Email Index (Unique)
```javascript
{ email: 1 }
```
- **Purpose**: Fast user lookup during authentication
- **Queries**: Login, signup duplicate check, password reset
- **Unique**: Yes
- **Usage**: Every authentication request

### 2. Subscription Tier Index
```javascript
{ subscriptionTier: 1 }
```
- **Purpose**: Filter users by subscription level
- **Queries**: Admin reports, feature access checks, billing queries
- **Usage**: Analytics, tier-based feature gating

### 3. Current Streak Index (Descending)
```javascript
{ currentStreak: -1 }
```
- **Purpose**: Leaderboard queries, top performers
- **Queries**: Leaderboard generation, streak rankings
- **Usage**: Leaderboard page, gamification features

### 4. Last Session Date Index (Descending)
```javascript
{ lastSessionDate: -1 }
```
- **Purpose**: Find recently active users, churn analysis
- **Queries**: Active user reports, engagement metrics
- **Usage**: Analytics, user retention tracking

## HabitSession Collection Indexes

### 1. User + Session Date (Compound, Descending)
```javascript
{ userId: 1, sessionDate: -1 }
```
- **Purpose**: User's session history sorted by date
- **Queries**: Session history page, recent sessions
- **Usage**: Dashboard, analytics, history views

### 2. User + Session Date (Compound, Ascending)
```javascript
{ userId: 1, sessionDate: 1 }
```
- **Purpose**: User's session history in chronological order
- **Queries**: Streak calculation, first session queries
- **Usage**: Streak tracking, onboarding analytics

### 3. User + Status (Compound)
```javascript
{ userId: 1, status: 1 }
```
- **Purpose**: Find active/completed sessions for a user
- **Queries**: Active session check, completion tracking
- **Usage**: Session management, concurrent session limits

### 4. Start Time Index (Descending)
```javascript
{ startTime: -1 }
```
- **Purpose**: Global recent sessions, admin queries
- **Queries**: Platform-wide activity monitoring
- **Usage**: Admin dashboard, system monitoring

### 5. User + Created At (Compound, Descending)
```javascript
{ userId: 1, createdAt: -1 }
```
- **Purpose**: User's sessions sorted by creation time
- **Queries**: Recent activity, session pagination
- **Usage**: User profile, activity feeds

## HabitTask Collection Indexes

### 1. User + Assigned Date (Compound)
```javascript
{ userId: 1, assignedDate: 1 }
```
- **Purpose**: Daily task list for a user
- **Queries**: Today's tasks, specific date tasks
- **Usage**: Daily planner, task calendar

### 2. User + Month-Year (Compound)
```javascript
{ userId: 1, monthYear: 1 }
```
- **Purpose**: Monthly task view
- **Queries**: Monthly planning, task overview
- **Usage**: Monthly planner page

### 3. User + Completed (Compound)
```javascript
{ userId: 1, completed: 1 }
```
- **Purpose**: Filter completed/incomplete tasks
- **Queries**: Task completion tracking, pending tasks
- **Usage**: Task lists, completion analytics

### 4. User + Deadline (Compound)
```javascript
{ userId: 1, deadline: 1 }
```
- **Purpose**: Upcoming deadlines, overdue tasks
- **Queries**: Deadline reminders, priority sorting
- **Usage**: Task prioritization, notifications

### 5. Attachment URL Index
```javascript
{ "attachments.url": 1 }
```
- **Purpose**: Find tasks by attachment URL
- **Queries**: File management, duplicate detection
- **Usage**: File cleanup, storage management

## StreakRecord Collection Indexes

### 1. User ID Index (Unique)
```javascript
{ userId: 1 }
```
- **Purpose**: One streak record per user
- **Queries**: Streak lookup, updates
- **Unique**: Yes
- **Usage**: Every streak-related operation

### 2. Current Streak Index (Descending)
```javascript
{ currentStreak: -1 }
```
- **Purpose**: Leaderboard, top streaks
- **Queries**: Streak rankings, gamification
- **Usage**: Leaderboard, achievements

### 3. Last Active Date Index (Descending)
```javascript
{ lastActiveDate: -1 }
```
- **Purpose**: Recent activity tracking
- **Queries**: Active users, engagement metrics
- **Usage**: Analytics, churn prediction

## Index Verification

### Running the Verification Script

```bash
cd backend
node scripts/verify-indexes.js
```

This script will:
1. Connect to MongoDB
2. List all indexes for each collection
3. Run sample queries with `.explain()` to verify index usage
4. Report which indexes are being used

### Expected Output

```
=== User Collection Indexes ===
Existing indexes: [ '_id_', 'email_1', 'subscriptionTier_1', 'currentStreak_-1', 'lastSessionDate_-1' ]

Test query: Find user by email
Index used: email_1
Docs examined: 1

Test query: Find users by subscription tier
Index used: subscriptionTier_1
Docs examined: 10
```

### Interpreting Results

- **Index used**: Shows which index MongoDB selected
- **COLLSCAN**: Indicates a collection scan (no index used) - needs investigation
- **Docs examined**: Lower is better - should match or be close to docs returned

## Performance Monitoring

### Query Performance Targets

- **User lookup by email**: < 10ms
- **Session history (30 days)**: < 50ms
- **Task list (daily)**: < 20ms
- **Streak lookup**: < 5ms
- **Leaderboard (top 100)**: < 100ms

### Monitoring Slow Queries

Enable MongoDB slow query logging:

```javascript
// In db.js or server startup
mongoose.set('debug', (collectionName, method, query, doc) => {
  const start = Date.now()
  // Log queries taking > 100ms
  if (Date.now() - start > 100) {
    console.warn(`Slow query: ${collectionName}.${method}`, query)
  }
})
```

## Index Maintenance

### When to Add New Indexes

Add indexes when:
1. A query consistently takes > 100ms
2. MongoDB profiler shows COLLSCAN on frequent queries
3. New features introduce new query patterns
4. User base grows significantly (> 10,000 users)

### Index Size Monitoring

Check index sizes:

```javascript
db.users.stats()
db.habitsessions.stats()
db.habittasks.stats()
db.streakrecords.stats()
```

### Rebuilding Indexes

If indexes become fragmented:

```javascript
db.users.reIndex()
db.habitsessions.reIndex()
db.habittasks.reIndex()
db.streakrecords.reIndex()
```

## Production Considerations

### Index Creation in Production

Indexes are created automatically when the application starts and models are loaded. For large collections, consider:

1. **Background Index Creation**: Mongoose creates indexes in the background by default
2. **Maintenance Windows**: Create indexes during low-traffic periods
3. **Monitoring**: Watch for performance impact during index creation

### Index Memory Usage

Indexes consume RAM. Monitor with:

```javascript
db.serverStatus().indexSize
```

Ensure sufficient RAM for:
- Working set (active data)
- All indexes
- Query execution

### Sharding Considerations

If implementing sharding in the future:
- Shard key should be part of most queries
- Consider `userId` as shard key for user-centric collections
- Compound shard keys for better distribution

## Troubleshooting

### Query Not Using Expected Index

1. Check index exists: `db.collection.getIndexes()`
2. Analyze query plan: `query.explain("executionStats")`
3. Verify query matches index fields exactly
4. Check for type mismatches (String vs ObjectId)

### High Index Memory Usage

1. Review index necessity - remove unused indexes
2. Consider partial indexes for large collections
3. Archive old data to reduce collection size

### Slow Index Creation

1. Create indexes before inserting large datasets
2. Use background index creation
3. Consider creating indexes during deployment

## Future Optimizations

As the application scales, consider:

1. **Partial Indexes**: Index only active users or recent data
2. **TTL Indexes**: Auto-delete old sessions/logs
3. **Text Indexes**: Full-text search on notes/descriptions
4. **Geospatial Indexes**: If adding location features
5. **Covered Queries**: Queries satisfied entirely by index

## References

- [MongoDB Index Documentation](https://docs.mongodb.com/manual/indexes/)
- [Mongoose Index Documentation](https://mongoosejs.com/docs/guide.html#indexes)
- [MongoDB Performance Best Practices](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)

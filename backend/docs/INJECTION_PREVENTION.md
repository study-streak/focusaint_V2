# Injection Prevention Documentation

## Overview

This document verifies that the focusaint backend is protected against injection attacks, including NoSQL injection (MongoDB) and other input-based vulnerabilities.

## Database: MongoDB (Not SQL)

**Important:** This application uses MongoDB with Mongoose ODM, not a SQL database. Therefore, SQL injection is not applicable. However, NoSQL injection prevention is critical.

## NoSQL Injection Prevention

### 1. Mongoose Schema Validation

All database models use Mongoose schemas with strict type definitions:

- **User.js**: Email, password, name, etc. with type validation
- **HabitSession.js**: Session data with typed fields
- **HabitTask.js**: Task data with typed fields
- **StreakRecord.js**: Streak tracking with typed fields
- **OTP.js**: OTP verification with typed fields

**Protection Mechanism:**
- Mongoose automatically validates data types
- Schema definitions prevent arbitrary field injection
- Type coercion provides first layer of defense

### 2. Parameterized Queries via Mongoose

All database queries use Mongoose methods which automatically parameterize queries:

```javascript
// SAFE: Mongoose parameterizes this query
await User.findOne({ email: userInput })

// SAFE: Mongoose handles ObjectId conversion
await HabitSession.findOne({ _id: sessionId, userId: req.user.userId })

// SAFE: Mongoose query builder
await HabitTask.find({
  userId: req.user.userId,
  assignedDate: date
}).sort({ createdAt: 1 })
```

**What Mongoose Prevents:**
- Direct string concatenation in queries
- Operator injection (e.g., `$where`, `$ne`)
- JavaScript execution in queries

### 3. Sanitization Middleware

**File:** `backend/middleware/sanitization.js`

**Function:** `sanitizeMongoQuery(obj)`

Removes dangerous MongoDB operators from user input:

```javascript
// Removes keys starting with $ or containing .
export function sanitizeMongoQuery(obj) {
  // Strips $where, $ne, $gt, etc.
  // Removes keys with . to prevent nested field injection
}
```

**Applied via:** `preventNoSQLInjection` middleware

### 4. Input Validation

**File:** `backend/middleware/validation.js`

Uses express-validator to validate and sanitize all inputs:

- Email format validation
- String length limits
- Type checking (numbers, dates, enums)
- Pattern matching (dates, IDs)
- Array validation

### 5. MongoDB ObjectId Validation

All document ID parameters are validated as MongoDB ObjectIds:

```javascript
param("taskId")
  .isMongoId()
  .withMessage("Invalid task ID format")
```

This prevents:
- Arbitrary string injection
- Query operator injection via IDs
- Type confusion attacks

## Verification Checklist

### ✅ Protected Query Patterns

1. **User Authentication**
   ```javascript
   // SAFE: Mongoose parameterized query
   const user = await User.findOne({ email })
   ```

2. **Session Queries**
   ```javascript
   // SAFE: Multiple conditions, all parameterized
   const session = await HabitSession.findOne({
     _id: sessionId,
     userId: req.user.userId
   })
   ```

3. **Aggregation Pipelines**
   ```javascript
   // SAFE: Mongoose aggregation with $match
   await HabitSession.aggregate([
     {
       $match: {
         userId: new mongoose.Types.ObjectId(req.user.userId),
         sessionDate: { $gte: sevenDaysAgo }
       }
     }
   ])
   ```

4. **Update Operations**
   ```javascript
   // SAFE: Mongoose update with conditions
   await User.findOneAndUpdate(
     { _id: userId },
     { $set: { currentStreak: newStreak } }
   )
   ```

### ✅ No Direct String Concatenation

**Verified:** No database queries use string concatenation or template literals to build queries.

### ✅ No eval() or Function() Calls

**Verified:** No dynamic code execution in database queries.

### ✅ Operator Injection Prevention

**Protected Against:**
- `$where` operator injection
- `$ne` (not equal) injection
- `$gt`, `$lt` comparison operator injection
- `$regex` injection
- `$in`, `$nin` array operator injection

**How:** The `sanitizeMongoQuery` function strips all keys starting with `$`.

## Attack Scenarios & Mitigations

### Scenario 1: Login Bypass Attempt

**Attack:**
```json
{
  "email": { "$ne": null },
  "password": { "$ne": null }
}
```

**Mitigation:**
1. `preventNoSQLInjection` middleware strips `$ne` operators
2. Mongoose schema expects string type for email
3. Validation middleware enforces email format

**Result:** Attack fails, returns validation error

### Scenario 2: Query Operator Injection

**Attack:**
```json
{
  "userId": { "$gt": "" }
}
```

**Mitigation:**
1. `sanitizeMongoQuery` removes `$gt` key
2. `isMongoId()` validation rejects non-ObjectId format
3. Mongoose type checking enforces ObjectId type

**Result:** Attack fails, returns validation error

### Scenario 3: JavaScript Execution Attempt

**Attack:**
```json
{
  "email": "user@example.com",
  "$where": "this.password.length > 0"
}
```

**Mitigation:**
1. `preventNoSQLInjection` strips `$where` key
2. Mongoose doesn't execute arbitrary JavaScript
3. Query only uses whitelisted fields

**Result:** Attack fails, `$where` is removed

### Scenario 4: Nested Field Injection

**Attack:**
```json
{
  "user.isAdmin": true
}
```

**Mitigation:**
1. `sanitizeMongoQuery` removes keys containing `.`
2. Mongoose schema doesn't have nested `user.isAdmin` field
3. Only defined schema fields are queryable

**Result:** Attack fails, key is stripped

## Additional Security Measures

### 1. Authentication Required

Most endpoints require JWT authentication:
```javascript
router.post("/task", authenticateToken, ...)
```

This ensures:
- User identity is verified
- Queries are scoped to authenticated user
- No anonymous query injection

### 2. User Scoping

All queries include user ID from JWT:
```javascript
const task = await HabitTask.findOne({
  _id: taskId,
  userId: req.user.userId  // From JWT, not user input
})
```

This prevents:
- Cross-user data access
- Privilege escalation
- Data leakage

### 3. Rate Limiting

All endpoints have rate limiting:
- Prevents brute force injection attempts
- Limits attack surface
- Reduces automated attack effectiveness

### 4. Input Length Limits

All string inputs have maximum length validation:
- Prevents buffer overflow attempts
- Limits payload size
- Reduces DoS attack surface

## Testing Recommendations

### Manual Testing

1. **Test operator injection:**
   ```bash
   curl -X POST /api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": {"$ne": null}, "password": {"$ne": null}}'
   ```
   Expected: 400 Bad Request with validation error

2. **Test $where injection:**
   ```bash
   curl -X GET /api/plan/daily?date=2024-01-01&$where=true \
     -H "Authorization: Bearer <token>"
   ```
   Expected: Query executes without $where operator

3. **Test nested field injection:**
   ```bash
   curl -X PATCH /api/user/profile \
     -H "Authorization: Bearer <token>" \
     -d '{"user.isAdmin": true}'
   ```
   Expected: Field is ignored, not updated

### Automated Testing

Add integration tests for injection prevention:

```javascript
describe("NoSQL Injection Prevention", () => {
  it("should reject $ne operator in login", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: { $ne: null }, password: { $ne: null } })
    
    expect(res.status).toBe(400)
  })
  
  it("should strip $where from queries", async () => {
    const res = await request(app)
      .get("/api/plan/daily")
      .query({ date: "2024-01-01", $where: "true" })
      .set("Authorization", `Bearer ${token}`)
    
    // Should execute without error, $where ignored
    expect(res.status).toBe(200)
  })
})
```

## Conclusion

The focusaint backend is protected against NoSQL injection through:

1. ✅ Mongoose schema validation
2. ✅ Parameterized queries (no string concatenation)
3. ✅ Operator sanitization middleware
4. ✅ Input validation with express-validator
5. ✅ ObjectId format validation
6. ✅ User scoping in queries
7. ✅ Authentication requirements
8. ✅ Rate limiting

**SQL Injection:** Not applicable (MongoDB, not SQL database)

**NoSQL Injection:** Comprehensively mitigated

## References

- [OWASP NoSQL Injection](https://owasp.org/www-community/attacks/NoSQL_injection)
- [Mongoose Security Best Practices](https://mongoosejs.com/docs/tutorials/query_casting.html)
- [MongoDB Security Checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)

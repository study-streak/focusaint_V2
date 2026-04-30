# Focusdle Backend API Documentation

## Overview
This document describes all backend API endpoints implemented in the Express server.

- Runtime: Node.js + Express
- Base API prefix: `/api`
- Content type: `application/json` unless stated otherwise
- Auth: JWT Bearer token for protected routes

## Base URLs
Use the environment-specific server URL, for example:

- Local: `http://localhost:5000`
- Production: your deployed backend URL

Examples in this document use relative paths such as `/api/auth/login`.

## Authentication
Protected endpoints require:

- Header: `Authorization: Bearer <jwt-token>`

JWT is issued by:

- `POST /api/auth/login`
- `POST /api/auth/verify-otp`

## CSRF
CSRF flow exists in middleware with token endpoint:

- `GET /api/csrf-token`

Current behavior in code:

- CSRF validation middleware is temporarily bypassed (always passes).
- Token cookie/header pattern is present and may be re-enabled later.

## Rate Limiting
Global and route-level rate limiting is enabled.

### Global
Applied to all `/api/*` routes:

- Window: 1 minute
- Max: 100 requests

### Route-specific

- Auth login: 5 requests / 15 minutes
- Auth signup: 3 requests / hour
- Auth OTP (verify/resend): 5 requests / 15 minutes
- Auth password reset routes: 3 requests / hour
- AI routes: 20 requests / hour
- Habit session create/log routes: 10 requests / minute
- File upload limiter exists in middleware but is not currently attached to a route

### 429 Response Shape
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later.",
    "details": {
      "limit": 100,
      "windowMs": 60000,
      "retryAfter": 60
    },
    "timestamp": "2026-04-14T10:00:00.000Z",
    "requestId": "..."
  }
}
```

## Error Response Formats
Two patterns are currently in use.

### Standardized error handler format
```json
{
  "error": {
    "code": "SOME_ERROR_CODE",
    "message": "Human readable message",
    "details": {},
    "timestamp": "2026-04-14T10:00:00.000Z",
    "requestId": "..."
  }
}
```

### Legacy/simple format in some controllers
```json
{
  "error": "Message text"
}
```

## Common Data Models (API-facing)

### User (partial)
- `id`
- `email`
- `name`
- `learningGoal`
- `currentStreak`
- `longestStreak`
- `totalSessions`
- `subscriptionTier` (`free` | `premium`)

### Habit Session
- `_id`
- `userId`
- `startTime`
- `endTime`
- `duration` (minutes)
- `sessionDate`
- `status` (`active` | `completed` | `abandoned`)

### Habit Task
- `_id`
- `title`, `description`, `duration`, `category`
- `assignedDate` (`YYYY-MM-DD`)
- `monthYear` (`YYYY-MM`)
- `completed`, `completedAt`
- `attachments[]`
- `deadline`
- `distributedAcrossDays[]`
- `proctoredMode`, `proctoredPreset`, `proctoredSettings`, `proctoredSessions[]`

### Reminder
- `_id`
- `title`, `message`
- `scheduledTime`
- `recurrence` (`none` | `daily` | `weekly` | `custom`)
- `customRecurrence`
- `status` (`active` | `snoozed` | `dismissed` | `expired`)
- `preferences`
- `snoozeDuration`, `snoozeUntil`

---

## 1. System Endpoints

### GET /
Health ping for root route.

Response:
```json
{
  "message": "server is running fine"
}
```

### GET /api/csrf-token
Returns CSRF token (cookie + JSON payload).

Response:
```json
{
  "csrfToken": "..."
}
```

---

## 2. Authentication API (`/api/auth`)

### POST /api/auth/signup
Create user account and send OTP.

Body:
```json
{
  "email": "user@example.com",
  "password": "StrongPass1",
  "name": "User Name",
  "learningGoal": "optional"
}
```

Success (201):
```json
{
  "message": "Signup successful. We sent a verification code to your email.",
  "email": "user@example.com",
  "requiresVerification": true
}
```

### POST /api/auth/resend-otp
Resend OTP for pending verification.

Body:
```json
{
  "email": "user@example.com"
}
```

Success:
```json
{
  "message": "OTP resent to email",
  "email": "user@example.com"
}
```

### POST /api/auth/verify-otp
Verify OTP and issue JWT.

Body:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

Success:
```json
{
  "message": "Verification successful",
  "token": "<jwt>",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "User Name",
    "learningGoal": "...",
    "currentStreak": 0
  }
}
```

### POST /api/auth/login
Password login; if email unverified, returns 403 with verification requirement.

Body:
```json
{
  "email": "user@example.com",
  "password": "StrongPass1"
}
```

Success:
```json
{
  "message": "Login successful",
  "token": "<jwt>",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "User Name",
    "currentStreak": 0
  }
}
```

### POST /api/auth/forgot-password
Request password reset code/token.

Body:
```json
{
  "email": "user@example.com"
}
```

Success:
```json
{
  "message": "Password reset code sent to email"
}
```

### POST /api/auth/reset-password
Reset password using reset token.

Body:
```json
{
  "token": "<reset-token>",
  "newPassword": "NewStrongPass1"
}
```

Success:
```json
{
  "message": "Password reset successful"
}
```

---

## 3. User API (`/api/user`)

All endpoints require auth.

### GET /api/user/profile
Returns user profile and streak record.

### PUT /api/user/profile
Update profile fields.

Body (any subset):
```json
{
  "name": "Updated Name",
  "learningGoal": "...",
  "preferredStudyTime": "09:00",
  "modePreference": "habit"
}
```

### GET /api/user/dashboard
Returns dashboard aggregate payload:
- `user`
- `streak`
- `weeklySessions`

### GET /api/user/notification-preferences
Returns notification preference object.

### PUT /api/user/notification-preferences
Body (any subset):
```json
{
  "browserPermission": "granted",
  "enabled": true,
  "lastPromptedAt": "2026-04-14T10:00:00.000Z"
}
```

---

## 4. Habit Sessions API (`/api/habit`)

All endpoints require auth.

### POST /api/habit/start
Start active session.

Body (optional):
```json
{
  "minDurationMinutes": 25
}
```

Success (201): includes `session` and `sessionLimit`.

### POST /api/habit/:sessionId/end
End an active session by id.

Success:
- `message`
- `session`
- `duration`

### GET /api/habit/history
Query options:
- `startDate` (ISO)
- `endDate` (ISO)
- `daysBack` (integer)

Returns:
- `sessions[]`
- `tier`
- `dateRange`

### GET /api/habit/streak
Returns streak metrics and history.

### GET /api/habit/quota
Returns daily session limit and remaining quota.

### POST /api/habit/session
Log completed session directly.

Body:
```json
{
  "duration": 30,
  "mode": "habit"
}
```

Success (201): includes `session` and `sessionLimit`.

### GET /api/habit/stats
Returns aggregate stats:
- streak counters
- weekly counts
- totalDuration (hours)
- `weeklyData[]`

---

## 5. Plan / Task API (`/api/plan`)

All endpoints require auth.

### Attachment completion
- `PATCH /api/plan/task/:taskId/attachment/:attachmentId/complete`
- `PATCH /api/plan/task/:taskId/attachment/:attachmentId/uncomplete`

### Task CRUD
- `POST /api/plan/task`
- `GET /api/plan/daily?date=YYYY-MM-DD`
- `GET /api/plan/monthly?month=YYYY-MM`
- `PATCH /api/plan/task/:taskId/complete`
- `PATCH /api/plan/task/:taskId/uncomplete`
- `PATCH /api/plan/task/:taskId`
- `DELETE /api/plan/task/:taskId`

#### POST /api/plan/task body
```json
{
  "title": "Task name",
  "description": "Optional",
  "duration": 45,
  "category": "study",
  "assignedDate": "2026-04-14",
  "monthYear": "2026-04",
  "attachments": []
}
```

#### PATCH /api/plan/task/:taskId body (partial)
```json
{
  "title": "Updated",
  "description": "Updated",
  "duration": 30,
  "category": "coding",
  "assignedDate": "2026-04-15",
  "monthYear": "2026-04"
}
```

### Bulk operations
- `POST /api/plan/bulk`

Body:
```json
{
  "monthYear": "2026-04",
  "tasks": [
    {
      "title": "Task A",
      "duration": 25,
      "assignedDate": "2026-04-14"
    }
  ]
}
```

### Attachments
- `POST /api/plan/task/:taskId/attachment`
- `POST /api/plan/task/:taskId/attachment/upload` (multipart/form-data, field: `file`)
- `DELETE /api/plan/task/:taskId/attachment/:attachmentId`

#### Add attachment body
```json
{
  "type": "link",
  "name": "Reference",
  "url": "https://example.com",
  "fileSize": null,
  "mimeType": null
}
```

#### Upload attachment notes
- File size limit: 4 MB
- Saved to `/uploads` (or `/tmp/uploads` on Vercel)

### Deadline and distribution
- `POST /api/plan/task/:taskId/deadline`
- `POST /api/plan/task/:taskId/distribute`

#### Deadline body
```json
{
  "deadline": "2026-04-20",
  "proctoredMode": true,
  "proctoredPreset": "deep",
  "proctoredSettings": {
    "requireFullScreen": true,
    "disableCopyPaste": true
  }
}
```

#### Distribution body
```json
{
  "distributedAcrossDays": [
    { "date": "2026-04-14", "portion": 50 },
    { "date": "2026-04-15", "portion": 50 }
  ]
}
```

### Proctored mode
- `GET /api/plan/task/:taskId/proctored`
- `POST /api/plan/task/:taskId/proctored/start`
- `POST /api/plan/task/:taskId/proctored/end`

#### Start body
```json
{
  "attachmentId": "...",
  "mode": "quick",
  "proctoredPreset": "quick"
}
```

#### End body
```json
{
  "attachmentId": "...",
  "violations": ["left_fullscreen"],
  "duration": 12
}
```

---

## 6. AI API (`/api/ai`)

All endpoints require auth. Most endpoints are also rate-limited by AI limiter and daily token quota.

### GET /api/ai/token-usage
Returns current daily token usage and 30-day stats.

### POST /api/ai/study-assistant
Body:
```json
{
  "mode": "analyze",
  "videoUrl": "https://youtube.com/watch?v=...",
  "message": "optional for chat mode",
  "summary": []
}
```

Success:
- Analyze mode: study pack object
- Chat mode: `{ "reply": "..." }`

### POST /api/ai/study-pack
Body:
```json
{
  "videoUrl": "https://youtube.com/watch?v=..."
}
```

### POST /api/ai/summary
Body:
```json
{
  "videoUrl": "https://youtube.com/watch?v=..."
}
```

Response:
```json
{
  "summary": ["..."]
}
```

### POST /api/ai/quiz
Body:
```json
{
  "videoUrl": "https://youtube.com/watch?v=..."
}
```

Response:
```json
{
  "quiz": ["..."]
}
```

### POST /api/ai/flashcards
Body:
```json
{
  "videoUrl": "https://youtube.com/watch?v=..."
}
```

Response:
```json
{
  "flashcards": [
    { "front": "...", "back": "..." }
  ]
}
```

### POST /api/ai/infographics
Body:
```json
{
  "videoUrl": "https://youtube.com/watch?v=..."
}
```

Response:
```json
{
  "infographics": ["..."]
}
```

### POST /api/ai/chat
Body:
```json
{
  "videoUrl": "https://youtube.com/watch?v=...",
  "message": "Explain backpropagation simply",
  "summary": ["optional context"]
}
```

Response:
```json
{
  "reply": "..."
}
```

### AI token limit exceeded response (403)
```json
{
  "error": "TOKEN_LIMIT_EXCEEDED",
  "message": "Daily LLM token limit exceeded. Resets at midnight UTC.",
  "details": {
    "used": 12000,
    "limit": 12000,
    "resetAt": "2026-04-15T00:00:00.000Z"
  }
}
```

---

## 7. Quiz API (`/api/quiz`)

All endpoints require auth.

### POST /api/quiz/generate
Generate MCQ quiz from video URL.

Body:
```json
{
  "videoUrl": "https://youtube.com/watch?v=...",
  "questionCount": 5
}
```

Response:
```json
{
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 1
    }
  ],
  "metadata": {
    "title": "...",
    "authorName": "..."
  }
}
```

### POST /api/quiz/submit
Submit quiz answers and store result.

Body:
```json
{
  "sessionId": "optional-session-id",
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 1,
      "userAnswer": 2
    }
  ]
}
```

Response includes score summary and per-question correctness.

### GET /api/quiz/analytics?days=30
Returns analytics aggregate for selected period.

### GET /api/quiz/history?limit=10&skip=0
Returns paginated quiz history.

---

## 8. Focus Score API (`/api/focus-score`)

All endpoints require auth.

- `GET /api/focus-score/`
- `POST /api/focus-score/update`
- `GET /api/focus-score/rank`
- `GET /api/focus-score/trend`

### GET /api/focus-score/
Returns score data merged with rank and trend.

### POST /api/focus-score/update
Triggers recalculation and returns updated score data.

---

## 9. Reminders API (`/api/reminders`)

All endpoints require auth and request validation.

### Route list
- `GET /api/reminders/due`
- `GET /api/reminders/upcoming`
- `POST /api/reminders/notified`
- `POST /api/reminders/`
- `GET /api/reminders/`
- `GET /api/reminders/:id`
- `PUT /api/reminders/:id`
- `DELETE /api/reminders/:id`
- `POST /api/reminders/:id/snooze`
- `POST /api/reminders/:id/dismiss`

### Create reminder
`POST /api/reminders/`

Body:
```json
{
  "title": "Study Session",
  "message": "Start chapter 3",
  "scheduledTime": "2026-04-15T09:00:00.000Z",
  "recurrence": "daily",
  "customRecurrence": {
    "daysOfWeek": [1, 3, 5],
    "interval": 1,
    "unit": "weeks"
  },
  "preferences": {
    "sound": true,
    "vibration": true,
    "badge": true
  },
  "snoozeDuration": 10
}
```

Success (201):
```json
{
  "success": true,
  "data": { "_id": "..." }
}
```

### List reminders
`GET /api/reminders/?status=active&upcoming=true`

Response:
```json
{
  "success": true,
  "data": [],
  "count": 0
}
```

### Mark reminders as notified
`POST /api/reminders/notified`

Body:
```json
{
  "reminderIds": ["id1", "id2"]
}
```

### Snooze reminder
`POST /api/reminders/:id/snooze`

Body:
```json
{
  "duration": 15
}
```

### Dismiss reminder
`POST /api/reminders/:id/dismiss`

For recurring reminders, this reschedules next occurrence.

---

## 10. Subscription API (`/api/subscription`)

### Public webhook
- `POST /api/subscription/webhook/dodo`

Body: webhook event payload from Dodo Payments.

### Protected routes
- `POST /api/subscription/create`
- `GET /api/subscription/status`
- `POST /api/subscription/cancel`
- `POST /api/subscription/reactivate`
- `POST /api/subscription/change-plan`

### POST /api/subscription/create
Body:
```json
{
  "plan": "premium_monthly"
}
```
Allowed plan values in controller:
- `premium_monthly`
- `premium_yearly`
- `free`

Possible response behaviors:
- Free plan: creates local subscription and returns success payload
- Premium plan: returns `checkout_url` for Dodo checkout redirect

### GET /api/subscription/status
Returns whether user has subscription and status metadata.

### POST /api/subscription/cancel
Cancels active subscription at period end.

### POST /api/subscription/reactivate
Reactivates pending cancellation.

### POST /api/subscription/change-plan
Body:
```json
{
  "newPlan": "premium_yearly"
}
```

---

## 11. Health / Monitoring API (`/api/health`)

Public endpoints:

- `GET /api/health/`
- `GET /api/health/detailed`
- `GET /api/health/metrics`
- `GET /api/health/ready`
- `GET /api/health/live`
- `GET /api/health/dashboard`

Legacy endpoint:

- `GET /api/health-legacy`

### GET /api/health/
Returns app + DB health.

### GET /api/health/detailed
Adds system/process metrics.

### GET /api/health/ready
Readiness probe:
- 200 when DB ready
- 503 otherwise

### GET /api/health/live
Liveness probe:
```json
{ "alive": true }
```

---

## 12. Request Examples

### Authenticated request example
```bash
curl -X GET "http://localhost:5000/api/user/profile" \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json"
```

### Multipart upload example
```bash
curl -X POST "http://localhost:5000/api/plan/task/<taskId>/attachment/upload" \
  -H "Authorization: Bearer <jwt>" \
  -F "file=@./notes.pdf" \
  -F "name=Chapter Notes"
```

---

## 13. Implementation Notes

- Some controllers use `req.user.userId`; others use `req.user.id`. JWT payload consistency should be validated in integration tests.
- Error response structure is mixed (standardized and legacy). Consumers should handle both patterns.
- CSRF middleware currently bypasses validation intentionally.
- `backend/routes/webhooks.js` exists but is empty.

---

## 14. Suggested Next Improvements

1. Publish OpenAPI 3.1 schema from this source document.
2. Add endpoint-level request/response validation tests.
3. Normalize all error payloads to one response contract.
4. Re-enable and test CSRF enforcement end-to-end.
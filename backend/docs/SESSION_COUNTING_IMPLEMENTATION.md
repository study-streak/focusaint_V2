# Session Counting Implementation

## Overview
The session counting system enforces daily session limits for users (especially free users) and tracks session activity for analytics and streaks.

## Key Features
- **Daily Session Limit**: Free users have a capped number of sessions per day.
- **Session Reset**: Session counts reset automatically at UTC midnight.
- **Session Tracking**: Each session is logged with timestamps and user association.
- **Quota Endpoint**: `/api/habit/quota` returns the remaining sessions for the day.
- **Streak Integration**: Session completion updates streaks and statistics.

## Implementation Details
- **Model**: `HabitSession` model stores session data with user, start, end, and status fields.
- **Middleware**: `sessionCreateLimiter` middleware enforces per-user daily limits.
- **Reset Job**: A scheduled job resets daily session counts for all users at midnight UTC.
- **API Endpoints**:
	- `POST /api/habit/start` — Start a new session (checks quota)
	- `POST /api/habit/session` — Log a completed session
	- `GET /api/habit/quota` — Get remaining sessions for the day

## Example Flow
1. User starts a session: `/api/habit/start`
2. Middleware checks if user has quota left
3. If allowed, session is created and tracked
4. On completion, session is logged and streaks are updated
5. At midnight UTC, all session counts reset

## Configuration
- Session limits and reset time are configurable via environment variables.

## Related Files
- `models/HabitSession.js`
- `middleware/rateLimit.js`
- `routes/habit.js`

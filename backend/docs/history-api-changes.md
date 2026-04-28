# History API - Date Range Filtering

## Overview
The `/api/habit/history` endpoint now supports tier-based date range filtering to enforce the 30-day history limit for free users while allowing unlimited history access for premium users.

## Changes Made

### Backend Controller (`backend/controllers/habit.controller.js`)
- Modified `getHistory` function to:
  - Check user's subscription tier
  - Apply tier-based date filtering
  - Support custom date range parameters
  - Return date range metadata in response

## API Usage

### Endpoint
```
GET /api/habit/history
```

### Query Parameters
- `startDate` (optional): ISO date string for custom start date
- `endDate` (optional): ISO date string for custom end date  
- `daysBack` (optional): Number of days to look back

### Tier-Based Behavior

#### Free Users
- **Default**: Last 30 days only
- **With parameters**: Cannot access data older than 30 days (enforced)
- **Example**: If `startDate=2023-01-01` is requested, it will be clamped to 30 days ago

#### Premium Users
- **Default**: All history (no date restriction)
- **With parameters**: Full access to any date range

### Response Format

```json
{
  "sessions": [...],
  "tier": "free" | "premium",
  "dateRange": {
    "start": "2024-01-01T00:00:00.000Z" | null,
    "end": "2024-01-31T23:59:59.999Z",
    "oldestAllowed": "2023-12-15T00:00:00.000Z" | null,
    "isLimited": true | false
  }
}
```

### Response Fields
- `sessions`: Array of session objects
- `tier`: User's subscription tier
- `dateRange.start`: Actual start date used in query (null if no restriction)
- `dateRange.end`: Actual end date used in query
- `dateRange.oldestAllowed`: Oldest date free users can access (null for premium)
- `dateRange.isLimited`: Whether history access is limited by tier

## Examples

### Example 1: Free User - Default Request
```bash
GET /api/habit/history
```
Returns last 30 days of sessions.

### Example 2: Free User - Custom Range (Clamped)
```bash
GET /api/habit/history?startDate=2023-01-01
```
Returns sessions from 30 days ago (not from 2023-01-01).

### Example 3: Premium User - Default Request
```bash
GET /api/habit/history
```
Returns all sessions (no date limit).

### Example 4: Premium User - Custom Range
```bash
GET /api/habit/history?startDate=2023-01-01&endDate=2023-12-31
```
Returns sessions from the specified date range.

### Example 5: Days Back Parameter
```bash
GET /api/habit/history?daysBack=7
```
Returns last 7 days of sessions (respects tier limits).

## Frontend Integration

The frontend should:
1. Check `dateRange.isLimited` to show upgrade prompts
2. Display `dateRange.oldestAllowed` to indicate history limits
3. Show upgrade CTA when free users try to access older data
4. Use the tier information to conditionally render UI elements

## Testing

To test the implementation:

1. **Free User Test**:
   - Create sessions older than 30 days
   - Request history without parameters
   - Verify only last 30 days are returned
   - Request with `startDate` older than 30 days
   - Verify date is clamped to 30 days ago

2. **Premium User Test**:
   - Create sessions across various dates
   - Request history without parameters
   - Verify all sessions are returned
   - Request with custom date ranges
   - Verify exact ranges are respected

## Database Indexes

The following indexes support efficient date range queries:
- `{ userId: 1, sessionDate: -1 }`
- `{ userId: 1, createdAt: -1 }`

These indexes are already defined in the HabitSession model.

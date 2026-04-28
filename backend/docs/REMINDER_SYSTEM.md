# Reminder System Implementation

## Overview

The reminder system allows users to schedule notifications for their study sessions and tasks. It supports one-time and recurring reminders with customizable preferences.

## Architecture

### Backend Components

1. **Reminder Model** (`models/Reminder.js`)
   - Stores reminder data in MongoDB
   - Supports recurring reminders (daily, weekly, custom)
   - Tracks reminder status (active, snoozed, dismissed, expired)
   - Includes preferences for sound, vibration, and badge

2. **Reminder Routes** (`routes/reminder.js`)
   - RESTful API endpoints for CRUD operations
   - Snooze and dismiss functionality
   - Input validation using express-validator

3. **Reminder Scheduler** (`services/reminderScheduler.js`)
   - Cron job that runs every minute
   - Checks for due reminders
   - Handles recurring reminder rescheduling
   - Cleans up old expired reminders

### Frontend Components

1. **Reminder Service** (`lib/reminder-service.ts`)
   - TypeScript service for API communication
   - Client-side validation
   - Helper methods for formatting and display

2. **useReminders Hook** (`lib/hooks/useReminders.ts`)
   - React hook for reminder management
   - Auto-fetch and polling support
   - State management for reminders

## API Endpoints

### Create Reminder
```
POST /api/reminders
Authorization: Bearer <token>

Body:
{
  "title": "Study Session",
  "message": "Time for your daily study session",
  "scheduledTime": "2024-03-15T14:00:00Z",
  "recurrence": "daily",
  "preferences": {
    "sound": true,
    "vibration": true,
    "badge": true
  },
  "snoozeDuration": 10
}
```

### Get All Reminders
```
GET /api/reminders?status=active&upcoming=true
Authorization: Bearer <token>
```

### Get Single Reminder
```
GET /api/reminders/:id
Authorization: Bearer <token>
```

### Update Reminder
```
PUT /api/reminders/:id
Authorization: Bearer <token>

Body:
{
  "title": "Updated Title",
  "scheduledTime": "2024-03-15T15:00:00Z"
}
```

### Delete Reminder
```
DELETE /api/reminders/:id
Authorization: Bearer <token>
```

### Snooze Reminder
```
POST /api/reminders/:id/snooze
Authorization: Bearer <token>

Body:
{
  "duration": 10  // minutes
}
```

### Dismiss Reminder
```
POST /api/reminders/:id/dismiss
Authorization: Bearer <token>
```

## Recurrence Types

### None (One-time)
```json
{
  "recurrence": "none"
}
```

### Daily
```json
{
  "recurrence": "daily"
}
```

### Weekly
```json
{
  "recurrence": "weekly"
}
```

### Custom - Specific Days of Week
```json
{
  "recurrence": "custom",
  "customRecurrence": {
    "daysOfWeek": [1, 3, 5]  // Monday, Wednesday, Friday
  }
}
```

### Custom - Interval-based
```json
{
  "recurrence": "custom",
  "customRecurrence": {
    "interval": 3,
    "unit": "days"  // or "weeks", "months"
  }
}
```

## Database Schema

```javascript
{
  userId: ObjectId,
  title: String,
  message: String,
  scheduledTime: Date,
  recurrence: String,  // 'none', 'daily', 'weekly', 'custom'
  customRecurrence: {
    daysOfWeek: [Number],
    interval: Number,
    unit: String
  },
  status: String,  // 'active', 'snoozed', 'dismissed', 'expired'
  preferences: {
    sound: Boolean,
    vibration: Boolean,
    badge: Boolean
  },
  snoozeUntil: Date,
  snoozeDuration: Number,
  lastTriggeredAt: Date,
  dismissedAt: Date,
  triggerCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Indexes

```javascript
// Single field indexes
{ userId: 1 }
{ scheduledTime: 1 }
{ status: 1 }

// Compound indexes
{ userId: 1, status: 1 }
{ userId: 1, scheduledTime: 1 }
{ status: 1, scheduledTime: 1 }
```

## Scheduler Behavior

### Reminder Processing
1. Every minute, the scheduler checks for due reminders
2. Reminders are considered due if:
   - Status is 'active' and scheduledTime <= now
   - Status is 'snoozed' and snoozeUntil <= now
3. When a reminder triggers:
   - `lastTriggeredAt` is updated
   - `triggerCount` is incremented
   - For recurring reminders, next occurrence is calculated
   - For one-time reminders, status is set to 'expired'

### Recurring Reminder Logic
- **Daily**: Adds 1 day to scheduledTime
- **Weekly**: Adds 7 days to scheduledTime
- **Custom (days of week)**: Finds next matching day of week
- **Custom (interval)**: Adds interval * unit to scheduledTime

### Cleanup
- Runs daily at 02:00 UTC
- Deletes expired reminders older than 30 days
- Prevents database bloat

## Frontend Usage

### Basic Usage
```typescript
import { useReminders } from '@/lib/hooks/useReminders';

function MyComponent() {
  const {
    reminders,
    loading,
    error,
    createReminder,
    updateReminder,
    deleteReminder,
    snoozeReminder,
    dismissReminder,
    dueReminders
  } = useReminders({
    autoFetch: true,
    pollInterval: 60000, // Poll every minute
    filters: { status: 'active' }
  });

  // Create a reminder
  const handleCreate = async () => {
    await createReminder({
      title: 'Study Time',
      scheduledTime: new Date(Date.now() + 3600000).toISOString(),
      recurrence: 'daily'
    });
  };

  // Snooze a reminder
  const handleSnooze = async (id: string) => {
    await snoozeReminder(id, 10); // Snooze for 10 minutes
  };

  return (
    <div>
      {dueReminders.map(reminder => (
        <div key={reminder._id}>
          <h3>{reminder.title}</h3>
          <button onClick={() => handleSnooze(reminder._id)}>Snooze</button>
          <button onClick={() => dismissReminder(reminder._id)}>Dismiss</button>
        </div>
      ))}
    </div>
  );
}
```

### Direct Service Usage
```typescript
import { ReminderService } from '@/lib/reminder-service';

// Create reminder
const reminder = await ReminderService.createReminder({
  title: 'Study Session',
  scheduledTime: '2024-03-15T14:00:00Z',
  recurrence: 'daily'
});

// Get upcoming reminders
const upcoming = await ReminderService.getUpcomingReminders();

// Format time
const timeStr = ReminderService.formatReminderTime(reminder.scheduledTime);
// Returns: "In 2 hours" or "In 3 days"

// Get recurrence description
const recurrence = ReminderService.getRecurrenceDescription(reminder);
// Returns: "Daily" or "Every Mon, Wed, Fri"
```

## Integration with Notification System

The reminder system works in conjunction with the browser notification system:

1. User grants notification permissions (Task 7.1.1)
2. Reminders are scheduled via the API
3. Backend scheduler marks reminders as due
4. Frontend polls for due reminders or receives WebSocket updates
5. Frontend triggers browser notifications using the Notification API
6. User can snooze or dismiss from the notification

## Security Considerations

1. **Authentication**: All endpoints require JWT authentication
2. **Authorization**: Users can only access their own reminders
3. **Input Validation**: All inputs are validated on both client and server
4. **Rate Limiting**: API endpoints are protected by rate limiters
5. **CSRF Protection**: State-changing requests require CSRF tokens

## Performance Considerations

1. **Indexes**: Compound indexes optimize common queries
2. **Polling**: Frontend can poll at configurable intervals
3. **Batch Processing**: Scheduler processes reminders in batches
4. **Cleanup**: Old reminders are automatically deleted
5. **Caching**: Consider adding Redis caching for frequently accessed reminders

## Future Enhancements

1. **WebSocket Support**: Real-time reminder notifications
2. **Smart Scheduling**: AI-based optimal reminder times
3. **Reminder Templates**: Pre-configured reminder patterns
4. **Reminder Groups**: Organize reminders by category
5. **Reminder Analytics**: Track reminder effectiveness
6. **Push Notifications**: Mobile app support
7. **Email Reminders**: Fallback for browser notifications
8. **Reminder Sharing**: Share reminders with accountability groups

## Testing

### Unit Tests
- Test reminder model methods (shouldTrigger, calculateNextOccurrence)
- Test validation logic
- Test recurrence calculations

### Integration Tests
- Test API endpoints
- Test authentication and authorization
- Test recurring reminder scheduling

### E2E Tests
- Test complete reminder lifecycle
- Test snooze and dismiss flows
- Test recurring reminder behavior

## Troubleshooting

### Reminders Not Triggering
1. Check if reminder scheduler is running
2. Verify scheduledTime is in the past
3. Check reminder status (should be 'active' or 'snoozed')
4. Review scheduler logs for errors

### Recurring Reminders Not Rescheduling
1. Verify recurrence type is set correctly
2. Check customRecurrence configuration
3. Review calculateNextOccurrence logic
4. Check for errors in scheduler logs

### Performance Issues
1. Check database indexes are created
2. Monitor scheduler execution time
3. Consider reducing polling frequency
4. Implement caching for frequently accessed data

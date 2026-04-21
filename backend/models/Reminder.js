import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
    recurrence: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'custom'],
      default: 'none',
    },
    customRecurrence: {
      daysOfWeek: [{
        type: Number,
        min: 0,
        max: 6, // 0 = Sunday, 6 = Saturday
      }],
      interval: {
        type: Number,
        min: 1,
      },
      unit: {
        type: String,
        enum: ['days', 'weeks', 'months'],
      },
    },
    status: {
      type: String,
      enum: ['active', 'snoozed', 'dismissed', 'expired'],
      default: 'active',
    },
    preferences: {
      sound: {
        type: Boolean,
        default: true,
      },
      vibration: {
        type: Boolean,
        default: true,
      },
      badge: {
        type: Boolean,
        default: true,
      },
    },
    snoozeUntil: {
      type: Date,
      default: null,
    },
    snoozeDuration: {
      type: Number, // in minutes
      default: 10,
    },
    lastTriggeredAt: {
      type: Date,
      default: null,
    },
    dismissedAt: {
      type: Date,
      default: null,
    },
    triggerCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
reminderSchema.index({ userId: 1, status: 1 });
reminderSchema.index({ userId: 1, scheduledTime: 1 });
reminderSchema.index({ status: 1, scheduledTime: 1 });

// Method to check if reminder should trigger
reminderSchema.methods.shouldTrigger = function() {
  const now = new Date();
  
  // Check if snoozed
  if (this.status === 'snoozed' && this.snoozeUntil) {
    if (now < this.snoozeUntil) {
      return false;
    }
    // Snooze period ended, reactivate
    this.status = 'active';
  }
  
  // Check if active and time has come
  if (this.status === 'active' && now >= this.scheduledTime) {
    return true;
  }
  
  return false;
};

// Method to calculate next occurrence for recurring reminders
reminderSchema.methods.calculateNextOccurrence = function() {
  const current = this.scheduledTime;
  let next = new Date(current);
  
  switch (this.recurrence) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
      
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
      
    case 'custom':
      if (this.customRecurrence.unit === 'days' && this.customRecurrence.interval) {
        next.setDate(next.getDate() + this.customRecurrence.interval);
      } else if (this.customRecurrence.unit === 'weeks' && this.customRecurrence.interval) {
        next.setDate(next.getDate() + (this.customRecurrence.interval * 7));
      } else if (this.customRecurrence.unit === 'months' && this.customRecurrence.interval) {
        next.setMonth(next.getMonth() + this.customRecurrence.interval);
      } else if (this.customRecurrence.daysOfWeek && this.customRecurrence.daysOfWeek.length > 0) {
        // Find next day of week
        const currentDay = next.getDay();
        const sortedDays = [...this.customRecurrence.daysOfWeek].sort((a, b) => a - b);
        
        let nextDay = sortedDays.find(day => day > currentDay);
        if (!nextDay) {
          // Wrap to next week
          nextDay = sortedDays[0];
          next.setDate(next.getDate() + (7 - currentDay + nextDay));
        } else {
          next.setDate(next.getDate() + (nextDay - currentDay));
        }
      }
      break;
      
    default:
      return null; // No recurrence
  }
  
  return next;
};

// Method to snooze reminder
reminderSchema.methods.snooze = function(durationMinutes) {
  this.status = 'snoozed';
  this.snoozeUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
  this.snoozeDuration = durationMinutes;
  return this.save();
};

// Method to dismiss reminder
reminderSchema.methods.dismiss = function() {
  this.status = 'dismissed';
  this.dismissedAt = new Date();
  
  // If recurring, schedule next occurrence
  if (this.recurrence !== 'none') {
    const nextTime = this.calculateNextOccurrence();
    if (nextTime) {
      this.scheduledTime = nextTime;
      this.status = 'active';
      this.dismissedAt = null;
    }
  }
  
  return this.save();
};

// Method to mark as triggered
reminderSchema.methods.markTriggered = function() {
  this.lastTriggeredAt = new Date();
  this.triggerCount += 1;
  return this.save();
};

export default mongoose.model('Reminder', reminderSchema);

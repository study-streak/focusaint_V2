import cron from 'node-cron';
import Reminder from '../models/Reminder.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * Reminder Scheduler Service
 * Checks for due reminders every minute and processes them
 */
class ReminderScheduler {
  constructor() {
    this.job = null;
    this.isRunning = false;
  }

  /**
   * Start the reminder scheduler
   * Runs every minute to check for due reminders
   */
  start() {
    if (this.isRunning) {
      logger.warn('Reminder scheduler is already running');
      return;
    }

    // Run every minute
    this.job = cron.schedule('* * * * *', async () => {
      await this.checkAndProcessReminders();
    });

    this.isRunning = true;
    logger.info('Reminder scheduler started');
  }

  /**
   * Stop the reminder scheduler
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.isRunning = false;
      logger.info('Reminder scheduler stopped');
    }
  }

  /**
   * Check for due reminders and process them
   */
  async checkAndProcessReminders() {
    try {
      const now = new Date();
      
      // Find all active or snoozed reminders that should trigger
      const dueReminders = await Reminder.find({
        $or: [
          {
            status: 'active',
            scheduledTime: { $lte: now },
          },
          {
            status: 'snoozed',
            snoozeUntil: { $lte: now },
          },
        ],
      }).populate('userId', 'email name notificationPreferences');

      if (dueReminders.length === 0) {
        return;
      }

      logger.info(`Processing ${dueReminders.length} due reminders`);

      for (const reminder of dueReminders) {
        await this.processReminder(reminder);
      }
    } catch (error) {
      logger.error('Error checking reminders', {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Process a single reminder
   * @param {Object} reminder - The reminder document
   */
  async processReminder(reminder) {
    try {
      // Check if user has notifications enabled
      const user = reminder.userId;
      
      if (!user) {
        logger.warn('User not found for reminder', { reminderId: reminder._id });
        return;
      }

      // Mark as triggered
      await reminder.markTriggered();

      // Log the reminder trigger
      logger.info('Reminder triggered', {
        reminderId: reminder._id,
        userId: user._id,
        title: reminder.title,
        scheduledTime: reminder.scheduledTime,
        notificationsEnabled: user.notificationPreferences?.enabled,
      });

      // If recurring, schedule next occurrence
      if (reminder.recurrence !== 'none') {
        const nextTime = reminder.calculateNextOccurrence();
        if (nextTime) {
          reminder.scheduledTime = nextTime;
          reminder.status = 'active';
          await reminder.save();
          
          logger.info('Recurring reminder rescheduled', {
            reminderId: reminder._id,
            nextScheduledTime: nextTime,
          });
        }
      } else {
        // Mark as expired for non-recurring reminders
        reminder.status = 'expired';
        await reminder.save();
      }

      // Note: Actual browser notification sending will be handled by the frontend
      // via WebSocket or polling mechanism. This service just marks reminders as due.
      
    } catch (error) {
      logger.error('Error processing reminder', {
        reminderId: reminder._id,
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Get upcoming reminders for a user
   * @param {String} userId - User ID
   * @param {Number} hours - Number of hours to look ahead (default: 24)
   * @returns {Array} Array of upcoming reminders
   */
  async getUpcomingReminders(userId, hours = 24) {
    try {
      const now = new Date();
      const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

      const reminders = await Reminder.find({
        userId,
        status: { $in: ['active', 'snoozed'] },
        $or: [
          {
            status: 'active',
            scheduledTime: { $gte: now, $lte: futureTime },
          },
          {
            status: 'snoozed',
            snoozeUntil: { $gte: now, $lte: futureTime },
          },
        ],
      }).sort({ scheduledTime: 1 });

      return reminders;
    } catch (error) {
      logger.error('Error getting upcoming reminders', {
        userId,
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Get overdue reminders for a user
   * @param {String} userId - User ID
   * @returns {Array} Array of overdue reminders
   */
  async getOverdueReminders(userId) {
    try {
      const now = new Date();

      const reminders = await Reminder.find({
        userId,
        status: 'active',
        scheduledTime: { $lt: now },
        lastTriggeredAt: null, // Not yet triggered
      }).sort({ scheduledTime: 1 });

      return reminders;
    } catch (error) {
      logger.error('Error getting overdue reminders', {
        userId,
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Clean up old expired reminders
   * Removes expired reminders older than 30 days
   */
  async cleanupExpiredReminders() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Reminder.deleteMany({
        status: 'expired',
        updatedAt: { $lt: thirtyDaysAgo },
      });

      if (result.deletedCount > 0) {
        logger.info('Cleaned up expired reminders', {
          count: result.deletedCount,
        });
      }
    } catch (error) {
      logger.error('Error cleaning up expired reminders', {
        error: error.message,
      });
    }
  }
}

// Create singleton instance
const reminderScheduler = new ReminderScheduler();

export default reminderScheduler;

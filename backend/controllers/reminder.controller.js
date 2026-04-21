import Reminder from '../models/Reminder.js';
import logger from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

function getAuthenticatedUserId(req) {
  return req.user?.userId || req.user?.id;
}

/**
 * Create a new reminder
 */
export async function createReminder(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    const {
      title,
      message,
      scheduledTime,
      recurrence = 'none',
      customRecurrence,
      preferences,
      snoozeDuration,
    } = req.body;

    const reminder = new Reminder({
      userId,
      title,
      message,
      scheduledTime: new Date(scheduledTime),
      recurrence,
      customRecurrence,
      preferences,
      snoozeDuration,
    });

    await reminder.save();

    logger.info('Reminder created', {
      userId,
      reminderId: reminder._id,
      scheduledTime: reminder.scheduledTime,
    });

    res.status(201).json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all reminders for the authenticated user
 */
export async function getReminders(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    const { status, upcoming } = req.query;
    const filter = { userId };

    if (status) {
      filter.status = status;
    }

    if (upcoming === 'true') {
      filter.scheduledTime = { $gte: new Date() };
      filter.status = { $in: ['active', 'snoozed'] };
    }

    const reminders = await Reminder.find(filter)
      .sort({ scheduledTime: 1 })
      .lean();

    res.json({
      success: true,
      data: reminders,
      count: reminders.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get due reminders for the authenticated user
 */
export async function getDueReminders(req, res, next) {
  try {
    const now = new Date();
    const userId = getAuthenticatedUserId(req);

    // Find active reminders that are due
    const activeReminders = await Reminder.find({
      userId,
      status: 'active',
      scheduledTime: { $lte: now },
    })
      .sort({ scheduledTime: 1 })
      .lean();

    // Find snoozed reminders where snooze period has ended
    const snoozedReminders = await Reminder.find({
      userId,
      status: 'snoozed',
      snoozeUntil: { $lte: now },
    })
      .sort({ snoozeUntil: 1 })
      .lean();

    const dueReminders = [...activeReminders, ...snoozedReminders];

    logger.info('Due reminders fetched', {
      userId,
      count: dueReminders.length,
      activeCount: activeReminders.length,
      snoozedCount: snoozedReminders.length,
    });

    res.json({
      success: true,
      data: dueReminders,
      count: dueReminders.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get upcoming reminders (next 24 hours)
 */
export async function getUpcomingReminders(req, res, next) {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const userId = getAuthenticatedUserId(req);

    const upcomingReminders = await Reminder.find({
      userId,
      status: { $in: ['active', 'snoozed'] },
      $or: [
        {
          status: 'active',
          scheduledTime: { $gte: now, $lte: tomorrow },
        },
        {
          status: 'snoozed',
          snoozeUntil: { $gte: now, $lte: tomorrow },
        },
      ],
    })
      .sort({ scheduledTime: 1 })
      .lean();

    res.json({
      success: true,
      data: upcomingReminders,
      count: upcomingReminders.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a specific reminder
 */
export async function getReminder(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      userId,
    });

    if (!reminder) {
      throw new ValidationError('Reminder not found');
    }

    res.json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a reminder
 */
export async function updateReminder(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      userId,
    });

    if (!reminder) {
      throw new ValidationError('Reminder not found');
    }

    // Update allowed fields
    const allowedUpdates = [
      'title',
      'message',
      'scheduledTime',
      'recurrence',
      'customRecurrence',
      'preferences',
      'snoozeDuration',
      'status',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'scheduledTime') {
          reminder[field] = new Date(req.body[field]);
        } else {
          reminder[field] = req.body[field];
        }
      }
    });

    await reminder.save();

    logger.info('Reminder updated', {
      userId,
      reminderId: reminder._id,
    });

    res.json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a reminder
 */
export async function deleteReminder(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    const reminder = await Reminder.findOneAndDelete({
      _id: req.params.id,
      userId,
    });

    if (!reminder) {
      throw new ValidationError('Reminder not found');
    }

    logger.info('Reminder deleted', {
      userId,
      reminderId: reminder._id,
    });

    res.json({
      success: true,
      message: 'Reminder deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Snooze a reminder
 */
export async function snoozeReminder(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      userId,
    });

    if (!reminder) {
      throw new ValidationError('Reminder not found');
    }

    await reminder.snooze(req.body.duration);

    logger.info('Reminder snoozed', {
      userId,
      reminderId: reminder._id,
      duration: req.body.duration,
      snoozeUntil: reminder.snoozeUntil,
    });

    res.json({
      success: true,
      data: reminder,
      message: `Reminder snoozed for ${req.body.duration} minutes`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Dismiss a reminder
 */
export async function dismissReminder(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      userId,
    });

    if (!reminder) {
      throw new ValidationError('Reminder not found');
    }

    await reminder.dismiss();

    logger.info('Reminder dismissed', {
      userId,
      reminderId: reminder._id,
      wasRecurring: reminder.recurrence !== 'none',
      nextScheduledTime: reminder.status === 'active' ? reminder.scheduledTime : null,
    });

    res.json({
      success: true,
      data: reminder,
      message: reminder.recurrence !== 'none' 
        ? 'Reminder dismissed and rescheduled for next occurrence'
        : 'Reminder dismissed',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark reminders as notified (track delivery)
 */
export async function markRemindersAsNotified(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    const { reminderIds } = req.body;

    if (!Array.isArray(reminderIds) || reminderIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'reminderIds must be a non-empty array',
      });
    }

    // Update reminders to mark them as triggered
    const updatePromises = reminderIds.map(async (reminderId) => {
      const reminder = await Reminder.findOne({
        _id: reminderId,
        userId,
      });

      if (reminder) {
        await reminder.markTriggered();
      }
    });

    await Promise.all(updatePromises);

    logger.info('Reminders marked as notified', {
      userId,
      count: reminderIds.length,
    });

    res.json({
      success: true,
      message: `${reminderIds.length} reminder(s) marked as notified`,
    });
  } catch (error) {
    next(error);
  }
}

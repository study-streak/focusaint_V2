import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';
import * as reminderController from '../controllers/reminder.controller.js';

const router = express.Router();

// Validation schemas
const createReminderValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title must be 100 characters or less'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must be 500 characters or less'),
  body('scheduledTime')
    .notEmpty()
    .withMessage('Scheduled time is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const scheduledDate = new Date(value);
      if (scheduledDate <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }
      return true;
    }),
  body('recurrence')
    .optional()
    .isIn(['none', 'daily', 'weekly', 'custom'])
    .withMessage('Invalid recurrence type'),
  body('customRecurrence.daysOfWeek')
    .optional()
    .isArray()
    .withMessage('Days of week must be an array'),
  body('customRecurrence.daysOfWeek.*')
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage('Invalid day of week'),
  body('customRecurrence.interval')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Interval must be at least 1'),
  body('customRecurrence.unit')
    .optional()
    .isIn(['days', 'weeks', 'months'])
    .withMessage('Invalid recurrence unit'),
  body('preferences.sound')
    .optional()
    .isBoolean()
    .withMessage('Sound preference must be boolean'),
  body('preferences.vibration')
    .optional()
    .isBoolean()
    .withMessage('Vibration preference must be boolean'),
  body('preferences.badge')
    .optional()
    .isBoolean()
    .withMessage('Badge preference must be boolean'),
  body('snoozeDuration')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Snooze duration must be between 1 and 1440 minutes'),
];

const updateReminderValidation = [
  param('id').isMongoId().withMessage('Invalid reminder ID'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Title must be 100 characters or less'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must be 500 characters or less'),
  body('scheduledTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('recurrence')
    .optional()
    .isIn(['none', 'daily', 'weekly', 'custom'])
    .withMessage('Invalid recurrence type'),
  body('status')
    .optional()
    .isIn(['active', 'snoozed', 'dismissed', 'expired'])
    .withMessage('Invalid status'),
];

const queryValidation = [
  query('status')
    .optional()
    .isIn(['active', 'snoozed', 'dismissed', 'expired'])
    .withMessage('Invalid status filter'),
  query('upcoming')
    .optional()
    .isBoolean()
    .withMessage('Upcoming must be boolean'),
];

const snoozeValidation = [
  param('id').isMongoId().withMessage('Invalid reminder ID'),
  body('duration')
    .notEmpty()
    .withMessage('Duration is required')
    .isInt({ min: 1, max: 1440 })
    .withMessage('Duration must be between 1 and 1440 minutes'),
];

// Routes - specific routes first, then general routes
// Get due reminders (must be before /:id route)
router.get('/due', authenticateToken, reminderController.getDueReminders);

// Get upcoming reminders (must be before /:id route)
router.get('/upcoming', authenticateToken, reminderController.getUpcomingReminders);

// Mark reminders as notified
router.post('/notified', authenticateToken, reminderController.markRemindersAsNotified);

// CRUD operations
router.post('/', authenticateToken, createReminderValidation, handleValidationErrors, reminderController.createReminder);
router.get('/', authenticateToken, queryValidation, handleValidationErrors, reminderController.getReminders);
router.get('/:id', authenticateToken, [param('id').isMongoId()], handleValidationErrors, reminderController.getReminder);
router.put('/:id', authenticateToken, updateReminderValidation, handleValidationErrors, reminderController.updateReminder);
router.delete('/:id', authenticateToken, [param('id').isMongoId()], handleValidationErrors, reminderController.deleteReminder);

// Action routes
router.post('/:id/snooze', authenticateToken, snoozeValidation, handleValidationErrors, reminderController.snoozeReminder);
router.post('/:id/dismiss', authenticateToken, [param('id').isMongoId()], handleValidationErrors, reminderController.dismissReminder);

export default router;

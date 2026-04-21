import { body, param, query, validationResult } from "express-validator"

/**
 * Middleware to handle validation errors
 * Returns consistent error format for validation failures
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }))
    
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input data",
        details: formattedErrors,
        timestamp: new Date().toISOString(),
        requestId: req.id || "unknown"
      }
    })
  }
  
  next()
}

// ============================================
// AUTH ROUTE VALIDATIONS
// ============================================

export const validateSignup = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("Email must not exceed 255 characters"),
  
  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),
  
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Name can only contain letters, spaces, hyphens, and apostrophes"),
  
  body("learningGoal")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Learning goal must not exceed 500 characters"),
  
  handleValidationErrors
]

export const validateLogin = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  
  handleValidationErrors
]

export const validateVerifyOTP = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  
  body("otp")
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits")
    .isNumeric()
    .withMessage("OTP must contain only numbers"),
  
  handleValidationErrors
]

export const validateResendOTP = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  
  handleValidationErrors
]

// ============================================
// PASSWORD RESET VALIDATIONS
// ============================================

export const validateForgotPassword = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  
  handleValidationErrors
]

export const validateResetPassword = [
  body("token")
    .notEmpty()
    .withMessage("Reset token is required")
    .isLength({ max: 500 })
    .withMessage("Invalid token format"),
  
  body("newPassword")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),
  
  handleValidationErrors
]

// ============================================
// USER ROUTE VALIDATIONS
// ============================================

export const validateUpdateProfile = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Name can only contain letters, spaces, hyphens, and apostrophes"),
  
  body("learningGoal")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Learning goal must not exceed 500 characters"),
  
  body("preferredMode")
    .optional()
    .isIn(["quick", "deep", "proctored"])
    .withMessage("Invalid preferred mode"),
  
  handleValidationErrors
]

export const validateChangePassword = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  
  body("newPassword")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),
  
  handleValidationErrors
]

// ============================================
// HABIT SESSION VALIDATIONS
// ============================================

export const validateStartSession = [
  body("minDurationMinutes")
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage("Duration must be between 1 and 480 minutes"),
  
  handleValidationErrors
]

export const validateLogSession = [
  body("duration")
    .isInt({ min: 1, max: 480 })
    .withMessage("Duration must be between 1 and 480 minutes"),
  
  body("mode")
    .isIn(["quick", "deep", "proctored"])
    .withMessage("Invalid session mode"),
  
  handleValidationErrors
]

export const validateSessionId = [
  param("sessionId")
    .isMongoId()
    .withMessage("Invalid session ID format"),
  
  handleValidationErrors
]

export const validateHistoryQuery = [
  query("daysBack")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Days back must be between 1 and 365"),
  
  handleValidationErrors
]

// ============================================
// TASK/PLAN ROUTE VALIDATIONS
// ============================================

export const validateCreateTask = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
  
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must not exceed 2000 characters"),
  
  body("duration")
    .isInt({ min: 1, max: 480 })
    .withMessage("Duration must be between 1 and 480 minutes"),
  
  body("category")
    .optional()
    .isIn(["study", "work", "exercise", "reading", "other"])
    .withMessage("Invalid category"),
  
  body("assignedDate")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Date must be in YYYY-MM-DD format")
    .isISO8601()
    .withMessage("Invalid date format"),
  
  body("monthYear")
    .matches(/^\d{4}-\d{2}$/)
    .withMessage("Month must be in YYYY-MM format"),
  
  body("attachments")
    .optional()
    .isArray()
    .withMessage("Attachments must be an array"),
  
  body("attachments.*.type")
    .optional()
    .isIn(["file", "link"])
    .withMessage("Attachment type must be 'file' or 'link'"),
  
  body("attachments.*.name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Attachment name must be between 1 and 255 characters"),
  
  body("attachments.*.url")
    .optional()
    .trim()
    .isLength({ max: 2048 })
    .withMessage("Attachment URL must not exceed 2048 characters"),
  
  handleValidationErrors
]

export const validateUpdateTask = [
  param("taskId")
    .isMongoId()
    .withMessage("Invalid task ID format"),
  
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
  
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must not exceed 2000 characters"),
  
  body("duration")
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage("Duration must be between 1 and 480 minutes"),
  
  body("category")
    .optional()
    .isIn(["study", "work", "exercise", "reading", "other"])
    .withMessage("Invalid category"),
  
  body("assignedDate")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Date must be in YYYY-MM-DD format")
    .isISO8601()
    .withMessage("Invalid date format"),
  
  body("monthYear")
    .optional()
    .matches(/^\d{4}-\d{2}$/)
    .withMessage("Month must be in YYYY-MM format"),
  
  handleValidationErrors
]

export const validateTaskId = [
  param("taskId")
    .isMongoId()
    .withMessage("Invalid task ID format"),
  
  handleValidationErrors
]

export const validateDailyPlanQuery = [
  query("date")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Date must be in YYYY-MM-DD format")
    .isISO8601()
    .withMessage("Invalid date format"),
  
  handleValidationErrors
]

export const validateMonthlyPlanQuery = [
  query("month")
    .matches(/^\d{4}-\d{2}$/)
    .withMessage("Month must be in YYYY-MM format"),
  
  handleValidationErrors
]

export const validateBulkCreate = [
  body("monthYear")
    .matches(/^\d{4}-\d{2}$/)
    .withMessage("Month must be in YYYY-MM format"),
  
  body("tasks")
    .isArray({ min: 1, max: 100 })
    .withMessage("Tasks must be an array with 1-100 items"),
  
  body("tasks.*.title")
    .trim()
    .notEmpty()
    .withMessage("Each task must have a title")
    .isLength({ max: 200 })
    .withMessage("Task title must not exceed 200 characters"),
  
  body("tasks.*.duration")
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage("Duration must be between 1 and 480 minutes"),
  
  body("tasks.*.assignedDate")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Date must be in YYYY-MM-DD format"),
  
  handleValidationErrors
]

export const validateYouTubeRoutine = [
  body("playlistUrlOrId")
    .trim()
    .notEmpty()
    .withMessage("Playlist URL or ID is required")
    .isLength({ max: 500 })
    .withMessage("Playlist URL/ID must not exceed 500 characters"),
  
  body("days")
    .isInt({ min: 1, max: 365 })
    .withMessage("Days must be between 1 and 365"),
  
  body("startDate")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Start date must be in YYYY-MM-DD format")
    .isISO8601()
    .withMessage("Invalid date format"),
  
  body("createTasks")
    .optional()
    .isBoolean()
    .withMessage("createTasks must be a boolean"),
  
  body("durationPerVideo")
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage("Duration per video must be between 1 and 480 minutes"),
  
  handleValidationErrors
]

export const validateAddAttachment = [
  param("taskId")
    .isMongoId()
    .withMessage("Invalid task ID format"),
  
  body("type")
    .isIn(["file", "link"])
    .withMessage("Type must be 'file' or 'link'"),
  
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Name must be between 1 and 255 characters"),
  
  body("url")
    .trim()
    .notEmpty()
    .withMessage("URL is required")
    .isLength({ max: 2048 })
    .withMessage("URL must not exceed 2048 characters"),
  
  body("fileSize")
    .optional()
    .isInt({ min: 0, max: 10485760 })
    .withMessage("File size must be between 0 and 10MB"),
  
  body("mimeType")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("MIME type must not exceed 100 characters"),
  
  handleValidationErrors
]

export const validateAttachmentIds = [
  param("taskId")
    .isMongoId()
    .withMessage("Invalid task ID format"),
  
  param("attachmentId")
    .isMongoId()
    .withMessage("Invalid attachment ID format"),
  
  handleValidationErrors
]

// ============================================
// AI ROUTE VALIDATIONS
// ============================================

export const validateAIStudyAssistant = [
  body("mode")
    .optional()
    .isIn(["analyze", "chat"])
    .withMessage("Mode must be 'analyze' or 'chat'"),
  
  body("videoUrl")
    .trim()
    .notEmpty()
    .withMessage("Video URL is required")
    .isLength({ max: 2048 })
    .withMessage("Video URL must not exceed 2048 characters")
    .matches(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/)
    .withMessage("Must be a valid YouTube URL"),
  
  body("message")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Message must not exceed 2000 characters"),
  
  body("summary")
    .optional()
    .isArray()
    .withMessage("Summary must be an array"),
  
  handleValidationErrors
]

export const validateAIRequest = [
  body("videoUrl")
    .trim()
    .notEmpty()
    .withMessage("Video URL is required")
    .isLength({ max: 2048 })
    .withMessage("Video URL must not exceed 2048 characters")
    .matches(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/)
    .withMessage("Must be a valid YouTube URL"),
  
  handleValidationErrors
]

export const validateAIChat = [
  body("videoUrl")
    .trim()
    .notEmpty()
    .withMessage("Video URL is required")
    .isLength({ max: 2048 })
    .withMessage("Video URL must not exceed 2048 characters"),
  
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 1, max: 2000 })
    .withMessage("Message must be between 1 and 2000 characters"),
  
  body("summary")
    .optional()
    .isArray()
    .withMessage("Summary must be an array"),
  
  handleValidationErrors
]

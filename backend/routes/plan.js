import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import { authenticateToken } from "../middleware/auth.js"
import { fileUploadLimiter } from "../middleware/rateLimit.js"
import {
  markAttachmentComplete,
  unmarkAttachmentComplete,
  createTask,
  getDailyTasks,
  getMonthlyTasks,
  completeTask,
  uncompleteTask,
  updateTask,
  deleteTask,
  bulkCreateTasks,
  addAttachment,
  uploadAttachment,
  removeAttachment,
  setDeadline,
  distributeTask,
  getProctoredTask,
  startProctoredSession,
  endProctoredSession,
  addPlaylistAsAttachments,
} from "../controllers/plan.controller.js"

const router = express.Router()

const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Increased to 10MB
  },
})

// Attachment completion routes
router.patch("/task/:taskId/attachment/:attachmentId/complete", authenticateToken, markAttachmentComplete)
router.patch("/task/:taskId/attachment/:attachmentId/uncomplete", authenticateToken, unmarkAttachmentComplete)

// Task CRUD routes
router.post("/task", authenticateToken, createTask)
router.get("/daily", authenticateToken, getDailyTasks)
router.get("/monthly", authenticateToken, getMonthlyTasks)
router.patch("/task/:taskId/complete", authenticateToken, completeTask)
router.patch("/task/:taskId/uncomplete", authenticateToken, uncompleteTask)
router.patch("/task/:taskId", authenticateToken, updateTask)
router.delete("/task/:taskId", authenticateToken, deleteTask)

// Bulk operations
router.post("/bulk", authenticateToken, bulkCreateTasks)

// Attachment routes
router.post("/task/:taskId/attachment", authenticateToken, addAttachment)
router.post("/task/:taskId/attachment/upload", authenticateToken, fileUploadLimiter, upload.single("file"), uploadAttachment)
router.post("/task/:taskId/attachment/playlist", authenticateToken, addPlaylistAsAttachments)
router.delete("/task/:taskId/attachment/:attachmentId", authenticateToken, removeAttachment)

// Deadline and distribution
router.post("/task/:taskId/deadline", authenticateToken, setDeadline)
router.post("/task/:taskId/distribute", authenticateToken, distributeTask)

// Proctored mode routes
router.get("/task/:taskId/proctored", authenticateToken, getProctoredTask)
router.post("/task/:taskId/proctored/start", authenticateToken, startProctoredSession)
router.post("/task/:taskId/proctored/end", authenticateToken, endProctoredSession)

export default router;

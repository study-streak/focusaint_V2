import express from "express"
import * as uploadController from "../controllers/uploadController.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// All upload routes require authentication
router.use(authenticateToken)

// Upload a file
router.post("/", uploadController.uploadFile)

// Delete a file
router.delete("/", uploadController.deleteFile)

export default router

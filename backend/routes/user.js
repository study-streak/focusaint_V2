import express from "express"
import userController from "../controllers/user.controller.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// Get user profile
router.get("/profile", authenticateToken, userController.getUserProfile)

// Update user profile
router.put("/profile", authenticateToken, userController.updateUserProfile)

// Get dashboard data
router.get("/dashboard", authenticateToken,userController.getUserDashboard)

// Get notification preferences
router.get("/notification-preferences", authenticateToken, userController.getNotificationPreferences)

// Update notification preferences
router.put("/notification-preferences", authenticateToken, userController.updateNotificationPreferences)

export default router

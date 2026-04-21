import express from "express"
import { 
  authLoginLimiter, 
  authSignupLimiter, 
  authOTPLimiter,
  authPasswordResetLimiter
} from "../middleware/rateLimit.js"
import {
  resendOTP,
  verifyOTP,
  signup,
  login,
  forgotPassword,
  resetPasswordToken
} from "../controllers/auth.controller.js"

const router = express.Router()

// Resend OTP (only for existing pending verifications)
router.post("/resend-otp", authOTPLimiter, resendOTP)

// Verify OTP and mark user email as verified (no user creation)
router.post("/verify-otp", authOTPLimiter, verifyOTP)

// Signup with password -> create user, then send OTP to verify email
router.post("/signup", authSignupLimiter, signup)

// Password-based login; if unverified, send OTP and require verification
router.post("/login", authLoginLimiter, login)

// Request password reset
router.post("/forgot-password", authPasswordResetLimiter, forgotPassword)

// Reset password using token
router.post("/reset-password", authPasswordResetLimiter, resetPasswordToken)

export default router

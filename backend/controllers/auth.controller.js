import jwt from "jsonwebtoken"
import { OAuth2Client } from "google-auth-library"
import User from "../models/User.js"
import OTP from "../models/OTP.js"
import StreakRecord from "../models/StreakRecord.js"
import { sendOTP } from "../services/email.js"
import { validateEmail, validatePassword } from "../utils/validation.js"
import { connectToMongo } from "../utils/db.js"

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

/**
 * Resend OTP for existing pending verifications
 */
export const resendOTP = async (req, res) => {
  await connectToMongo()

  try {
    const { email: rawEmail } = req.body
    const email = rawEmail?.toLowerCase()

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" })
    }

    // Check if there's a pending OTP request
    const existingOTP = await OTP.findOne({ email, type: "signup" })
    if (!existingOTP) {
      return res.status(400).json({ error: "No pending verification found. Please sign up or login first." })
    }

    // Generate new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Update existing OTP record
    existingOTP.otp = otp
    existingOTP.expiresAt = expiresAt
    await existingOTP.save()

    // Get name from signup data or fetch user
    let name = existingOTP.signupData?.name
    if (!name) {
      const user = await User.findOne({ email })
      name = user?.name
    }

    // Send OTP to email
    await sendOTP(email, otp, name)

    res.json({
      message: "OTP resent to email",
      email,
    })
  } catch (error) {
    console.error("Resend OTP error:", error)
    res.status(500).json({ error: "Failed to resend OTP" })
  }
}

/**
 * Verify OTP and mark user email as verified
 */
export const verifyOTP = async (req, res) => {
  try {
    await connectToMongo()

    const { email: rawEmail, otp } = req.body
    const email = rawEmail?.toLowerCase()

    if (!validateEmail(email) || !otp) {
      return res.status(400).json({ error: "Invalid email or OTP" })
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email, otp, type: "signup" })

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" })
    }

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id })
      return res.status(400).json({ error: "OTP has expired" })
    }

    // Find user (must exist from signup)
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ error: "User not found. Please sign up first." })
    }

    // Mark email verified if not already
    if (!user.isEmailVerified) {
      user.isEmailVerified = true
      await user.save()
      // Ensure streak record exists
      const existingStreak = await StreakRecord.findOne({ userId: user._id })
      if (!existingStreak) {
        await StreakRecord.create({ userId: user._id })
      }
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || "focusaint_secret_key", {
      expiresIn: "7d",
    })

    // Delete OTP after verification
    await OTP.deleteOne({ _id: otpRecord._id })

    res.json({
      message: "Verification successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        learningGoal: user.learningGoal,
        currentStreak: user.currentStreak,
      },
    })
  } catch (error) {
    console.error("Verify OTP error:", error)
    res.status(500).json({ error: "Verification failed" })
  }
}

/**
 * Signup with password -> create user, then send OTP to verify email
 */
export const signup = async (req, res) => {
  try {
    await connectToMongo()

    const { email: rawEmail, password, name, learningGoal } = req.body
    const email = rawEmail?.toLowerCase()

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" })
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ error: "Password must be at least 8 chars with a number and uppercase letter" })
    }
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required" })
    }

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered. Please login instead." })
    }

    // Create user (isEmailVerified remains false by default)
    const user = await User.create({
      email,
      password,
      name: name.trim(),
      learningGoal: learningGoal || undefined,
    })

    // Generate OTP and send for email verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    await OTP.deleteMany({ email, type: "signup" })
    await OTP.create({ email, otp, expiresAt, type: "signup" })
    await sendOTP(email, otp, user.name)

    res.status(201).json({
      message: "Signup successful. We sent a verification code to your email.",
      email,
      requiresVerification: true,
    })
  } catch (error) {
    console.error("Signup error:", error)
    res.status(500).json({ error: "Signup failed" })
  }
}

/**
 * Password-based login; if unverified, send OTP and require verification
 */
export const login = async (req, res) => {
  try {
    await connectToMongo()

    const { email: rawEmail, password } = req.body
    const email = rawEmail?.toLowerCase()

    if (!validateEmail(email) || !password) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ error: "User not found" })
    }

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid password" })
    }

    // If email not verified, check for existing OTP or send new one
    if (!user.isEmailVerified) {
      const existingOTP = await OTP.findOne({ email, type: "signup" })
      
      if (existingOTP && existingOTP.expiresAt > new Date()) {
        // Use existing valid OTP instead of creating a new one
        return res.status(403).json({
          error: "Email not verified. Please enter the verification code sent to your email.",
          requiresVerification: true,
          email,
        })
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
      await OTP.deleteMany({ email, type: "signup" })
      await OTP.create({ email, otp, expiresAt, type: "signup" })
      await sendOTP(email, otp, user.name)

      return res.status(403).json({
        error: "Email not verified. We've sent a verification code to your email.",
        requiresVerification: true,
        email,
      })
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || "focusaint_secret_key", {
      expiresIn: "7d",
    })

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        currentStreak: user.currentStreak,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Login failed" })
  }
}

/**
 * Helper to create a JWT reset token
 */
function createResetToken(email, code) {
  return jwt.sign({ email, code }, process.env.JWT_SECRET || "focusaint_secret_key", { expiresIn: "15m" })
}

/**
 * Helper to verify a JWT reset token
 */
function verifyResetToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "focusaint_secret_key")
  } catch {
    return null
  }
}

/**
 * Request password reset
 */
export const forgotPassword = async (req, res) => {
  await connectToMongo()
  try {
    const { email: rawEmail } = req.body
    const email = rawEmail?.toLowerCase()
    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" })
    }
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ error: "No user found with this email" })
    }
    // Generate 6-digit numeric reset code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 min
    // Save code to OTP collection (reuse for simplicity)
    const otpDoc = await OTP.findOneAndUpdate(
      { email, type: "reset" },
      { otp: code, expiresAt, type: "reset", attempts: 0 },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    console.log("[FORGOT PASSWORD] OTP saved:", otpDoc)
    // Create JWT token for link
    const resetToken = createResetToken(email, code)
    // Send email (pass token as third arg)
    await sendOTP(email, code, user.name, true, resetToken)
    res.json({ message: "Password reset code sent to email" })
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({ error: "Failed to send reset code" })
  }
}

/**
 * Reset password using token
 */
export const resetPasswordToken = async (req, res) => {
  await connectToMongo()
  try {
    const { token, newPassword, email: rawEmail } = req.body
    const email = rawEmail?.toLowerCase()
    
    let userEmail = email
    let code = token

    if (!token || !validatePassword(newPassword)) {
      return res.status(400).json({ error: "Invalid input" })
    }

    // Check if token is a JWT (typically much longer than 6 digits)
    if (token.length > 20) {
      const decoded = verifyResetToken(token)
      if (!decoded || !decoded.email || !decoded.code) {
        return res.status(400).json({ error: "Invalid or expired reset token" })
      }
      userEmail = decoded.email
      code = decoded.code
    }

    if (!userEmail || !code) {
       return res.status(400).json({ error: "Email and reset code are required" })
    }

    const otpRecord = await OTP.findOne({ email: userEmail, otp: code, type: "reset" })
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: "Invalid or expired reset token" })
    }

    const user = await User.findOne({ email: userEmail })
    if (!user) {
      return res.status(400).json({ error: "User not found" })
    }

    user.password = newPassword
    await user.save()
    await OTP.deleteOne({ _id: otpRecord._id })
    res.json({ message: "Password reset successful" })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({ error: "Failed to reset password" })
  }
}

/**
 * Google OAuth Login / Signup
 */
export const googleLogin = async (req, res) => {
  try {
    await connectToMongo()
    const { token, accessToken } = req.body

    let payload
    if (token) {
      // Verify Google ID Token
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      })
      payload = ticket.getPayload()
    } else if (accessToken) {
      // Verify via Google UserInfo API using Access Token
      const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) throw new Error("Failed to fetch user info from Google")
      const data = await response.json()
      payload = {
        email: data.email,
        name: data.name,
        picture: data.picture,
        sub: data.sub,
      }
    }

    if (!payload) {
      return res.status(400).json({ error: "Google token or access token is required" })
    }

    const { email, name, picture, sub: googleId } = payload

    if (!email) {
      return res.status(400).json({ error: "Google account must have an email" })
    }

    // Find or create user
    let user = await User.findOne({ email })

    if (!user) {
      // Create new user if they don't exist
      user = await User.create({
        email,
        name: name || email.split("@")[0],
        isEmailVerified: true, // Google emails are already verified
        profileImage: picture,
        authProvider: "google",
        googleId,
      })

      // Ensure streak record exists
      await StreakRecord.create({ userId: user._id })
    } else {
      // Update existing user if needed
      if (!user.isEmailVerified) {
        user.isEmailVerified = true
        await user.save()
      }
      
      // Update googleId if not already set (merging accounts)
      if (!user.googleId) {
        user.googleId = googleId
        user.authProvider = user.authProvider || "google"
        await user.save()
      }
    }

    // Generate FocusAInt JWT token
    const focusToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "focusaint_secret_key",
      { expiresIn: "7d" }
    )

    res.json({
      message: "Google login successful",
      token: focusToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        currentStreak: user.currentStreak,
        profileImage: user.profileImage,
      },
    })
  } catch (error) {
    console.error("Google login error:", error)
    res.status(500).json({ error: "Google authentication failed" })
  }
}

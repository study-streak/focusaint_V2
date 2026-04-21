import nodemailer from "nodemailer"
import { getOTPEmailTemplate } from "../templates/otpEmail.js"

const getResetEmailTemplate = (name, code, token) => {
  const frontendBase = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetLink = `${frontendBase}/reset-password?token=${encodeURIComponent(token)}`;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>focusaint - Password Reset</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <div style="background: linear-gradient(135deg, #0ea5e9, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 36px; font-weight: bold; margin-bottom: 10px;">
                🎯 focusaint
              </div>
              <p style="color: #dbeafe; font-size: 14px; margin: 0;">Password Reset Request</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 20px 0;">
                Hello ${name || 'there'}! 👋
              </h2>
              <p style="color: #dbeafe; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                We received a request to reset your password. Use the code below to reset your password. If you did not request this, you can safely ignore this email.
              </p>
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <div style="background: #fff; border: 2px solid #6366f1; border-radius: 12px; padding: 24px; display: inline-block; margin-bottom: 18px;">
                      <span style="font-size: 36px; color: #1e293b; letter-spacing: 4px; font-weight: bold;">${code}</span>
                    </div>
                  </td>
                </tr>
              </table>
              <div style="text-align:center; margin-bottom: 18px;">
                <a href="${resetLink}" style="display:inline-block; background:#6366f1; color:#fff; font-size:18px; font-weight:bold; padding:14px 32px; border-radius:8px; text-decoration:none; margin-top:10px;">Reset Password via Link</a>
              </div>
              <p style="color: #dbeafe; font-size: 14px;">This code and link will expire in 15 minutes.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
import { param } from "framer-motion/client"

// Create transporter - Configure with your email service
const createTransporter = () => {
  // For Gmail (requires App Password if 2FA is enabled)
  // Go to: https://myaccount.google.com/apppasswords
  if (process.env.EMAIL_SERVICE === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
      },
    })
  }

  // For other SMTP services (SendGrid, Mailgun, etc.)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  })
}

export const sendOTP = async (email, otp, name = "", isReset = false, resetToken = null) => {
  try {
    // If email credentials are not configured, just log (for development)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log(`\n${"=".repeat(60)}`)
      if (isReset) {
        console.log(`📧 RESET EMAIL (Development Mode)`)
      } else {
        console.log(`📧 OTP EMAIL (Development Mode)`)
      }
      console.log(`${"=".repeat(60)}`)
      console.log(`To: ${email}`)
      console.log(`Name: ${name || "User"}`)
      if (isReset) {
        console.log(`Reset Token: ${otp}`)
        console.log(`Expires in: 15 minutes`)
      } else {
        console.log(`OTP Code: ${otp}`)
        console.log(`Expires in: 10 minutes`)
      }
      console.log(`${"=".repeat(60)}\n`)
      return true
    }

    const transporter = createTransporter()

    const mailOptions = {
      from: {
        name: "focusaint",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: isReset ? `Password Reset Request` : `Account verification code`,
      html: isReset ? getResetEmailTemplate(name, otp, resetToken) : getOTPEmailTemplate(name, otp),
      text: isReset
        ? `Hello ${name || "there"}!\n\nWe received a request to reset your password. Use this code to reset your password: ${otp}\nOr click the following link: ${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${encodeURIComponent(resetToken)}\n\nThis code and link will expire in 15 minutes.\n\nIf you didn't request this, you can ignore this email.\n\nBest regards,\nThe focusaint Team`
        : `Hello ${name || "there"}!\n\nYour focusaint verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\nThe focusaint Team`,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log(`✓ Email sent successfully to ${email}`)
    console.log(`Message ID: ${info.messageId}`)
    return true
  } catch (error) {
    console.error("Email send error:", error)
    throw new Error(isReset ? "Failed to send reset email" : "Failed to send verification email")
  }
}


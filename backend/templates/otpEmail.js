export const getOTPEmailTemplate = (name, otp) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>focusaint - Your Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background: linear-gradient(135deg, #064e3b 0%, #134e4a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <div style="background: linear-gradient(135deg, #10b981, #14b8a6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 36px; font-weight: bold; margin-bottom: 10px;">
                                🎯 focusaint
                            </div>
                            <p style="color: #d1fae5; font-size: 14px; margin: 0;">Building Unbreakable Learning Habits</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 20px 0;">
                                Hello ${name || 'there'}! 👋
                            </h2>
                            <p style="color: #d1fae5; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Thank you for joining focusaint! To complete your registration and start your learning journey, please use the verification code below:
                            </p>

                            <!-- OTP Box -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <div style="background: rgba(16, 185, 129, 0.2); border: 2px solid #10b981; border-radius: 12px; padding: 24px; display: inline-block;">
                                            <p style="color: #6ee7b7; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Verification Code</p>
                                            <div style="font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #ffffff; font-family: 'Courier New', monospace;">
                                                ${otp}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; border-radius: 8px; padding: 16px; margin: 30px 0;">
                                <p style="color: #fca5a5; font-size: 14px; margin: 0; line-height: 1.5;">
                                    ⚠️ <strong>Important:</strong> This code will expire in <strong>10 minutes</strong>. For security reasons, please don't share this code with anyone.
                                </p>
                            </div>

                            <p style="color: #d1fae5; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                                If you didn't request this code, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>

                    <!-- Feature Highlights -->
                    <tr>
                        <td style="padding: 30px 40px;">
                            <div style="border-top: 1px solid rgba(16, 185, 129, 0.3); padding-top: 30px;">
                                <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 20px 0;">
                                    What's waiting for you:
                                </h3>
                                <table role="presentation" style="width: 100%;">
                                    <tr>
                                        <td style="padding: 10px 0;">
                                            <span style="color: #10b981; font-size: 20px; margin-right: 10px;">🔥</span>
                                            <span style="color: #d1fae5; font-size: 15px;">Track your learning streaks</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0;">
                                            <span style="color: #10b981; font-size: 20px; margin-right: 10px;">📊</span>
                                            <span style="color: #d1fae5; font-size: 15px;">Visualize your progress</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0;">
                                            <span style="color: #10b981; font-size: 20px; margin-right: 10px;">🎯</span>
                                            <span style="color: #d1fae5; font-size: 15px;">Achieve your learning goals</span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background: rgba(0,0,0,0.2);">
                            <p style="color: #6ee7b7; font-size: 14px; text-align: center; margin: 0 0 10px 0;">
                                Ready to build unbreakable habits? Let's get started! 🚀
                            </p>
                            <p style="color: #86efac; font-size: 12px; text-align: center; margin: 0;">
                                © ${new Date().getFullYear()} focusaint. All rights reserved.
                            </p>
                            <p style="color: #6ee7b7; font-size: 12px; text-align: center; margin: 10px 0 0 0;">
                                Need help? Contact us at <a href="mailto:support@focusaint.com" style="color: #10b981; text-decoration: none;">support@focusaint.com</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `.trim()
}

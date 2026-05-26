export const spacedReviewReminderEmail = (name, reviewsCount) => {
return     `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>focusaint - Spaced Review Reminder</title>
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
              <p style="color: #dbeafe; font-size: 14px; margin: 0;">Spaced Review Reminder</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; padding: 30px; text-align: center;">
                <p style="color: #ffffff; font-size: 18px; margin-bottom: 20px;">Hi ${name},</p>
                <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                  You have <strong>${reviewsCount}</strong> spaced reviews pending today! Complete them to strengthen your memory and keep your streak alive.
                </p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #ffffff; color: #4f46e5; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin-top: 10px;">Review Now</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 40px 40px; text-align: center;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                If you have any questions, reply to this email.<br>
                &copy; ${new Date().getFullYear()} focusaint. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `    
}
/**
 * TEST SCRIPT: Spaced Review & Notifications
 * 
 * Run with: node test-spaced-review.js
 * Make sure backend is running on port 5000 first.
 * 
 * Tests:
 *  1. Login & get auth token
 *  2. Create a task + attachment
 *  3. Schedule spaced reviews for that attachment
 *  4. Fetch dashboard -> verify reviewsDue is correct
 *  5. Get a specific review
 *  6. Complete the review with a score
 *  7. Backdate a review to test "due now" logic
 *  8. Simulate cron: send email reminder (dry-run log)
 */

import mongoose from 'mongoose'
import { connectToMongo } from './utils/db.js'
import SpacedReview from './models/SpacedReview.js'
import HabitTask from './models/HabitTask.js'
import User from './models/User.js'
import { sendSpacedReviewReminderEmail } from './services/email.js'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '.env') })

const BASE_URL = 'http://localhost:5000'
const TEST_EMAIL = 'test@gmail.com' // Use your real account for email test

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiCall(method, path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`[${res.status}] ${path}: ${JSON.stringify(data)}`)
  return data
}

function ok(msg) { console.log(`  ✅ ${msg}`) }
function fail(msg) { console.log(`  ❌ ${msg}`) }
function section(title) { console.log(`\n${'─'.repeat(60)}\n  ${title}\n${'─'.repeat(60)}`) }

async function dbRetry(fn, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await connectToMongo()
      return await fn()
    } catch (err) {
      console.warn(`      ⚠️  DB Operation failed (attempt ${i + 1}/${retries}): ${err.message}. Retrying in ${delay / 1000}s...`)
      try {
        await mongoose.disconnect()
      } catch (disErr) {}
      if (global.mongoose) {
        global.mongoose.conn = null
        global.mongoose.promise = null
      }
      if (i === retries - 1) throw err
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function runTests() {
  let token, userId, taskId, attachmentId, reviewId

  console.log('\n🧪 focusaint — Spaced Review & Notifications Test Suite\n')

  // ── 1. Login ─────────────────────────────────────────────────────────────────
  section('1. Authentication')
  try {
    // First try to log in; fallback to test credentials
    const login = await apiCall('POST', '/api/auth/login', {
      email: TEST_EMAIL,
      password: 'test@1234'
    })
    token = login.token
    userId = login.user?._id || login.user?.id
    ok(`Logged in as: ${login.user?.email}`)
  } catch (err) {
    fail(`Login failed: ${err.message}`)
    console.log('  ⚠️  Make sure the backend is running: npm run start (in /backend)')
    process.exit(1)
  }

  // ── 2. Create task + attachment ───────────────────────────────────────────────
  section('2. Create Task & Attachment')
  try {
    const today = new Date().toISOString().split('T')[0]
    const month = today.slice(0, 7)

    const taskRes = await apiCall('POST', '/api/plan/task', {
      title: '[TEST] Machine Learning Fundamentals',
      duration: 60,
      category: 'study',
      assignedDate: today,
      monthYear: month
    }, token)

    taskId = taskRes.task._id
    ok(`Created task: ${taskId}`)

    const attachRes = await apiCall('POST', `/api/plan/task/${taskId}/attachment`, {
      type: 'link',
      name: '[TEST] Lecture 1 - Introduction to ML',
      url: 'https://www.youtube.com/watch?v=aircAruvnKk'
    }, token)

    attachmentId = attachRes.task.attachments.at(-1)._id
    ok(`Created attachment: ${attachmentId}`)
  } catch (err) {
    fail(`Task/attachment creation failed: ${err.message}`)
  }

  // ── 3. Schedule Spaced Reviews ────────────────────────────────────────────────
  section('3. Schedule Spaced Reviews')
  try {
    const reviewRes = await apiCall(
      'POST',
      `/api/plan/task/${taskId}/attachment/${attachmentId}/spaced-review`,
      {
        contentUrl: 'https://www.youtube.com/watch?v=aircAruvnKk',
        materialName: '[TEST] Lecture 1 - Introduction to ML',
        reflectionText: 'ML is about learning patterns from data. Key concepts: supervised vs unsupervised learning.'
      },
      token
    )

    ok(`Scheduled ${reviewRes.reviewsCreated} reviews (intervals: 1d, 3d, 7d by default)`)
  } catch (err) {
    fail(`Scheduling spaced reviews failed: ${err.message}`)
  }

  // ── 4. Backdate review to "due now" ───────────────────────────────────────────
  section('4. Backdate Review to Simulate Due State')
  try {
   await dbRetry(async () => {
      // Get the first review for this task/attachment
      const reviews = await SpacedReview.find({ taskId, attachmentId }).sort({ scheduledFor: 1 })
      if (reviews.length === 0) {
        throw new Error('No reviews found in DB!')
      }
      reviewId = reviews[0]._id.toString()
      // Set scheduledFor to 2 hours ago so it's "due now"
      reviews[0].scheduledFor = new Date(Date.now() - 2 * 60 * 60 * 1000)
      await reviews[0].save()
      ok(`Backdated review ${reviewId} to 2 hours ago — it is now "due"`)
      ok(`All reviews scheduled: ${reviews.map(r => `Review #${r.reviewNumber} (${r.scheduledFor.toDateString()})`).join(', ')}`)
    })
  } catch (err) {
    fail(`Backdating failed: ${err.message}`)
  }

  // ── 5. Dashboard — verify reviewsDue ──────────────────────────────────────────
  section('5. Dashboard — Verify reviewsDue')
  try {
    const dash = await apiCall('GET', '/api/user/dashboard', null, token)
    const due = dash.reviewsDue || []
    if (due.length > 0) {
      ok(`Dashboard shows ${due.length} review(s) due`)
      due.slice(0, 3).forEach(r => {
        console.log(`     • ${r.materialName || 'Unknown'} — Review #${r.reviewNumber} (due: ${new Date(r.scheduledFor).toLocaleString()})`)
      })
    } else {
      fail('No reviewsDue in dashboard response — check backdating or query logic')
    }
  } catch (err) {
    fail(`Dashboard fetch failed: ${err.message}`)
  }

  // ── 6. Get Specific Review ────────────────────────────────────────────────────
  section('6. Get Specific Review')
  try {
    const review = await apiCall('GET', `/api/plan/review/${reviewId}`, null, token)
    ok(`Fetched review: #${review.reviewNumber} for "${review.materialName}"`)
    console.log(`     Scheduled for: ${new Date(review.scheduledFor).toLocaleString()}`)
    console.log(`     Completed: ${review.isCompleted}`)
    console.log(`     Summary: ${review.originalSummary?.slice(0, 80)}...`)
  } catch (err) {
    fail(`Get review failed: ${err.message}`)
  }

   // ── 7. Email Notification (dry run) ──────────────────────────────────────────
  section('7. Email Notification — Dry Run')
  try {
    
    // Count due reviews for this user
  let dueCount = 0
    await dbRetry(async () => {
      // Count due reviews for this user
      dueCount = await SpacedReview.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        isCompleted: false,
        scheduledFor: { $lte: new Date() }
      })
    })

    console.log(`     Due reviews for email: ${dueCount}`)

    if (dueCount > 0) {
      console.log(`     Sending email to: ${TEST_EMAIL}`)
      const sent = await sendSpacedReviewReminderEmail(TEST_EMAIL, 'Test User', dueCount)
      if (sent) {
        ok('Email sent (or logged in dev mode if no SMTP config)')
      } else {
        fail('Email send returned false')
      }
    } else {
      fail('Expected to find due reviews for email, but found 0')
    }
  } catch (err) {
    fail(`Email notification test failed: ${err.message}`)
  }
 // ── 8. Complete Review ────────────────────────────────────────────────────────
  section('8. Complete Review (score = 85)')
  try {
    const res = await apiCall('PATCH', `/api/plan/review/${reviewId}/complete`, { score: 85 }, token)
    ok(`Review completed! recallScore: ${res.review?.recallScore}, completedAt: ${new Date(res.review?.completedAt).toLocaleString()}`)
  } catch (err) {
    fail(`Complete review failed: ${err.message}`)
  }
  // ── 9. Cleanup ────────────────────────────────────────────────────────────────
  section('9. Cleanup Test Data')
  try {
    await dbRetry(async () => {
      await SpacedReview.deleteMany({ taskId: new mongoose.Types.ObjectId(taskId) })
      await HabitTask.findByIdAndDelete(taskId)
    })
    ok('Cleaned up test task and spaced reviews from DB')
  } catch (err) {
    fail(`Cleanup failed: ${err.message}`)
  }

  console.log('\n' + '═'.repeat(60))
  console.log('  🎉  Test suite complete')
  console.log('═'.repeat(60) + '\n')
   try {
    await mongoose.disconnect()
  } catch (disErr) {}
  process.exit(0)
}

runTests().catch(err => {
  console.error('\n💥 Uncaught error:', err)
  process.exit(1)
})

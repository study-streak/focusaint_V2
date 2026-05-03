import express from "express"
import { 
  apiLimiter,
  authLoginLimiter,
  authSignupLimiter,
  authPasswordResetLimiter,
  authOTPLimiter,
  aiChatLimiter,
  sessionCreateLimiter,
  fileUploadLimiter,
  strictLimiter
} from "./middleware/rateLimit.js"
import { extractUserForRateLimit } from "./middleware/extractUser.js"
import { cookieParser, csrfTokenGenerator, csrfProtection, getCsrfToken } from "./middleware/csrf.js"
import { attachRequestId } from "./middleware/requestId.js"
import { securityHeaders, corsOptions, additionalSecurityMiddleware } from "./middleware/securityHeaders.js"
import { connectToMongo, setupGracefulShutdown, checkHealth } from "./utils/db.js"
import { validateEnvOrExit } from "./utils/envValidation.js"
import { 
  initSentry, 
  sentryRequestHandler, 
  sentryTracingHandler, 
  sentryErrorHandler 
} from "./config/sentry.js"
import logger, { requestLoggingMiddleware, slowQueryMiddleware } from "./utils/logger.js"
import dotenv from "dotenv"
import cors from "cors"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import authRoutes from "./routes/auth.js"
import userRoutes from "./routes/user.js"
import habitRoutes from "./routes/habit.js"
import planRoutes from "./routes/plan.js"
import aiRoutes from "./routes/ai.js"
import subscriptionRoutes from "./routes/subscription.js"
import focusScoreRoutes from "./routes/focusScore.js"
import healthRoutes from "./routes/health.js"
import reminderRoutes from "./routes/reminder.js"
import quizRoutes from "./routes/quiz.js"
import learnRoutes from "./routes/learn.js"
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js"
import { initializeCronJobs } from "./services/cronJobs.js"
import { metricsMiddleware } from "./services/metrics.js"
import reminderScheduler from "./services/reminderScheduler.js"

// Load environment variables
dotenv.config("")

// Validate environment variables before starting the application
validateEnvOrExit()

const app = express()

// Initialize Sentry (must be first)
initSentry(app)
const isVercel = Boolean(process.env.VERCEL)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = isVercel ? path.join("/tmp", "uploads") : path.join(__dirname, "uploads")
app.set('trust proxy', 1);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Sentry request handler (must be first middleware)
app.use(sentryRequestHandler())

// Sentry tracing handler (must be second middleware)
app.use(sentryTracingHandler())

// Security Middleware (must be early in the chain)
// Apply helmet security headers
app.use(securityHeaders)

// Apply additional custom security headers
app.use(additionalSecurityMiddleware)

// CORS with strict origin validation
app.use(cors(corsOptions))

// Body parsing middleware
app.use(express.json())
app.use(cookieParser()) // Required for CSRF protection

// Attach request ID to all requests (must be early in middleware chain)
app.use(attachRequestId)

// Request/response logging middleware (after request ID)
app.use(requestLoggingMiddleware)

// Slow query detection middleware (logs requests > 1s)
app.use(slowQueryMiddleware(1000))

// Metrics tracking middleware
app.use(metricsMiddleware)

// Extract user info from JWT for per-user rate limiting
app.use(extractUserForRateLimit)

// Apply rate limiting to all API routes
app.use("/api", apiLimiter)

// CSRF token generation for all requests
app.use(csrfTokenGenerator)

app.use(isVercel ? "/tmp/uploads" : "/uploads", express.static(uploadsDir))


async function startServer() {
  // MongoDB Connection with retry logic and connection pooling
  await connectToMongo().catch((err) => {
  logger.error("MongoDB connection error", { error: err.message, stack: err.stack })
  process.exit(1) // Exit if initial connection fails
})
  // Initialize cron jobs (daily session reset, etc.)
  if (!isVercel) {
    // Only run cron jobs in non-serverless environments
    initializeCronJobs()

    // Start reminder scheduler
    reminderScheduler.start()
    logger.info("Reminder scheduler initialized")
  }

  // Set up graceful shutdown handlers
  setupGracefulShutdown()

  const PORT = process.env.PORT || 5000
  if (!isVercel) {
    app.listen(PORT, () => {
      logger.info(`focusaint server running on http://localhost:${PORT}`, { port: PORT })
    })
  }
}

// Main API Router to group all functional routes
const apiRouter = express.Router();

// Public routes (No CSRF needed for these)
apiRouter.get("/csrf-token", getCsrfToken);
apiRouter.use("/auth", authRoutes);
apiRouter.use("/health", healthRoutes);

// Apply CSRF protection to the rest of the API routes
apiRouter.use(csrfProtection);

// Protected functional routes
apiRouter.use("/user", userRoutes);
apiRouter.use("/habit", habitRoutes);
apiRouter.use("/plan", planRoutes);
apiRouter.use("/ai", aiRoutes);
apiRouter.use("/subscription", subscriptionRoutes);
apiRouter.use("/focus-score", focusScoreRoutes);
apiRouter.use("/reminders", reminderRoutes);
apiRouter.use("/quiz", quizRoutes);
apiRouter.use("/learn", learnRoutes);

// Mount the API Router at both /api and root to handle prefix-stripping proxies
app.use("/api", apiRouter);
app.use("/", apiRouter);

app.get('/',(req, res)=>{ return res.status(200).json({message:"server is running fine"})})

// Legacy health check endpoint (keep for backward compatibility)
app.get("/api/health-legacy", async (req, res) => {
  const dbHealth = await checkHealth()
  
  res.status(dbHealth.healthy ? 200 : 503).json({
    status: dbHealth.healthy ? "healthy" : "unhealthy",
    timestamp: new Date(),
    database: dbHealth,
  })
})

// 404 handler for undefined routes (must be after all route definitions)
app.use(notFoundHandler)

// Sentry error handler (must be before other error handlers)
app.use(sentryErrorHandler())

// Global error handler (must be last)
app.use(errorHandler)

startServer().catch((err) => {
  logger.error("Server startup failed", { error: err.message, stack: err.stack })
  if (!isVercel) {
    process.exit(1)
  }
})

export default app

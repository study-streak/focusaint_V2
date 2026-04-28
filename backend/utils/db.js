import mongoose from "mongoose"
import logger, { logDatabaseQuery } from "./logger.js"

let cached = global.mongoose

if (!cached) {
cached = global.mongoose = { conn: null, promise: null }
}

// Connection pool configuration
const CONNECTION_OPTIONS = {
  maxPoolSize: 2, // Maximum number of connections in the pool
  minPoolSize: 1, // Minimum number of connections to maintain
  maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000, // Socket timeout
  family: 4, // Use IPv4, skip trying IPv6
}

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 5000 // 5 seconds

// Connection state tracking
let isShuttingDown = false

/**
 * Connect to MongoDB with retry logic and connection pooling
 * @returns {Promise<mongoose.Connection>}
 */
export async function connectToMongo() {
  if (cached.conn) return cached.conn
  
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10, // allow concurrency
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
/**
 * Connect to MongoDB with automatic retry on failure
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<mongoose.Mongoose>}
 */
async function connectWithRetry(retryCount = 0) {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, CONNECTION_OPTIONS)
    
    logger.info("MongoDB connected", { 
      poolSize: `${CONNECTION_OPTIONS.minPoolSize}-${CONNECTION_OPTIONS.maxPoolSize}`,
      host: mongoose.connection.host,
      database: mongoose.connection.name
    })
    
    // Set up connection event listeners
    setupConnectionListeners()
    
    // Set up query logging for slow queries
    setupQueryLogging()
    
    return connection
  } catch (error) {
    logger.error(`MongoDB connection failed (attempt ${retryCount + 1}/${MAX_RETRIES})`, { 
      error: error.message,
      retryCount: retryCount + 1,
      maxRetries: MAX_RETRIES
    })
    
    if (retryCount < MAX_RETRIES - 1) {
      logger.info(`Retrying in ${RETRY_DELAY / 1000} seconds...`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return connectWithRetry(retryCount + 1)
    } else {
      logger.error("MongoDB connection failed after maximum retries")
      throw error
    }
  }
}

/**
 * Set up event listeners for connection monitoring
 */
function setupConnectionListeners() {
  const db = mongoose.connection

  // Connection events
  db.on("connected", () => {
    logger.info("MongoDB connection established")
  })

  db.on("disconnected", () => {
    logger.warn("MongoDB connection disconnected")
    
    // Attempt to reconnect if not shutting down
    if (!isShuttingDown) {
      logger.info("Attempting to reconnect...")
      connectWithRetry().catch(err => {
        logger.error("Failed to reconnect", { error: err.message })
      })
    }
  })

  db.on("error", (error) => {
    logger.error("MongoDB connection error", { error: error.message })
  })

  db.on("reconnected", () => {
    logger.info("MongoDB reconnected successfully")
  })
}

/**
 * Set up Mongoose query logging for slow queries
 */
function setupQueryLogging() {
  // Enable debug mode for query logging
  if (process.env.LOG_LEVEL === 'debug') {
    mongoose.set('debug', true)
  }

  // Custom query logging middleware
  mongoose.plugin((schema) => {
    schema.pre(/^find/, function() {
      this._startTime = Date.now()
    })

    schema.post(/^find/, function() {
      if (this._startTime) {
        const duration = Date.now() - this._startTime
        const operation = this.op || 'find'
        const collection = this.mongooseCollection?.name || 'unknown'
        
        logDatabaseQuery(operation, collection, duration, {
          filter: this.getFilter ? JSON.stringify(this.getFilter()) : undefined
        })
      }
    })

    schema.pre(/^(save|update|remove|delete)/, function() {
      this._startTime = Date.now()
    })

    schema.post(/^(save|update|remove|delete)/, function() {
      if (this._startTime) {
        const duration = Date.now() - this._startTime
        const operation = this.op || 'write'
        const collection = this.constructor?.collection?.name || 'unknown'
        
        logDatabaseQuery(operation, collection, duration)
      }
    })
  })
}

/**
 * Gracefully close database connections
 * @returns {Promise<void>}
 */
export async function closeConnection() {
  if (isShuttingDown) {
    logger.info("Shutdown already in progress")
    return
  }

  isShuttingDown = true
  logger.info("Closing MongoDB connection...")

  try {
    if (cached.conn) {
      await mongoose.connection.close()
      cached.conn = null
      cached.promise = null
      logger.info("MongoDB connection closed gracefully")
    }
  } catch (error) {
    logger.error("Error closing MongoDB connection", { error: error.message })
    throw error
  } finally {
    isShuttingDown = false
  }
}

/**
 * Check database connection health
 * @returns {Promise<{healthy: boolean, message: string, details: object}>}
 */
export async function checkHealth() {
  try {
    const state = mongoose.connection.readyState
    const stateMap = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    }

    const isHealthy = state === 1

    // Perform a simple ping operation
    if (isHealthy) {
      await mongoose.connection.db.admin().ping()
    }

    return {
      healthy: isHealthy,
      message: isHealthy ? "Database connection is healthy" : `Database is ${stateMap[state]}`,
      details: {
        state: stateMap[state],
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        poolSize: CONNECTION_OPTIONS.maxPoolSize,
      },
    }
  } catch (error) {
    return {
      healthy: false,
      message: "Database health check failed",
      details: {
        error: error.message,
      },
    }
  }
}

/**
 * Set up graceful shutdown handlers
 */
export function setupGracefulShutdown() {
  const shutdownHandler = async (signal) => {
    logger.info(`${signal} received, starting graceful shutdown...`)
    
    try {
      await closeConnection()
      logger.info("Graceful shutdown completed")
      process.exit(0)
    } catch (error) {
      logger.error("Error during graceful shutdown", { error: error.message })
      process.exit(1)
    }
  }

  // Handle different termination signals
  process.on("SIGTERM", () => shutdownHandler("SIGTERM"))
  process.on("SIGINT", () => shutdownHandler("SIGINT"))
  
  // Handle uncaught exceptions
  process.on("uncaughtException", async (error) => {
    logger.error("Uncaught Exception", { error: error.message, stack: error.stack })
    await closeConnection()
    process.exit(1)
  })

  // Handle unhandled promise rejections
  process.on("unhandledRejection", async (reason, promise) => {
    logger.error("Unhandled Rejection", { reason, promise: String(promise) })
    await closeConnection()
    process.exit(1)
  })
}
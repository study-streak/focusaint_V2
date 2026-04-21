/**
 * Environment-Specific Configuration
 * 
 * This module provides environment-specific settings for development, staging, and production.
 * Configuration is selected based on NODE_ENV environment variable.
 */

/**
 * Development environment configuration
 */
const development = {
  name: 'development',
  
  // Server settings
  server: {
    port: process.env.PORT || 5000,
    host: 'localhost',
    protocol: 'http'
  },

  // Database settings
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/focusaint',
    options: {
      maxPoolSize: 5,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000
    }
  },

  // Redis settings
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    options: {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true
    }
  },

  // Security settings
  security: {
    jwtExpiresIn: '7d',
    bcryptRounds: 10,
    csrfEnabled: true,
    secureCookies: false, // HTTP allowed in development
    rateLimitEnabled: true
  },

  // CORS settings
  cors: {
    origins: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(o => o.trim()),
    credentials: true
  },

  // Email settings
  email: {
    enabled: true,
    service: process.env.EMAIL_SERVICE || 'gmail',
    from: process.env.EMAIL_USER,
    otpExpiryMinutes: 10
  },

  // Logging settings
  logging: {
    level: 'debug',
    prettyPrint: true,
    logRequests: true,
    logSlowQueries: true,
    slowQueryThreshold: 1000 // ms
  },

  // Feature flags
  features: {
    aiEnabled: Boolean(process.env.GEMINI_API_KEY),
    paymentsEnabled: Boolean(process.env.DODO_PAYMENTS_API_KEY),
    sentryEnabled: Boolean(process.env.SENTRY_DSN),
    cacheEnabled: true
  },

  // Cache settings
  cache: {
    defaultTTL: 300, // 5 minutes
    leaderboardTTL: 300,
    userProfileTTL: 600
  },

  // External services
  services: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-pro',
      maxTokens: 1000
    },
    dodoPayments: {
      apiKey: process.env.DODO_PAYMENTS_API_KEY,
      environment: process.env.DODO_PAYMENTS_ENV || 'test_mode'
    },
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: 'development',
      tracesSampleRate: 0.1
    }
  }
}

/**
 * Staging environment configuration
 */
const staging = {
  name: 'staging',
  
  // Server settings
  server: {
    port: process.env.PORT || 5000,
    host: '0.0.0.0',
    protocol: 'https'
  },

  // Database settings
  database: {
    uri: process.env.MONGODB_URI,
    options: {
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true
    }
  },

  // Redis settings
  redis: {
    url: process.env.REDIS_URL,
    options: {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000
    }
  },

  // Security settings
  security: {
    jwtExpiresIn: '7d',
    bcryptRounds: 12,
    csrfEnabled: true,
    secureCookies: true, // HTTPS required
    rateLimitEnabled: true
  },

  // CORS settings
  cors: {
    origins: process.env.CORS_ORIGIN.split(',').map(o => o.trim()),
    credentials: true
  },

  // Email settings
  email: {
    enabled: true,
    service: process.env.EMAIL_SERVICE,
    from: process.env.EMAIL_USER,
    otpExpiryMinutes: 10
  },

  // Logging settings
  logging: {
    level: 'info',
    prettyPrint: false,
    logRequests: true,
    logSlowQueries: true,
    slowQueryThreshold: 500 // ms
  },

  // Feature flags
  features: {
    aiEnabled: Boolean(process.env.GEMINI_API_KEY),
    paymentsEnabled: Boolean(process.env.DODO_PAYMENTS_API_KEY),
    sentryEnabled: Boolean(process.env.SENTRY_DSN),
    cacheEnabled: true
  },

  // Cache settings
  cache: {
    defaultTTL: 300, // 5 minutes
    leaderboardTTL: 300,
    userProfileTTL: 600
  },

  // External services
  services: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-pro',
      maxTokens: 1000
    },
    dodoPayments: {
      apiKey: process.env.DODO_PAYMENTS_API_KEY,
      environment: process.env.DODO_PAYMENTS_ENV || 'test_mode'
    },
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: 'staging',
      tracesSampleRate: 0.5
    }
  }
}

/**
 * Production environment configuration
 */
const production = {
  name: 'production',
  
  // Server settings
  server: {
    port: process.env.PORT || 5000,
    host: '0.0.0.0',
    protocol: 'https'
  },

  // Database settings
  database: { 
    uri: process.env.MONGODB_URI,
    options: {
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority'
    }
  },

  // Redis settings
  redis: {
    url: process.env.REDIS_URL,
    options: {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000,
      lazyConnect: false
    }
  },

  // Security settings
  security: {
    jwtExpiresIn: '7d',
    bcryptRounds: 12,
    csrfEnabled: true,
    secureCookies: true, // HTTPS required
    rateLimitEnabled: true
  },

  // CORS settings
  cors: {
    origins: process.env.CORS_ORIGIN.split(',').map(o => o.trim()),
    credentials: true
  },

  // Email settings
  email: {
    enabled: true,
    service: process.env.EMAIL_SERVICE,
    from: process.env.EMAIL_USER,
    otpExpiryMinutes: 10
  },

  // Logging settings
  logging: {
    level: 'warn',
    prettyPrint: false,
    logRequests: false, // Reduce log volume in production
    logSlowQueries: true,
    slowQueryThreshold: 500 // ms
  },

  // Feature flags
  features: {
    aiEnabled: Boolean(process.env.GEMINI_API_KEY),
    paymentsEnabled: Boolean(process.env.DODO_PAYMENTS_API_KEY),
    sentryEnabled: Boolean(process.env.SENTRY_DSN),
    cacheEnabled: true
  },

  // Cache settings
  cache: {
    defaultTTL: 600, // 10 minutes
    leaderboardTTL: 300, // 5 minutes
    userProfileTTL: 1800 // 30 minutes
  },

  // External services
  services: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-pro',
      maxTokens: 1000
    },
    dodoPayments: {
      apiKey: process.env.DODO_PAYMENTS_API_KEY,
      environment: process.env.DODO_PAYMENTS_ENV || 'live_mode'
    },
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: 'production',
      tracesSampleRate: 1.0 // Full sampling in production
    }
  }
}

/**
 * Test environment configuration
 */
const test = {
  name: 'test',
  
  // Server settings
  server: {
    port: process.env.PORT || 5001,
    host: 'localhost',
    protocol: 'http'
  },

  // Database settings
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/focusaint_test',
    options: {
      maxPoolSize: 5,
      minPoolSize: 1
    }
  },

  // Redis settings
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379/1', // Use DB 1 for tests
    options: {
      maxRetriesPerRequest: 1
    }
  },

  // Security settings
  security: {
    jwtExpiresIn: '1h',
    bcryptRounds: 4, // Faster for tests
    csrfEnabled: false, // Disabled for easier testing
    secureCookies: false,
    rateLimitEnabled: false // Disabled for tests
  },

  // CORS settings
  cors: {
    origins: ['http://localhost:3000'],
    credentials: true
  },

  // Email settings
  email: {
    enabled: false, // Disabled in tests
    service: 'gmail',
    from: 'test@example.com',
    otpExpiryMinutes: 10
  },

  // Logging settings
  logging: {
    level: 'error', // Only errors in tests
    prettyPrint: false,
    logRequests: false,
    logSlowQueries: false,
    slowQueryThreshold: 1000
  },

  // Feature flags
  features: {
    aiEnabled: false,
    paymentsEnabled: false,
    sentryEnabled: false,
    cacheEnabled: false // Disabled for predictable tests
  },

  // Cache settings
  cache: {
    defaultTTL: 60,
    leaderboardTTL: 60,
    userProfileTTL: 60
  },

  // External services (all disabled in tests)
  services: {
    gemini: {
      apiKey: null,
      model: 'gemini-pro',
      maxTokens: 100
    },
    dodoPayments: {
      apiKey: null,
      environment: 'test_mode'
    },
    sentry: {
      dsn: null,
      environment: 'test',
      tracesSampleRate: 0
    }
  }
}

/**
 * Configuration map
 */
const configs = {
  development,
  staging,
  production,
  test
}

/**
 * Get configuration for current environment
 * @returns {object} Environment configuration
 */
export function getConfig() {
  const env = process.env.NODE_ENV || 'development'
  const config = configs[env]

  if (!config) {
    throw new Error(`Invalid NODE_ENV: ${env}. Must be one of: ${Object.keys(configs).join(', ')}`)
  }

  return config
}

/**
 * Check if running in production
 * @returns {boolean}
 */
export function isProduction() {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in development
 * @returns {boolean}
 */
export function isDevelopment() {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
}

/**
 * Check if running in test
 * @returns {boolean}
 */
export function isTest() {
  return process.env.NODE_ENV === 'test'
}

/**
 * Check if running in staging
 * @returns {boolean}
 */
export function isStaging() {
  return process.env.NODE_ENV === 'staging'
}

export default {
  getConfig,
  isProduction,
  isDevelopment,
  isTest,
  isStaging,
  configs
}

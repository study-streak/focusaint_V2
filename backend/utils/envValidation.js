/**
 * Environment Variable Validation
 * 
 * This module validates all required environment variables at application startup
 * to prevent runtime errors due to missing or invalid configuration.
 */

/**
 * Environment variable schema definition
 * Each field specifies: required, type, validation rules, and default values
 */
const ENV_SCHEMA = {
  // Server Configuration
  PORT: {
    required: false,
    type: 'number',
    default: 5000,
    description: 'Server port number'
  },
  NODE_ENV: {
    required: true,
    type: 'string',
    enum: ['development', 'staging', 'production', 'test'],
    default: 'development',
    description: 'Application environment'
  },

  // Database Configuration
  MONGODB_URI: {
    required: true,
    type: 'string',
    pattern: /^mongodb(\+srv)?:\/\/.+/,
    description: 'MongoDB connection string'
  },

  // Redis Configuration
  REDIS_URL: {
    required: true,
    type: 'string',
    pattern: /^redis(s)?:\/\/(?:.*@)?[a-zA-Z0-9\-\.]+:[0-9]+/,
    description: 'Redis connection URL for caching and rate limiting (e.g., redis://localhost:6379 or redis://:password@host:port)'
  },

  // Security Configuration
  JWT_SECRET: {
    required: true,
    type: 'string',
    minLength: 10,
    description: 'Secret key for JWT token signing (minimum 32 characters)',
    validate: (value) => {
      if (process.env.NODE_ENV === 'production' && value === 'focusaint_secret_key_change_in_production') {
        throw new Error('JWT_SECRET must be changed from default value in production')
      }
      return true
    }
  },

  // CORS Configuration
  CORS_ORIGIN: {
    required: true,
    type: 'string',
    description: 'Comma-separated list of allowed CORS origins',
    validate: (value) => {
      const origins = value.split(',').map(o => o.trim())
      if (origins.length === 0) {
        throw new Error('At least one CORS origin must be specified')
      }
      return true
    }
  },
  FRONTEND_URL: {
    required: false,
    type: 'string',
    description: 'Primary frontend URL for production'
  },

  // Email Configuration
  EMAIL_SERVICE: {
    required: false,
    type: 'string',
    enum: ['gmail', 'custom', ''],
    default: 'gmail',
    description: 'Email service provider (gmail or custom SMTP)'
  },
  EMAIL_USER: {
    required: true,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    description: 'Email address for sending emails'
  },
  EMAIL_PASSWORD: {
    required: true,
    type: 'string',
    minLength: 8,
    description: 'Email password or app-specific password'
  },

  // Custom SMTP Configuration (optional, for non-Gmail services)
  SMTP_HOST: {
    required: false,
    type: 'string',
    description: 'SMTP server hostname'
  },
  SMTP_PORT: {
    required: false,
    type: 'number',
    description: 'SMTP server port'
  },
  SMTP_SECURE: {
    required: false,
    type: 'boolean',
    description: 'Use TLS for SMTP connection'
  },

  // AI & External Services
  GEMINI_API_KEY: {
    required: false,
    type: 'string',
    description: 'Google Gemini API key for AI features'
  },
  GROQ_API_KEY: {
    required: false,
    type: 'string',
    description: 'Groq API key for high-speed inference'
  },
  SENTRY_DSN: {
    required: false,
    type: 'string',
    description: 'Sentry DSN for error tracking'
  },

  // AWS & S3 Configuration
  AWS_REGION: {
    required: true,
    type: 'string',
    default: 'us-east-1',
    description: 'AWS region for S3 and other services'
  },
  AWS_ACCESS_KEY_ID: {
    required: true,
    type: 'string',
    description: 'AWS access key ID'
  },
  AWS_SECRET_ACCESS_KEY: {
    required: true,
    type: 'string',
    description: 'AWS secret access key'
  },
  S3_BUCKET_NAME: {
    required: true,
    type: 'string',
    description: 'AWS S3 bucket name for file uploads'
  }
}

/**
 * Environment-specific required fields
 * Additional validation rules based on NODE_ENV
 */
const ENV_SPECIFIC_REQUIREMENTS = {
  production: {
    requiredFields: ['FRONTEND_URL', 'SENTRY_DSN'],
    warnings: [
      'Ensure JWT_SECRET is a strong, unique value',
      'Verify CORS_ORIGIN includes only trusted domains',
      'Confirm MONGODB_URI points to production database',
      'Check that REDIS_URL is production-ready'
    ]
  },
  staging: {
    requiredFields: [],
    warnings: [
      'Staging environment should mirror production configuration'
    ]
  },
  development: {
    requiredFields: [],
    warnings: []
  },
  test: {
    requiredFields: [],
    warnings: []
  }
}

/**
 * Validation error class
 */
class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message)
    this.name = 'ValidationError'
    this.errors = errors
  }
}

/**
 * Parse and validate a single environment variable
 * @param {string} key - Environment variable name
 * @param {object} schema - Validation schema for the variable
 * @returns {any} - Parsed and validated value
 */
function validateEnvVar(key, schema) {
  const value = process.env[key]
  const errors = []

  // Check if required field is missing
  if (schema.required && !value) {
    if (schema.default !== undefined) {
      return schema.default
    }
    errors.push(`${key} is required but not set. ${schema.description}`)
    return { errors }
  }

  // If optional and not provided, return default or undefined
  if (!value) {
    return { value: schema.default }
  }

  // Type validation and conversion
  let parsedValue = value

  switch (schema.type) {
    case 'number':
      parsedValue = Number(value)
      if (isNaN(parsedValue)) {
        errors.push(`${key} must be a valid number. Got: "${value}"`)
      }
      break

    case 'boolean':
      parsedValue = value.toLowerCase() === 'true' || value === '1'
      break

    case 'string':
      // String type, no conversion needed
      break

    default:
      errors.push(`Unknown type "${schema.type}" for ${key}`)
  }

  // Pattern validation (regex)
  if (schema.pattern && !schema.pattern.test(value)) {
    errors.push(`${key} does not match required pattern. ${schema.description}`)
  }

  // Enum validation
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${key} must be one of: ${schema.enum.join(', ')}. Got: "${value}"`)
  }

  // Length validation
  if (schema.minLength && value.length < schema.minLength) {
    errors.push(`${key} must be at least ${schema.minLength} characters long`)
  }

  // Custom validation function
  if (schema.validate) {
    try {
      schema.validate(value)
    } catch (error) {
      errors.push(`${key}: ${error.message}`)
    }
  }

  if (errors.length > 0) {
    return { errors }
  }

  return { value: parsedValue }
}

/**
 * Validate all environment variables against the schema
 * @returns {object} - Validation result with errors and warnings
 */
export function validateEnv() {
  const errors = []
  const warnings = []
  const validatedEnv = {}

  // Validate each field in the schema
  for (const [key, schema] of Object.entries(ENV_SCHEMA)) {
    const result = validateEnvVar(key, schema)
    
    if (result.errors) {
      errors.push(...result.errors)
    } else {
      validatedEnv[key] = result.value
    }
  }

  // Environment-specific validation
  const nodeEnv = process.env.NODE_ENV || 'development'
  const envRequirements = ENV_SPECIFIC_REQUIREMENTS[nodeEnv]

  if (envRequirements) {
    // Check environment-specific required fields
    for (const field of envRequirements.requiredFields) {
      if (!process.env[field]) {
        errors.push(`${field} is required in ${nodeEnv} environment`)
      }
    }

    // Add environment-specific warnings
    warnings.push(...envRequirements.warnings)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    env: validatedEnv
  }
}

/**
 * Validate environment variables and exit if validation fails
 * This should be called at application startup
 */
export function validateEnvOrExit() {
  console.log('🔍 Validating environment variables...')
  
  const result = validateEnv()

  // Display warnings
  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Warnings:')
    result.warnings.forEach(warning => {
      console.warn(`   - ${warning}`)
    })
  }

  // Display errors and exit if validation fails
  if (!result.isValid) {
    console.error('\n❌ Environment Validation Failed!\n')
    console.error('The following environment variables are missing or invalid:\n')
    result.errors.forEach(error => {
      console.error(`   ✗ ${error}`)
    })
    console.error('\nFull list of failed variables:', result.errors.map(e => e.split(' ')[0]).join(', '))
    console.error('\nPlease check your .env file and ensure all required variables are set.')
    console.error('Refer to .env.example for the complete list of required variables.\n')
    process.exit(1)
  }

  console.log('✓ Environment validation passed')
  
  // Display configuration summary
  const nodeEnv = process.env.NODE_ENV || 'development'
  console.log(`✓ Running in ${nodeEnv.toUpperCase()} mode`)
  
  return result.env
}

/**
 * Get a validated environment variable with type safety
 * @param {string} key - Environment variable name
 * @param {any} defaultValue - Default value if not set
 * @returns {any} - Environment variable value
 */
export function getEnv(key, defaultValue = undefined) {
  const schema = ENV_SCHEMA[key]
  
  if (!schema) {
    console.warn(`Warning: ${key} is not defined in ENV_SCHEMA`)
    return process.env[key] || defaultValue
  }

  const result = validateEnvVar(key, schema)
  
  if (result.errors) {
    console.error(`Error getting ${key}:`, result.errors.join(', '))
    return defaultValue
  }

  return result.value !== undefined ? result.value : defaultValue
}

export default {
  validateEnv,
  validateEnvOrExit,
  getEnv,
  ENV_SCHEMA
}

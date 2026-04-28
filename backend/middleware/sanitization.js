import DOMPurify from "isomorphic-dompurify"

/**
 * Sanitization middleware for user-generated content
 * Removes potentially dangerous HTML/JavaScript while preserving safe content
 */

/**
 * Sanitize a single string value
 * @param {string} value - The string to sanitize
 * @param {object} options - DOMPurify configuration options
 * @returns {string} - Sanitized string
 */
export function sanitizeString(value, options = {}) {
  if (typeof value !== "string") {
    return value
  }
  
  const defaultOptions = {
    ALLOWED_TAGS: [], // Strip all HTML tags by default
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true, // Keep text content, remove tags
    ...options
  }
  
  return DOMPurify.sanitize(value, defaultOptions)
}

/**
 * Sanitize an object recursively
 * @param {object} obj - The object to sanitize
 * @param {object} options - DOMPurify configuration options
 * @returns {object} - Sanitized object
 */
export function sanitizeObject(obj, options = {}) {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (typeof obj === "string") {
    return sanitizeString(obj, options)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, options))
  }
  
  if (typeof obj === "object") {
    const sanitized = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value, options)
    }
    return sanitized
  }
  
  return obj
}

/**
 * Middleware to sanitize request body
 * Applies to all string fields in req.body
 */
export const sanitizeBody = (options = {}) => {
  return (req, res, next) => {
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeObject(req.body, options)
    }
    next()
  }
}

/**
 * Middleware to sanitize specific fields in request body
 * @param {string[]} fields - Array of field names to sanitize
 * @param {object} options - DOMPurify configuration options
 */
export const sanitizeFields = (fields = [], options = {}) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== "object") {
      return next()
    }
    
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        req.body[field] = sanitizeObject(req.body[field], options)
      }
    })
    
    next()
  }
}

/**
 * Sanitize user-generated content fields
 * Specifically for fields that may contain user input like:
 * - names, descriptions, notes, messages, titles, etc.
 */
export const sanitizeUserContent = sanitizeFields([
  "name",
  "description",
  "notes",
  "message",
  "title",
  "learningGoal",
  "bio",
  "customInstructions"
])

/**
 * Sanitize with basic markdown support
 * Allows some safe HTML tags for rich text content
 */
export const sanitizeRichText = (options = {}) => {
  const richTextOptions = {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li", "code", "pre"],
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOW_DATA_ATTR: false,
    ...options
  }
  
  return sanitizeBody(richTextOptions)
}

/**
 * Sanitize URLs to prevent javascript: and data: schemes
 * @param {string} url - The URL to sanitize
 * @returns {string|null} - Sanitized URL or null if invalid
 */
export function sanitizeUrl(url) {
  if (typeof url !== "string") {
    return null
  }
  
  const trimmed = url.trim()
  
  // Block dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file):/i
  if (dangerousProtocols.test(trimmed)) {
    return null
  }
  
  // Allow http, https, and relative URLs
  const safeProtocols = /^(https?:\/\/|\/)/i
  if (!safeProtocols.test(trimmed) && !trimmed.startsWith("mailto:")) {
    // If no protocol, assume https
    return `https://${trimmed}`
  }
  
  return trimmed
}

/**
 * Middleware to sanitize URL fields
 * @param {string[]} fields - Array of field names containing URLs
 */
export const sanitizeUrlFields = (fields = []) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== "object") {
      return next()
    }
    
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        const sanitized = sanitizeUrl(req.body[field])
        if (sanitized === null) {
          return res.status(400).json({
            error: {
              code: "INVALID_URL",
              message: `Invalid or unsafe URL in field: ${field}`,
              timestamp: new Date().toISOString()
            }
          })
        }
        req.body[field] = sanitized
      }
    })
    
    next()
  }
}

/**
 * Sanitize email addresses
 * @param {string} email - The email to sanitize
 * @returns {string} - Sanitized email
 */
export function sanitizeEmail(email) {
  if (typeof email !== "string") {
    return ""
  }
  
  // Remove any HTML tags and trim
  const cleaned = DOMPurify.sanitize(email, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true
  }).trim().toLowerCase()
  
  return cleaned
}

/**
 * Prevent NoSQL injection in MongoDB queries
 * Removes $ and . from object keys
 * @param {object} obj - The object to sanitize
 * @returns {object} - Sanitized object
 */
export function sanitizeMongoQuery(obj) {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (typeof obj !== "object") {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeMongoQuery(item))
  }
  
  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    // Remove keys starting with $ or containing .
    if (key.startsWith("$") || key.includes(".")) {
      continue
    }
    
    sanitized[key] = sanitizeMongoQuery(value)
  }
  
  return sanitized
}

/**
 * Middleware to prevent NoSQL injection
 * Sanitizes req.body, req.query, and req.params
 */
export const preventNoSQLInjection = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeMongoQuery(req.body)
  }
  
  if (req.query) {
    req.query = sanitizeMongoQuery(req.query)
  }
  
  if (req.params) {
    req.params = sanitizeMongoQuery(req.params)
  }
  
  next()
}

/**
 * Sanitize file names to prevent directory traversal
 * @param {string} filename - The filename to sanitize
 * @returns {string} - Sanitized filename
 */
export function sanitizeFilename(filename) {
  if (typeof filename !== "string") {
    return "file"
  }
  
  // Remove path separators and special characters
  return filename
    .replace(/[\/\\]/g, "")
    .replace(/\.\./g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .substring(0, 255)
}

/**
 * Combined sanitization middleware for common use cases
 * Applies multiple sanitization strategies
 */
export const sanitizeAll = [
  preventNoSQLInjection,
  sanitizeUserContent
]

export default {
  sanitizeString,
  sanitizeObject,
  sanitizeBody,
  sanitizeFields,
  sanitizeUserContent,
  sanitizeRichText,
  sanitizeUrl,
  sanitizeUrlFields,
  sanitizeEmail,
  sanitizeMongoQuery,
  preventNoSQLInjection,
  sanitizeFilename,
  sanitizeAll
}

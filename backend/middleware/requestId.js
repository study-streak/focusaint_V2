/**
 * Request ID Middleware
 * 
 * Generates and attaches a unique request ID to every incoming request.
 * This ID is used for:
 * - Error tracking and correlation
 * - Logging and debugging
 * - Distributed tracing
 * - Client-side error reporting
 */

import { generateRequestId } from "../utils/errorResponses.js"

/**
 * Middleware to attach request ID to all requests
 * 
 * The request ID is:
 * 1. Generated using a timestamp + random string
 * 2. Attached to req.id for use in route handlers
 * 3. Added to response headers (X-Request-ID) for client tracking
 * 4. Used in all error responses for correlation
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const attachRequestId = (req, res, next) => {
  // Check if request already has an ID (from load balancer or proxy)
  const existingId = req.headers['x-request-id'] || req.headers['x-correlation-id']
  
  // Use existing ID or generate new one
  req.id = existingId || generateRequestId()
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.id)
  
  // Continue to next middleware
  next()
}

/**
 * Get request ID from request object
 * Helper function for use in route handlers
 * 
 * @param {Request} req - Express request object
 * @returns {string} Request ID
 */
export const getRequestId = (req) => {
  return req.id || 'unknown'
}

export default attachRequestId

// Middleware to extract user info from JWT for rate limiting
// This runs before rate limiting to populate req.user
import jwt from 'jsonwebtoken';

export const extractUserForRateLimit = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        // Verify and decode token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user info to request for rate limiting
        req.user = {
          id: decoded.id || decoded.userId,
          email: decoded.email
        };
      } catch (jwtError) {
        // Invalid token - continue without user info
        // Rate limiting will fall back to IP-based limiting
        req.user = null;
      }
    }
    
    next();
  } catch (error) {
    // Don't block request on extraction errors
    next();
  }
};

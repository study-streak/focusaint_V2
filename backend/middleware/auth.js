import jwt from "jsonwebtoken"
import { setUserContext } from "../config/sentry.js"

export  const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Access token required" })
  }

  jwt.verify(token, process.env.JWT_SECRET || "focusaint_secret_key", (err, user) => {
    if (err) {
      console.log(err)
      return res.status(403).json({ error: "Invalid or expired token" })
    }
    req.user = {
      ...user,
      id: user.userId // Add id alias for controllers using req.user.id
    }
    
    // Set user context for Sentry error tracking
    setUserContext({
      _id: user.userId,
      email: user.email,
      name: user.name
    })
    
    next()
  })
}

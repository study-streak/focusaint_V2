import express from "express"
import { authenticateToken } from "../middleware/auth.js"
import {
  getStatus,
  startSession,
  stopSession,
  overrideSession,
  getProfiles,
  saveProfiles,
  getBlocklist,
  addToBlocklist,
  logVisit,
  getIntegrityLogs,
  logViolation,
  syncData
} from "../controllers/focusShield.controller.js"

const router = express.Router()

router.get("/status", authenticateToken, getStatus)
router.post("/session/start", authenticateToken, startSession)
router.post("/session/stop", authenticateToken, stopSession)
router.post("/session/override", authenticateToken, overrideSession)

router.get("/profiles", authenticateToken, getProfiles)
router.post("/profiles", authenticateToken, saveProfiles)

router.get("/blocklist", authenticateToken, getBlocklist)
router.post("/blocklist/add", authenticateToken, addToBlocklist)

router.post("/analytics/visit", authenticateToken, logVisit)

router.get("/integrity/logs", authenticateToken, getIntegrityLogs)
router.post("/integrity/violation", authenticateToken, logViolation)

router.post("/sync", authenticateToken, syncData)

export default router

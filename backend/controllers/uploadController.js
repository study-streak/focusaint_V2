import * as storageService from "../services/storageService.js"
import multer from "multer"

// Configure multer to store files in memory
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Optional: Add file type filtering
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt/
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype) {
      return cb(null, true)
    }
    cb(new Error("Error: File type not supported!"))
  }
}).single("file")

/**
 * Handle file upload request
 */
export const uploadFile = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message })
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file provided" })
    }

    try {
      // Define folder based on user ID or a generic folder
      const folder = `user-${req.user.userId}/uploads`
      const result = await storageService.uploadFile(req.file, folder)
      
      res.status(200).json({
        message: "File uploaded successfully",
        data: result
      })
    } catch (error) {
      console.error("Upload controller error:", error)
      res.status(500).json({ error: "Failed to upload file to storage" })
    }
  })
}

/**
 * Handle file deletion request
 */
export const deleteFile = async (req, res) => {
  const { key } = req.body

  if (!key) {
    return res.status(400).json({ error: "File key is required" })
  }

  try {
    // Security check: ensure user only deletes their own files
    if (!key.startsWith(`user-${req.user.userId}/`)) {
      return res.status(403).json({ error: "Unauthorized to delete this file" })
    }

    await storageService.deleteFile(key)
    res.status(200).json({ message: "File deleted successfully" })
  } catch (error) {
    console.error("Delete controller error:", error)
    res.status(500).json({ error: "Failed to delete file" })
  }
}

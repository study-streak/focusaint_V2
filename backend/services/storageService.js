import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import crypto from "crypto"
import path from "path"

let _s3Client = null
function getS3Client() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS credentials are not configured.")
  }
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  }
  return _s3Client
}

const BUCKET_NAME = process.env.S3_BUCKET_NAME || process.env.S3_BATCH_BUCKET

/**
 * Upload a file to S3
 * @param {Object} file - Multer file object
 * @param {string} folder - Folder in S3 bucket
 * @returns {Promise<Object>} - Upload result with URL and Key
 */
export async function uploadFile(file, folder = "uploads") {
  const fileExtension = path.extname(file.originalname)
  const fileName = `${crypto.randomBytes(16).toString("hex")}${fileExtension}`
  const key = `${folder}/${fileName}`

  if (!BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not configured.")
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  })

  await getS3Client().send(command)

  return {
    url: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`,
    key: key,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  }
}

/**
 * Delete a file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 */
export async function deleteFile(key) {
  if (!BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not configured.")
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await getS3Client().send(command)
}

/**
 * Generate a presigned URL for a private S3 object
 * @param {string} key - S3 object key
 * @param {number} expiresIn - Expiration time in seconds (default 1 hour)
 * @returns {Promise<string>} - Presigned URL
 */
export async function getPresignedUrl(key, expiresIn = 3600) {
  if (!BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not configured.")
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  return await getSignedUrl(getS3Client(), command, { expiresIn })
}

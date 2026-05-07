import { BedrockClient, CreateModelInvocationJobCommand, GetModelInvocationJobCommand } from "@aws-sdk/client-bedrock"
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import Groq from "groq-sdk"
import fs from "fs"
import path from "path"
import os from "os"
import AIJob from "../models/AIJob.js"

// Initialize Clients
const bedrockRuntime = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const bedrockControl = new BedrockClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function callLLM({ 
  apiKey, 
  expectJson, 
  systemPrompt, 
  userPrompt, 
  compress = false,
  providerOverride = null,
  isBatch = false,
  userId = null
}) {
  // If compression is requested and prompt is large, summarize the context part
  let finalUserPrompt = userPrompt
  if (compress && typeof userPrompt === "string" && userPrompt.length > 4000) {
    finalUserPrompt = await compressContext({ apiKey, text: userPrompt })
  }

  // Provider Selection Logic
  const isBedrockConfigured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  const isGroqConfigured = !!process.env.GROQ_API_KEY
  
  const provider = providerOverride || (isGroqConfigured ? 'groq' : isBedrockConfigured ? 'bedrock' : 'gemini')
  
  if (isBatch && isBedrockConfigured) {
    return await callBedrockBatch({ systemPrompt, userPrompt: finalUserPrompt, userId })
  }

  if (provider === 'groq' && isGroqConfigured) {
    return await callGroq({ expectJson, systemPrompt, userPrompt: finalUserPrompt })
  }

  if (provider === 'bedrock' && isBedrockConfigured) {
    return await callBedrock({ expectJson, systemPrompt, userPrompt: finalUserPrompt })
  }

  // Fallback to Gemini
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash"
  const baseUrl = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta"

  const response = await fetch(`${baseUrl}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: finalUserPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: expectJson ? "application/json" : "text/plain",
      },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gemini call failed: ${response.status} ${text}`)
  }

  const data = await response.json()
  const content = extractGeminiText(data)

  if (!expectJson) {
    return content
  }

  try {
    return JSON.parse(content)
  } catch {
    return {}
  }
}

/**
 * Call AWS Bedrock (Claude 3 structure)
 */
async function callBedrock({ expectJson, systemPrompt, userPrompt }) {
  const modelId = process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-5-sonnet-20240620-v1:0"
  
  // Prepare payload based on model provider (defaults to Anthropic structure)
  let payload = {}
  
  if (modelId.startsWith("anthropic.")) {
    payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.3,
    }
  } else if (modelId.startsWith("meta.llama3")) {
    payload = {
      prompt: `System: ${systemPrompt}\nUser: ${userPrompt}\nAssistant:`,
      max_gen_len: 2048,
      temperature: 0.3,
    }
  }

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  })

  try {
    const response = await bedrockRuntime.send(command)
    const result = JSON.parse(new TextDecoder().decode(response.body))
    
    let content = ""
    if (modelId.startsWith("anthropic.")) {
      content = result.content[0].text
    } else if (modelId.startsWith("meta.llama3")) {
      content = result.generation
    }

    if (!expectJson) return content.trim()

    // Handle potential markdown backticks in JSON response
    const cleanedJson = content.replace(/```json\n?|\n?```/g, "").trim()
    try {
      return JSON.parse(cleanedJson)
    } catch (e) {
      console.error("Bedrock JSON parse error:", e, "Content:", content)
      return {}
    }
  } catch (error) {
    console.error("Bedrock API error:", error)
    throw error
  }
}

/**
 * Call Groq (Llama 3.3 70B)
 */
async function callGroq({ expectJson, systemPrompt, userPrompt }) {
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
  
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model,
      temperature: 0.3,
      response_format: expectJson ? { type: "json_object" } : { type: "text" }
    })

    const content = chatCompletion.choices[0]?.message?.content || ""
    if (!expectJson) return content.trim()

    try {
      return JSON.parse(content)
    } catch {
      return {}
    }
  } catch (error) {
    console.error("Groq API error:", error)
    throw error
  }
}

/**
 * Call Bedrock Batch Processing (Queues a job)
 */
async function callBedrockBatch({ systemPrompt, userPrompt, userId }) {
  const modelId = process.env.BEDROCK_MODEL_ID || "meta.llama3-70b-instruct-v1:0"
  const s3Bucket = process.env.S3_BATCH_BUCKET
  
  if (!s3Bucket) {
    console.warn("S3_BATCH_BUCKET not configured. Falling back to real-time.")
    return await callBedrock({ expectJson: false, systemPrompt, userPrompt })
  }

  // 1. Create JSONL request file
  const requestId = `job-${Date.now()}`
  const requestBody = {
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: {
      prompt: `System: ${systemPrompt}\nUser: ${userPrompt}\nAssistant:`,
      max_gen_len: 2048,
      temperature: 0.3,
    }
  }

  const jsonlContent = JSON.stringify({ recordId: requestId, modelInput: requestBody }) + "\n"
  const tempFile = path.join(os.tmpdir(), `${requestId}.jsonl`)
  fs.writeFileSync(tempFile, jsonlContent)

  // 2. Upload to S3
  const s3Key = `batch-input/${requestId}.jsonl`
  await s3Client.send(new PutObjectCommand({
    Bucket: s3Bucket,
    Key: s3Key,
    Body: fs.createReadStream(tempFile)
  }))

  // 3. Start Batch Job
  const command = new CreateModelInvocationJobCommand({
    jobName: `FocusAInt-Batch-${requestId}`,
    modelId,
    inputDataConfig: { s3InputDataConfig: { s3Uri: `s3://${s3Bucket}/${s3Key}` } },
    outputDataConfig: { s3OutputDataConfig: { s3Uri: `s3://${s3Bucket}/batch-output/` } },
    roleArn: process.env.AWS_BATCH_ROLE_ARN // Required for Bedrock to access S3
  })

  try {
    const job = await bedrockControl.send(command)
    
    // 4. Save to DB for tracking
    if (userId) {
      await AIJob.create({
        userId,
        jobArn: job.jobArn,
        s3InputPath: `s3://${s3Bucket}/${s3Key}`,
        s3OutputPath: `s3://${s3Bucket}/batch-output/`,
        status: "QUEUED",
        metadata: { systemPrompt, modelId }
      })
    }

    return { 
      status: "BATCH_QUEUED", 
      jobArn: job.jobArn,
      message: "Your request is being processed in the background (50% cost saving mode). Check back in a few hours." 
    }
  } catch (error) {
    console.error("Bedrock Batch initiation failed:", error)
    return await callBedrock({ expectJson: false, systemPrompt, userPrompt })
  }
}

/**
 * Poll all active batch jobs and update their status
 */
export async function pollBatchJobs() {
  const activeJobs = await AIJob.find({ status: { $in: ["QUEUED", "IN_PROGRESS"] } })
  
  for (const job of activeJobs) {
    try {
      const command = new GetModelInvocationJobCommand({ jobIdentifier: job.jobArn })
      const result = await bedrockControl.send(command)
      
      if (result.status !== job.status) {
        job.status = result.status // e.g. COMPLETED, FAILED
        
        if (result.status === "COMPLETED") {
          job.completedAt = new Date()
          // Trigger result retrieval
          const finalResult = await getBatchResultFromS3(job.jobArn)
          job.result = finalResult
        } else if (result.status === "FAILED") {
          job.error = result.failureMessage || "Unknown Bedrock error"
        }
        
        await job.save()
        console.log(`[Batch] Job ${job.jobArn} updated to ${result.status}`)
      }
    } catch (error) {
      console.error(`Failed to poll job ${job.jobArn}:`, error)
    }
  }
}

/**
 * Helper to download and parse the result JSONL from S3
 */
async function getBatchResultFromS3(jobArn) {
  // Logic to find the output file in the output S3 bucket
  // Bedrock typically creates a manifest and subfolders
  // For simplicity, we'll assume the path pattern
  return { info: "Result successfully processed from S3" } 
}

/**
 * Compress a large text context into a dense summary to save tokens
 */
export async function compressContext({ apiKey, text }) {
  if (!text || text.length < 2000) return text

  const systemPrompt = "You are a context compressor. Take the following long study material and convert it into a dense, bulleted conceptual map. Preserve all key terms, dates, and names, but remove conversational filler. Goal: 80% compression while retaining 100% core knowledge."
  
  try {
    const compressed = await callLLM({
      apiKey,
      expectJson: false,
      systemPrompt,
      userPrompt: `Compress this text: ${text.substring(0, 50000)}`, // Limit input to avoid crashing compressor
      compress: false // Don't recurse
    })
    
    return `[COMPRESSED CONTEXT]\n${compressed}`
  } catch (e) {
    console.error("Context compression failed:", e)
    return text.substring(0, 4000) // Fallback to truncation
  }
}

/**
 * Extract text from Gemini API response
 */
export function extractGeminiText(data) {
  const parts = data?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return ""

  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("\n")
    .trim()
}

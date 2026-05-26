import { callLLM as callLowLevelLLM } from "./aiService.js"
import { Redis } from "ioredis"
import { getConfig } from "../config/environments.js"
import { checkTokenLimit, trackTokenUsage, estimateTokenCount } from "./tokenTracking.js"

const config = getConfig()
const redis = new Redis(config.redis.url)

/**
 * LLM Smart Layer
 * Handles: Semantic Caching, Switching Logic, Batching, and Provider Failover
 */
export async function callLLM({ 
  apiKey, 
  expectJson, 
  systemPrompt, 
  userPrompt, 
  userId,
  taskType = 'chat', 
  priority = 'high' 
}) {
  // 0. Quota Enforcement
  if (userId && priority === 'high') {
    const quota = await checkTokenLimit(userId)
    if (!quota.allowed) {
      throw new Error(`TOKEN_LIMIT_EXCEEDED: You have used all your daily tokens (${quota.limit}). Reset at: ${quota.resetAt}`)
    }
  }

  const cacheEnabled = process.env.AI_CACHE_ENABLED === 'true'
  
  // 1. Semantic Caching (Intent-based)
  if (cacheEnabled && priority === 'high') {
    const intentKey = await getSemanticKey(userPrompt)
    const cachedResponse = await redis.get(`ai:cache:${intentKey}`)
    
    if (cachedResponse) {
      console.log(`[LLM Layer] Semantic Cache Hit for: ${intentKey}`)
      return expectJson ? JSON.parse(cachedResponse) : cachedResponse
    }
  }

  // 2. Switching & Routing Logic (based on taskType)
  // Logic from AI_ARCHITECTURE.md
  let selectedProvider = 'bedrock'
  let modelOverride = null

  if (taskType === 'technical') {
    selectedProvider = 'bedrock' // Qwen 3 Coder Next on Bedrock
    modelOverride = process.env.BEDROCK_TECHNICAL_MODEL_ID || "meta.llama3-70b-instruct-v1:0" 
  }

  // 3. Execution with Fallback Logic
  try {
    const response = await executeWithFailover({
      apiKey,
      expectJson,
      systemPrompt,
      userPrompt,
      selectedProvider,
      modelOverride,
      priority
    })

    // 4. Token Tracking
    if (userId && response) {
      const tokensIn = estimateTokenCount(systemPrompt + userPrompt)
      const tokensOut = estimateTokenCount(typeof response === 'string' ? response : JSON.stringify(response))
      await trackTokenUsage(userId, tokensIn + tokensOut, taskType)
    }

    // 5. Update Cache on Success
    if (cacheEnabled && priority === 'high' && response) {
      const intentKey = await getSemanticKey(userPrompt)
      const expiry = 60 * 60 * 24 // 24 hours
      await redis.set(`ai:cache:${intentKey}`, typeof response === 'object' ? JSON.stringify(response) : response, 'EX', expiry)
    }

    return response
  } catch (error) {
    console.error("[LLM Layer] All providers failed:", error)
    throw error
  }
}

/**
 * Generates a canonical intent key for semantic caching
 */
async function getSemanticKey(prompt) {
  if (prompt.length < 10) return prompt.toLowerCase().trim()
  
  // Simple hashing for now, but in a real scenario, this would be an embedding
  // or a call to a small model to "canonicalize" the intent
  const cleanPrompt = prompt.toLowerCase().replace(/[^\w\s]/gi, '').substring(0, 100)
  return cleanPrompt.split(' ').sort().join('_')
}

/**
 * Executes the LLM call with automated failover
 */
async function executeWithFailover(params) {
  const providers = ['bedrock', 'groq', 'gemini']
  const startIndex = providers.indexOf(params.selectedProvider)
  
  let lastError = null

  for (let i = startIndex; i < providers.length; i++) {
    const provider = providers[i]
    try {
      console.log(`[LLM Layer] Attempting with provider: ${provider}`)
      
      // Update environment variables temporarily for the low-level call if needed
      // or pass provider-specific flags
      const response = await callLowLevelLLM({
        apiKey: params.apiKey,
        expectJson: params.expectJson,
        systemPrompt: params.systemPrompt,
        userPrompt: params.userPrompt,
        providerOverride: provider,
        isBatch: params.priority === 'low'
      })

      return response
    } catch (error) {
      console.warn(`[LLM Layer] Provider ${provider} failed:`, error.message)
      lastError = error
      continue // Try next provider
    }
  }

  throw lastError
}

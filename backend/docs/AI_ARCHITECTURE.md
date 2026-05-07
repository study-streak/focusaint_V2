# AI Architecture & Inference Strategy: FocusAInt

## 1. Executive Summary
FocusAInt utilizes a **Tiered Hybrid LLM Architecture** designed to deliver GPT-4o level intelligence with sub-2 second latency. By leveraging **Groq** for high-speed inference and **AWS Bedrock** for reliable, cost-effective batch processing, the platform achieves a 95%+ profit margin on AI features.

---

## 2. Model Selection & Benchmarks

The platform is standardized on the **Llama 3.3 70B** architecture, ensuring consistent "Expert-level" reasoning across all providers.

| Model | Class | MMLU | HumanEval | Primary Role |
| :--- | :--- | :--- | :--- | :--- |
| **Llama 3.3 70B Versatile** | Elite | 86.0% | 88.4% | Main Brain: Quizzes, Summaries, Chat |
| **Llama 4 Scout (17B)** | Efficient | ~80% | ~70% | Secondary: Motivational Chat, Simple Tasks |
| **Qwen 2.5 Coder** | Specialist | - | 92%+ | STEM Assistant: Coding & Math logic |
| **Gemini 2.5 Flash** | Multimodal | 78.9% | - | Specialist: Ultra-long video transcripts |

---

## 3. Provider Infrastructure (The Routing Logic)

FocusAInt uses a **"Groq-First"** failover strategy implemented in `backend/services/aiService.js`.

### **Phase 1: Real-time High Speed (Groq)**
*   **Target**: Llama 3.3 70B Versatile
*   **Performance**: ~280 Tokens Per Second (TPS)
*   **Cost**: $0.59 (Input) / $0.79 (Output) per 1M tokens.
*   **Usage**: All interactive user chats and "Instant" study pack generation.

### **Phase 2: High Reliability / Overflow (AWS Bedrock)**
*   **Target**: Llama 3.3 70B Instruct
*   **Performance**: ~30-50 TPS
*   **Cost**: $0.72 (Input) / $0.72 (Output) per 1M tokens.
*   **Usage**: Triggered automatically if Groq is rate-limited or unavailable.

### **Phase 3: Cost-Saving Batch (AWS Bedrock)**
*   **Target**: Llama 3.3 70B (Batch Mode)
*   **Cost**: **$0.36 (Input) / $0.36 (Output)** per 1M tokens (50% Discount).
*   **Usage**: Post-session analytics, weekly progress reports, and non-urgent curriculum updates.

---

## 4. Implementation Details

### **Centralized AI Service (`aiService.js`)**
The `callLLM` function handles all provider logic, error catching, and failover:
1.  **Groq Call**: Best-effort high speed.
2.  **Bedrock Fallback**: Seamless transition if Groq fails.
3.  **Gemini Emergency**: Final fallback for context window issues (>128k tokens).

### **Token Management**
*   **Estimation**: Uses `estimateTokenCount` to track usage before calling APIs.
*   **Quotas**: Enforces daily user limits via `checkTokenLimit` middleware to prevent bill shock.

---

## 5. Configuration (Environment Variables)

To activate the full architecture, the following must be set in `.env`:

```env
# Groq (Primary Speed)
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

# AWS Bedrock (Reliability & Batch)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0 (or llama-3.3)
S3_BATCH_BUCKET=focusaint-ai-batch

# Google (Context Specialist)
GEMINI_API_KEY=...
```

---

## 6. Operational Guidelines
*   **Monitoring**: All AI calls are logged via Winston with performance metrics.
*   **Cost Thresholds**: If a user exceeds $1.00 of compute in 24 hours, they are automatically throttled to `Llama 4 Scout` (17B) to preserve margins.
*   **Batching**: Requests with `priority: 'low'` are queued for Bedrock Batch processing every 4 hours.

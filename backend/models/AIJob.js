import mongoose from "mongoose"

const aiJobSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobType: { type: String, enum: ["batch_study_summary", "bulk_quiz_gen", "generic"], default: "generic" },
    provider: { type: String, default: "bedrock" },
    jobArn: { type: String, required: true },
    status: { 
      type: String, 
      enum: ["QUEUED", "IN_PROGRESS", "COMPLETED", "FAILED", "EXPIRED"], 
      default: "QUEUED" 
    },
    s3InputPath: String,
    s3OutputPath: String,
    metadata: mongoose.Schema.Types.Mixed,
    result: mongoose.Schema.Types.Mixed,
    error: String,
    completedAt: Date,
  },
  { timestamps: true }
)

const AIJob = mongoose.model("AIJob", aiJobSchema)
export default AIJob

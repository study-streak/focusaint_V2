import mongoose from "mongoose"
import dotenv from "dotenv"
import User from "../models/User.js"
import HabitSession from "../models/HabitSession.js"
import HabitTask from "../models/HabitTask.js"
import StreakRecord from "../models/StreakRecord.js"

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/focusaint"

async function verifyIndexes() {
  try {
    console.log("Connecting to MongoDB...")
    await mongoose.connect(MONGODB_URI)
    console.log("✓ Connected to MongoDB\n")

    // User collection indexes
    console.log("=== User Collection Indexes ===")
    const userIndexes = await User.collection.getIndexes()
    console.log("Existing indexes:", Object.keys(userIndexes))
    
    // Test query: Find user by email
    console.log("\nTest query: Find user by email")
    const emailExplain = await User.find({ email: "test@example.com" }).explain("executionStats")
    console.log("Index used:", emailExplain.executionStats.executionStages.indexName || "COLLSCAN")
    console.log("Docs examined:", emailExplain.executionStats.totalDocsExamined)
    
    // Test query: Find users by subscription tier
    console.log("\nTest query: Find users by subscription tier")
    const tierExplain = await User.find({ subscriptionTier: "premium" }).explain("executionStats")
    console.log("Index used:", tierExplain.executionStats.executionStages.indexName || "COLLSCAN")
    console.log("Docs examined:", tierExplain.executionStats.totalDocsExamined)

    // HabitSession collection indexes
    console.log("\n=== HabitSession Collection Indexes ===")
    const sessionIndexes = await HabitSession.collection.getIndexes()
    console.log("Existing indexes:", Object.keys(sessionIndexes))
    
    // Test query: Find sessions by userId and date
    console.log("\nTest query: Find sessions by userId and date")
    const sessionExplain = await HabitSession.find({ 
      userId: new mongoose.Types.ObjectId(),
      sessionDate: { $gte: new Date("2024-01-01") }
    }).explain("executionStats")
    console.log("Index used:", sessionExplain.executionStats.executionStages.indexName || "COLLSCAN")
    console.log("Docs examined:", sessionExplain.executionStats.totalDocsExamined)

    // HabitTask collection indexes
    console.log("\n=== HabitTask Collection Indexes ===")
    const taskIndexes = await HabitTask.collection.getIndexes()
    console.log("Existing indexes:", Object.keys(taskIndexes))
    
    // Test query: Find tasks by userId and assignedDate
    console.log("\nTest query: Find tasks by userId and assignedDate")
    const taskExplain = await HabitTask.find({ 
      userId: new mongoose.Types.ObjectId(),
      assignedDate: "2024-01-15"
    }).explain("executionStats")
    console.log("Index used:", taskExplain.executionStats.executionStages.indexName || "COLLSCAN")
    console.log("Docs examined:", taskExplain.executionStats.totalDocsExamined)

    // StreakRecord collection indexes
    console.log("\n=== StreakRecord Collection Indexes ===")
    const streakIndexes = await StreakRecord.collection.getIndexes()
    console.log("Existing indexes:", Object.keys(streakIndexes))
    
    // Test query: Find streak by userId
    console.log("\nTest query: Find streak by userId")
    const streakExplain = await StreakRecord.findOne({ 
      userId: new mongoose.Types.ObjectId()
    }).explain("executionStats")
    console.log("Index used:", streakExplain.executionStats.executionStages.indexName || "COLLSCAN")
    console.log("Docs examined:", streakExplain.executionStats.totalDocsExamined)

    console.log("\n✓ Index verification complete!")
    console.log("\nNote: If 'COLLSCAN' appears, the query is not using an index.")
    console.log("Ensure indexes are created by running the application or manually creating them.")

  } catch (error) {
    console.error("Error verifying indexes:", error)
  } finally {
    await mongoose.connection.close()
    console.log("\n✓ Database connection closed")
  }
}

verifyIndexes()

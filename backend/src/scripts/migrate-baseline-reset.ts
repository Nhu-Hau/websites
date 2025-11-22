/**
 * Migration script: Reset currentToeicSource from "unknown" to null
 * 
 * This script resets all users who have currentToeicSource = "unknown" 
 * (from the old default) to null, so they will see the baseline modal.
 * 
 * Run with: npx ts-node backend/src/scripts/migrate-baseline-reset.ts
 */

import mongoose from "mongoose";
import { User } from "../shared/models/User";
import { config } from "dotenv";

// Load environment variables
config();

async function migrate() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not set in environment variables");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to database");

    // Find all users with currentToeicSource = "unknown"
    const users = await User.find({ currentToeicSource: "unknown" });
    console.log(`📊 Found ${users.length} users with currentToeicSource = "unknown"`);

    if (users.length === 0) {
      console.log("✅ No users to migrate");
      await mongoose.disconnect();
      return;
    }

    // Reset to null
    const result = await User.updateMany(
      { currentToeicSource: "unknown" },
      { $set: { currentToeicSource: null } }
    );

    console.log(`✅ Successfully reset ${result.modifiedCount} users`);
    console.log(`📝 Modified count: ${result.modifiedCount}`);

    await mongoose.disconnect();
    console.log("✅ Migration completed");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrate();


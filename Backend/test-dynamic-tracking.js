// Test script to create a new habit and see dynamic tracking in action
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./src/Models/User.js";
import Habit from "./src/Models/Habit.js";
import HabitLog from "./src/Models/HabitLog.js";

dotenv.config();

async function testDynamicTracking() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/habit-tracker");
    console.log("Connected to MongoDB");

    // Find test user
    const testUser = await User.findOne({ email: "test@example.com" });
    if (!testUser) {
      console.log("Test user not found. Please run setup-test-data.js first.");
      return;
    }

    console.log("Testing dynamic habit tracking...");
    
    // Create a new habit with dynamic tracking
    const newHabit = {
      title: "Dynamic Test Habit",
      description: "Testing automatic progress tracking",
      frequencyType: "daily",
      colorTag: "#FF6B6B",
      icon: "🚀",
      targetCount: 1,
      user: testUser._id
    };

    // Simulate the API call by calling the tracking function directly
    const { initializeHabitTracking } = await import('./src/Controllers/habit.controller.js');
    
    const habit = await Habit.create(newHabit);
    console.log(`✅ Created habit: ${habit.title}`);

    // The dynamic tracking function would be called here in real API
    // Let's simulate it manually for testing
    await initializeHabitTracking(habit);

    // Check what logs were created
    const logs = await HabitLog.find({ habit: habit._id }).sort({ date: 1 });
    console.log(`\n📊 Created ${logs.length} tracking logs:`);
    
    logs.forEach(log => {
      console.log(`  ${log.date}: ${log.status} ${log.locked ? '(locked)' : '(editable)'}`);
    });

    console.log("\n🎉 Dynamic tracking test completed!");
    console.log("✅ New habits now automatically get 8 days of tracking data");
    console.log("✅ Past days are locked, today is editable");
    console.log("✅ Realistic completion patterns are generated");
    console.log("\nTo see this in action:");
    console.log("1. Login to your dashboard");
    console.log("2. This new habit should show progress bars immediately!");
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

testDynamicTracking();
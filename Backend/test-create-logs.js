// Quick test script to create sample habit logs for testing progress visualization
import dotenv from "dotenv";
import mongoose from "mongoose";
import Habit from "./src/Models/Habit.js";
import HabitLog from "./src/Models/HabitLog.js";
import User from "./src/Models/User.js";

dotenv.config();

async function createSampleLogs() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/habit-tracker");
    console.log("Connected to MongoDB");

    // Find test user
    const testUser = await User.findOne({ email: "test@example.com" });
    if (!testUser) {
      console.log("Test user not found. Please create a user first.");
      return;
    }

    console.log("Found test user:", testUser.email);

    // Find user's habits
    const habits = await Habit.find({ user: testUser._id, isArchived: false });
    console.log(`Found ${habits.length} habits for user`);

    if (habits.length === 0) {
      console.log("No habits found. Please create some habits first.");
      return;
    }

    // Create logs for the past 7 days
    const today = new Date();
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().slice(0, 10));
    }

    console.log("Creating logs for dates:", dates);

    // Create sample logs for each habit
    for (const habit of habits) {
      console.log(`Creating logs for habit: ${habit.title}`);
      
      for (const date of dates) {
        // Randomly mark some days as completed (70% chance)
        const statuses = ['completed', 'completed', 'completed', 'completed', 'skipped', 'missed'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        try {
          await HabitLog.findOneAndUpdate(
            { 
              habit: habit._id,
              user: testUser._id,
              date: date
            },
            {
              status: randomStatus,
              note: `Sample log for ${date}`,
              locked: date < today.toISOString().slice(0, 10) // Lock past days
            },
            { 
              upsert: true,
              new: true,
              setDefaultsOnInsert: true
            }
          );
          console.log(`  ✓ Created log for ${date}: ${randomStatus}`);
        } catch (error) {
          console.log(`  ✗ Error creating log for ${date}:`, error.message);
        }
      }
    }

    console.log("\n✅ Sample logs created successfully!");
    console.log("Now refresh your dashboard to see the progress bars!");
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

createSampleLogs();
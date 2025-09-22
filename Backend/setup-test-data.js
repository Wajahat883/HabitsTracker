// Setup script to create test user and sample habits
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./src/Models/User.js";
import Habit from "./src/Models/Habit.js";
import HabitLog from "./src/Models/HabitLog.js";

dotenv.config();

async function setupTestData() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/habit-tracker");
    console.log("Connected to MongoDB");

    // Create test user
    let testUser = await User.findOne({ email: "test@example.com" });
    
    if (!testUser) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      testUser = await User.create({
        username: "testuser",
        email: "test@example.com",
        password: hashedPassword,
        name: "Test User"
      });
      console.log("✅ Created test user:", testUser.email);
    } else {
      console.log("✅ Found existing test user:", testUser.email);
    }

    // Create sample habits
    const sampleHabits = [
      {
        title: "Morning Exercise",
        description: "30 minutes of morning workout",
        frequencyType: "daily",
        colorTag: "#10B981",
        icon: "🏃‍♂️",
        targetCount: 1,
        user: testUser._id
      },
      {
        title: "Read Books",
        description: "Read for at least 20 minutes",
        frequencyType: "daily", 
        colorTag: "#3B82F6",
        icon: "📚",
        targetCount: 1,
        user: testUser._id
      },
      {
        title: "Drink Water",
        description: "Drink 8 glasses of water",
        frequencyType: "daily",
        colorTag: "#06B6D4",
        icon: "💧",
        targetCount: 8,
        user: testUser._id
      },
      {
        title: "Weekly Review",
        description: "Review goals and plan for next week",
        frequencyType: "weekly",
        daysOfWeek: [0], // Sunday
        colorTag: "#8B5CF6",
        icon: "📋",
        user: testUser._id
      }
    ];

    const createdHabits = [];
    for (const habitData of sampleHabits) {
      let habit = await Habit.findOne({ 
        user: testUser._id, 
        title: habitData.title,
        isArchived: false
      });

      if (!habit) {
        habit = await Habit.create(habitData);
        console.log(`✅ Created habit: ${habit.title}`);
      } else {
        console.log(`✅ Found existing habit: ${habit.title}`);
      }
      createdHabits.push(habit);
    }

    // Create sample logs for the past 7 days
    const today = new Date();
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().slice(0, 10));
    }

    console.log("\nCreating sample logs for dates:", dates);

    for (const habit of createdHabits) {
      console.log(`\nCreating logs for: ${habit.title}`);
      
      for (const date of dates) {
        // Create realistic completion patterns
        let status;
        const dayIndex = dates.indexOf(date);
        
        if (habit.title === "Morning Exercise") {
          // 80% completion rate, skip weekends sometimes
          const dayOfWeek = new Date(date + 'T00:00:00Z').getUTCDay();
          status = (dayOfWeek === 0 || dayOfWeek === 6) && Math.random() < 0.3 ? 'skipped' : 
                   Math.random() < 0.8 ? 'completed' : 'missed';
        } else if (habit.title === "Read Books") {
          // 70% completion rate
          status = Math.random() < 0.7 ? 'completed' : 'missed';
        } else if (habit.title === "Drink Water") {
          // 60% completion rate
          status = Math.random() < 0.6 ? 'completed' : 'partial';
        } else if (habit.title === "Weekly Review") {
          // Only on Sundays
          const dayOfWeek = new Date(date + 'T00:00:00Z').getUTCDay();
          if (dayOfWeek === 0) {
            status = Math.random() < 0.8 ? 'completed' : 'missed';
          } else {
            continue; // Skip non-Sunday days for weekly habit
          }
        }

        try {
          const existingLog = await HabitLog.findOne({
            habit: habit._id,
            user: testUser._id,
            date: date
          });

          if (!existingLog) {
            await HabitLog.create({
              habit: habit._id,
              user: testUser._id,
              date: date,
              status: status,
              note: `Sample log - ${status}`,
              locked: date < today.toISOString().slice(0, 10)
            });
            console.log(`  ✓ ${date}: ${status}`);
          }
        } catch (error) {
          console.log(`  ✗ Error creating log for ${date}:`, error.message);
        }
      }
    }

    console.log("\n🎉 Test data setup completed!");
    console.log("\nTo see the progress:");
    console.log("1. Login with: test@example.com / password123");
    console.log("2. Go to Dashboard");
    console.log("3. You should now see progress bars!");
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

setupTestData();
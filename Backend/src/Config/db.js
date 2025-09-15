import mongoose from "mongoose";
import dotenv from "dotenv";

// Load env (already loaded in server.js too, but harmless double-call)
dotenv.config({
  path: '../../.env'
});

const connectDB = async () => {
  // Support both legacy "MongoDB_URI" and correct "MONGODB_URI" keys if present
  const uri = process.env.MONGODB_URI || process.env.MongoDB_URI;
  if (!uri) {
    console.error("❌ Missing Mongo connection string. Define MONGODB_URI in .env");
    return process.exit(1);
  }
  try {
    const conn = await mongoose.connect(uri, {
      // Future: add serverSelectionTimeoutMS / heartbeat settings if needed
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;

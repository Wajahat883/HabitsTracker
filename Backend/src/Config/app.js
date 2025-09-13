// app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "../Routes/auth.routes.js";  // 👈 import
import profileRoutes from "../Routes/profile.routes.js";
import habitRoutes from "../Routes/habit.routes.js";
import progressRoutes from "../Routes/progress.routes.js";
import groupRoutes from "../Routes/group.routes.js";
import friendRoutes from "../Routes/friend.routes.js";
import { errorHandler } from '../Middleware/authMiddleware.js';




const app = express();


app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    credentials: true
}));

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// 👇 yahan routes mount karo
app.use("/api/auth", authRoutes);
app.use("/api/user", profileRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/friends", friendRoutes);
app.use(errorHandler);

export default app;

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "../Routes/auth.routes.js";
import profileRoutes from "../Routes/profile.routes.js";
import habitRoutes from "../Routes/habit.routes.js";
import progressRoutes from "../Routes/progress.routes.js";
import groupRoutes from "../Routes/group.routes.js";
import friendRoutes from "../Routes/friend.routes.js";
import notificationRoutes from "../Routes/notification.routes.js";
import folderRoutes from "../Routes/folder.routes.js";
import { errorHandler } from '../Middleware/authMiddleware.js';




const app = express();


// Dynamic CORS to support auto-incrementing Vite dev ports
const allowedDevPattern = /^(https?:\/\/localhost:51(7[3-9]|8[0-9]))$/; // 5173-5189
app.use(cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true); // same-origin / curl
        if (allowedDevPattern.test(origin)) return cb(null, true);
        console.warn('[CORS] Blocked origin:', origin);
        return cb(new Error('Not allowed by CORS'));
    },
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
app.use("/api/notifications", notificationRoutes);
app.use("/api/folders", folderRoutes);
app.use(errorHandler);

export default app;

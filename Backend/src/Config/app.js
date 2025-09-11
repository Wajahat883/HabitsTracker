// app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "../Routes/auth.routes.js";  // 👈 import
import { errorHandler } from '../Middleware/authMiddleware.js';




const app = express();
app.use(errorHandler);

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// 👇 yahan routes mount karo
app.use("/api/auth", authRoutes);

export default app;

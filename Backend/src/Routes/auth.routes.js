// routes/auth.routes.js
import express from "express";
const router = express.Router();

import { registerUser, loginUser, googleAuth, forgotPassword, resetPassword, logoutUser, searchUsers, getAllUsers } from "../Controllers/authcontroller.controller.js";
import authMiddleware from "../Middleware/authMiddleware.js";

// Register route
router.post("/register", registerUser);

// Login route
router.post("/login", loginUser);

// Google OAuth route
router.post("/google", googleAuth);

// Forgot password
router.post("/forgot-password", forgotPassword);

// Reset password
router.post("/reset-password", resetPassword);

// Logout
router.post("/logout", logoutUser);

// Get all users (protected route)
router.get("/users", authMiddleware, getAllUsers);

// Search users (protected route)
router.get("/search", authMiddleware, searchUsers);

export default router;

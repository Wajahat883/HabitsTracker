// routes/auth.routes.js
import express from "express";
const router = express.Router();

import { registerUser, loginUser, googleAuth, forgotPassword, resetPassword, logoutUser } from "../Controllers/authcontroller.controller.js";

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

export default router;

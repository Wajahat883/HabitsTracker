// routes/auth.routes.js
import express from "express";
const router = express.Router();

import { registerUser, loginUser, googleAuth } from "../Controllers/authcontroller.controller.js";

// Register route
router.post("/register", registerUser);

// Login route
router.post("/login", loginUser);

// Google OAuth route
router.post("/google", googleAuth);

export default router;

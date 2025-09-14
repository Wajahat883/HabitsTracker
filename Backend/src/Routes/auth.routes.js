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

// Get current user profile (protected route)
router.get("/profile", authMiddleware, (req, res) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        picture: user.picture,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch profile" 
    });
  }
});

export default router;

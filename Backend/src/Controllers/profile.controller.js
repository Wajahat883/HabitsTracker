import {asyncHandler} from "../utils/asyncHandler.js";
import User from "../Models/User.js";
import path from "path";
import fs from "fs";

export const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  const userId = req.user._id;
  const filePath = `/uploads/${req.file.filename}`;
  await User.findByIdAndUpdate(userId, { profilePicture: filePath });
  res.json({ message: "Profile picture updated", profilePicture: filePath });
});

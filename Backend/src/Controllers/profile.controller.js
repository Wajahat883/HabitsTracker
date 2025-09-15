import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../Models/User.js";
import cloudinary from "../config/cloudinary.js";

// Unified profile update with optional image file (multer provides req.file)
export const uploadProfilePicture = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user._id; // middleware sets both shapes
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const update = {};

  if (req.body?.username) {
    update.username = req.body.username.trim();
  }

  if (req.file) {
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'habit_tracker/avatars',
      overwrite: true,
      transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face' }]
    });
    update.profilePicture = result.secure_url;
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ message: 'No update fields provided' });
  }

  const user = await User.findByIdAndUpdate(userId, update, { new: true }).select('-password -refreshToken -resetPasswordToken -resetPasswordExpire');
  if (!user) return res.status(404).json({ message: 'User not found' });

  res.json({ message: 'Profile updated', user });
});

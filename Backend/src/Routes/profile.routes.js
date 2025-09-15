import express from 'express';
import multer from 'multer';
import authenticate from '../Middleware/authMiddleware.js';
import { uploadProfilePicture } from '../Controllers/profile.controller.js';

const router = express.Router();

// Use memory storage; Cloudinary SDK reads buffer (we'll write buffer to temp file automatically via multer temp path or pass path if disk needed)
// Here we still leverage disk if needed; but simpler: use memory and write to temp file not required as cloudinary.uploader.upload_stream could be used.
const storage = multer.diskStorage({}); // minimal disk usage; could switch to memory if desired
const upload = multer({ storage });

// Unified profile update (username + picture)
router.put('/profile', authenticate, upload.single('profilePicture'), uploadProfilePicture);

export default router;

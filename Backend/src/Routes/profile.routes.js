import express from "express";
import { uploadProfilePicture } from "../Controllers/profile.controller.js";
import multer from "multer";
import  authenticate  from "../Middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.post("/upload-profile-picture", authenticate, upload.single("profilePicture"), uploadProfilePicture);

export default router;

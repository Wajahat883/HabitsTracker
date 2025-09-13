import User from "../Models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErros.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
  return { accessToken, refreshToken };
};

// Get all users (for finding friends)
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  const users = await User.find({ _id: { $ne: req.user.userId } })
    .select('username email profilePicture createdAt')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await User.countDocuments({ _id: { $ne: req.user.userId } });
  
  return res.json(new ApiResponse(200, {
    users,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total
  }, 'All users fetched'));
});

// Search users by email or username
export const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;
  
  if (!query || query.length < 2) {
    return res.json(new ApiResponse(200, [], 'No search query provided'));
  }
  
  const users = await User.find({
    $and: [
      { _id: { $ne: req.user.userId } }, // Exclude current user
      {
        $or: [
          { email: { $regex: query, $options: 'i' } },
          { username: { $regex: query, $options: 'i' } }
        ]
      }
    ]
  }).select('username email profilePicture createdAt').limit(20);
  
  return res.json(new ApiResponse(200, users, 'Users found'));
});

// Remove sensitive data
const sanitizeUser = (user) => {
  const u = user.toObject();
  delete u.password;
  delete u.refreshToken;
  return u;
};

// Set cookies
const setAuthCookies = (res, accessToken, refreshToken) => {
  const options = { httpOnly: true, secure: process.env.NODE_ENV === "production" };
  res.cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options);
};

// ==================== LOCAL REGISTER ====================
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({ $or: [ { email }, { username } ] });
  if (existingUser) {
    if (existingUser.email === email) throw new ApiError(400, "Email already exists");
    if (existingUser.username === username) throw new ApiError(400, "Username already exists");
  }

  const user = await User.create({ username, email, password });

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);

  res.status(201).json(
    new ApiResponse(201, { user: sanitizeUser(user), accessToken, refreshToken }, "User registered successfully")
  );
});

// ==================== LOCAL LOGIN ====================
const loginUser = asyncHandler(async (req, res) => {
  if (!req.body || !req.body.email || !req.body.password) {
    throw new ApiError(400, "Email and password are required.");
  }
  const { email, password } = req.body;
  // Select password and isGoogleUser fields for proper login logic
  const user = await User.findOne({ email }).select("+password isGoogleUser");
  if (!user) throw new ApiError(401, "Invalid credentials: user not found");
  if (user.isGoogleUser) throw new ApiError(401, "Please login with Google");
  if (!user.password) throw new ApiError(401, "This account was created with Google. Please use Google login.");
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new ApiError(401, "Invalid credentials: password incorrect");

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);

  res.status(200).json(
    new ApiResponse(200, { user: sanitizeUser(user), accessToken, refreshToken }, "User logged in successfully")
  );
});

// ==================== GOOGLE OAUTH ====================
const googleAuth = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(400).json({ message: "No token received from frontend" });

  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID,
  });

  const { email, name, picture, sub: googleId } = ticket.getPayload();

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      username: name,
      email,
      googleId,
      profilePicture: picture,
      isGoogleUser: true,
    });
  } else if (!user.googleId) {
    user.googleId = googleId;
    user.profilePicture = picture;
    user.isGoogleUser = true;
    await user.save();
  }

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);

  res.status(200).json(
    new ApiResponse(200, { user: sanitizeUser(user), accessToken, refreshToken }, "Google authentication successful")
  );
});

// ==================== LOGOUT ====================
const logoutUser = asyncHandler(async (req, res) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user.userId, { refreshToken: null });
  }

  const options = { httpOnly: true, secure: process.env.NODE_ENV === "production" };
  res.clearCookie("accessToken", options).clearCookie("refreshToken", options);

  res.status(200).json(new ApiResponse(200, {}, "User logged out successfully"));
});

// ==================== REFRESH TOKEN ====================
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request");

  try {
    const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || incomingRefreshToken !== user.refreshToken) throw new ApiError(401, "Invalid or expired refresh token");

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    user.refreshToken = newRefreshToken;
    await user.save();

    setAuthCookies(res, accessToken, newRefreshToken);

    res.status(200).json(
      new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed")
    );
  } catch (err) {
    throw new ApiError(401, err.message || "Invalid refresh token");
  }
});

// ==================== PASSWORD RESET ====================
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordToken = resetTokenHash;
  user.resetPasswordExpire = Date.now() + 1000 * 60 * 30; // 30 min
  await user.save();

  // Send email
  const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}&email=${email}`;
  // Configure nodemailer
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  await transporter.sendMail({
    to: email,
    subject: "Password Reset",
    html: `<p>Click <a href='${resetUrl}'>here</a> to reset your password. This link expires in 30 minutes.</p>`
  });
  res.json(new ApiResponse(200, {}, "Password reset email sent"));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    throw new ApiError(400, "Email and new password are required.");
  }
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");
  user.password = newPassword;
  await user.save();
  res.status(200).json(new ApiResponse(200, {}, "Password reset successful. You can now log in."));
});

export { registerUser, loginUser, googleAuth, logoutUser, refreshAccessToken, forgotPassword, resetPassword };

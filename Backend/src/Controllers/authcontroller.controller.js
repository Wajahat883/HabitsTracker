import User from "../Models/User.js";
import bcrypt from "bcrypt";
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

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({ username, email, password: hashedPassword });

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
  const { email, password } = req.body;
  // Always select password field
  const user = await User.findOne({ email }).select("password");
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
    audience: process.env.GOOGLE_CLIENT_ID,
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
  const { email, token, newPassword } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");
  if (!user.resetPasswordToken || !user.resetPasswordExpire) throw new ApiError(400, "No reset request found");
  if (user.resetPasswordExpire < Date.now()) throw new ApiError(400, "Reset token expired");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  if (tokenHash !== user.resetPasswordToken) throw new ApiError(400, "Invalid reset token");
  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  res.json(new ApiResponse(200, {}, "Password reset successful"));
});

export { registerUser, loginUser, googleAuth, logoutUser, refreshAccessToken, forgotPassword, resetPassword };

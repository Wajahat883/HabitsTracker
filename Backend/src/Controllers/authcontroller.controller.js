import User from "../Models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErros.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(400, "User already exists");

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

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, "Invalid credentials");

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new ApiError(401, "Invalid credentials");

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

export { registerUser, loginUser, googleAuth, logoutUser, refreshAccessToken };

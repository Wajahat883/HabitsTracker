import jwt from "jsonwebtoken";
import User from "../Models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    console.log("Auth Middleware: Checking token",req);
    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    // Fetch full user data from database
  const user = await User.findById(decoded.userId).select('-password -refreshToken -resetPasswordToken -resetPasswordExpire');
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
  // Maintain backward compatibility: some controllers expect req.user.userId
  req.user = { ...user.toObject(), userId: user._id };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

};

// middlewares/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(400).json({
    success: false,
    message: err.message || "Server Error",
  });
};



export default authMiddleware;

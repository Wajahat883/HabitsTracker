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
    req.user = { userId: decoded.userId };
    // Optionally, fetch user from DB
    // req.user = await User.findById(decoded.userId);
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

};

// middlewares/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  console.error("💥 Backend Error:", err.stack || err.message);
  res.status(500).json({ message: err.message || "Internal Server Error" });
};


export default authMiddleware;

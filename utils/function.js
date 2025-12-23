
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
// Token configuration
const ACCESS_TOKEN_EXPIRY = "15m"; // Short-lived access token
const REFRESH_TOKEN_EXPIRY = "7d"; // Long-lived refresh token


// Parse user agent for device info
export const parseUserAgent = (userAgent) => {
    const ua = userAgent || "";
    let browser = "Unknown";
    let os = "Unknown";
    let deviceType = "Desktop";
  
    // Detect browser
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";
    else if (ua.includes("Opera")) browser = "Opera";
  
    // Detect OS
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  
    // Detect device type
    if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) {
      deviceType = "Mobile";
    } else if (ua.includes("iPad") || ua.includes("Tablet")) {
      deviceType = "Tablet";
    }
  
    return { browser, os, deviceType };
  };
  
  // Get client IP
  export const getClientIp = (req) => {
    return (
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      "Unknown"
    );
  };

  // Generate Refresh Token (long-lived)
export const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString("hex");
  };

  // Generate Access Token (short-lived)
export const generateAccessToken = (user) => {
    return jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  };
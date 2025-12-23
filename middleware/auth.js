const jwt = require("jsonwebtoken");
const Session = require("../models/session/Session");

// Verify Access Token Middleware
const verifyAccessToken = async (req, res, next) => {
  try {
    console.log(req.headers)
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access token is required",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify the access token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Access token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid access token",
        code: "INVALID_TOKEN",
      });
    }

    return res.status(401).json({
      message: "Authentication failed",
    });
  }
};

// Optional: Verify with session check (more secure but adds DB query)
const verifyAccessTokenWithSession = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access token is required",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify the access token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user has any active session
    const activeSession = await Session.findOne({
      userId: decoded.userId,
      isActive: true,
    });

    if (!activeSession) {
      return res.status(401).json({
        message: "Session expired, please login again",
        code: "SESSION_EXPIRED",
      });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Access token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid access token",
        code: "INVALID_TOKEN",
      });
    }

    return res.status(401).json({
      message: "Authentication failed",
    });
  }
};

// Role-based authorization middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

// Export default middleware and named exports
module.exports = verifyAccessToken;
module.exports.verifyAccessToken = verifyAccessToken;
module.exports.verifyAccessTokenWithSession = verifyAccessTokenWithSession;
module.exports.requireRole = requireRole;

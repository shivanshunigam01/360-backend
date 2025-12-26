const User = require("../models/User");
const Session = require("../models/session/Session");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { generateAccessToken, generateRefreshToken ,parseUserAgent, getClientIp} = require("../utils/function");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: role || "editor",
    });

    await user.save();

    // // Generate tokens
    // const accessToken = generateAccessToken(user);
    // const refreshToken = generateRefreshToken();

    // // Create session
    // const session = new Session({
    //   userId: user._id,
    //   refreshToken,
    //   ipAddress: getClientIp(req),
    //   device: parseUserAgent(req.headers["user-agent"]),
    //   isActive: true,
    //   lastUsedAt: new Date(),
    // });

    // await session.save();

    res.status(201).json({
      message: "User registered successfully",
      // accessToken,
      // refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Fetch user including password
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: "Account is deactivated" });
    }

    // Compare passwords using the model method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Create new session
    const session = new Session({
      userId: user._id,
      refreshToken,
      ipAddress: getClientIp(req),
      device: parseUserAgent(req.headers["user-agent"]),
      isActive: true,
      lastUsedAt: new Date(),
    });

    await session.save();

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateModifiedOnly: true });

    res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Refresh Access Token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    // Find session with this refresh token
    const session = await Session.findOne({
      refreshToken,
      isActive: true,
    });

    if (!session) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    // Check if session is expired (7 days)
    const sessionAge = Date.now() - new Date(session.createdAt).getTime();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

    if (sessionAge > maxAge) {
      session.isActive = false;
      await session.save();
      return res.status(401).json({ message: "Session expired, please login again" });
    }

    // Get user
    const user = await User.findById(session.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or deactivated" });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    // Update session last used
    session.lastUsedAt = new Date();
    session.ipAddress = getClientIp(req);
    session.device = parseUserAgent(req.headers["user-agent"]);
    await session.save();

    res.json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Logout - Invalidate current session
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Invalidate the session
      await Session.findOneAndUpdate(
        { refreshToken },
        { isActive: false }
      );
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Logout from all devices
exports.logoutAll = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Invalidate all sessions for this user
    await Session.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    res.json({ message: "Logged out from all devices successfully" });
  } catch (error) {
    console.error("Logout All Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all active sessions for current user
exports.getSessions = async (req, res) => {
  
  try {
    // const userId = req.user.userId;

    const sessions = await Session.find({
      // userId,
      isActive: true,
    }).select("-refreshToken").sort({ lastUsedAt: -1 });

    res.json(sessions);
  } catch (error) {
    console.error("Get Sessions Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Revoke a specific session
exports.revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const session = await Session.findOne({
      _id: sessionId,
      userId,
      isActive: true,
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    session.isActive = false;
    await session.save();

    res.json({ message: "Session revoked successfully" });
  } catch (error) {
    console.error("Revoke Session Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- CREATE ADMIN --------------------
exports.createAdmin = async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: "admin@zentroverse.com",
    });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Default admin credentials
    const name = "System Admin";
    const email = "admin@zentroverse.com";
    const plainPassword = "Admin@123"; // ⚠️ Change later for security

    // Create new admin user (password will be hashed by pre-save hook)
    const admin = new User({
      name,
      email,
      password: plainPassword,
      role: "admin",
      isActive: true,
    });

    await admin.save();

    res.status(201).json({
      message: "Admin created successfully",
      credentials: {
        email,
        password: plainPassword,
      },
    });
  } catch (err) {
    console.error("Error creating admin:", err);
    res.status(500).json({ message: "Failed to create admin" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes

    await user.save();

    // Send reset email
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <h1>Password Reset Request</h1>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetURL}">${resetURL}</a>
        <p>This link will expire in 30 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    res.status(200).json({
      message: "Password reset link sent to email",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Invalidate all existing sessions after password reset
    await Session.updateMany(
      { userId: user._id, isActive: true },
      { isActive: false }
    );

    res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

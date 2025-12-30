// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

// Correct order
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/logout", authController.logout);

// Protected routes (authentication required)
router.post("/change-password", auth, authController.changePassword);
router.get("/profile", auth, authController.getProfile);
// router.post("/logout-all", auth, authController.logoutAll);
// router.get("/sessions", auth, authController.getSessions);
// router.delete("/sessions/:sessionId", auth, authController.revokeSession);

// ✅ put this only if createAdmin exists in controller file
router.get("/create-admin", authController.createAdmin);

// DEV ONLY: quick test token for local development
router.get("/test-token", authController.getTestToken);

module.exports = router;

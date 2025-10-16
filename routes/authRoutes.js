// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

// Correct order
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/change-password", auth, authController.changePassword);
router.get("/profile", auth, authController.getProfile);

// ✅ put this only if createAdmin exists in controller file
router.get("/create-admin", authController.createAdmin);

module.exports = router;

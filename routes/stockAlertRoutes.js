const express = require("express");
const router = express.Router();
const stockAlertController = require("../controllers/stockAlertController");
const auth = require("../middleware/auth");

// Statistics
router.get("/stats", auth, stockAlertController.getStockAlertStats);
router.get("/active-count", auth, stockAlertController.getActiveAlertsCount);

// Auto-generate alerts
router.post("/generate", auth, stockAlertController.generateLowStockAlerts);

// Bulk operations
router.post("/bulk-resolve", auth, stockAlertController.bulkResolveAlerts);

// CRUD operations
router.get("/", auth, stockAlertController.getAllStockAlerts);
router.get("/:id", auth, stockAlertController.getStockAlertById);
router.post("/", auth, stockAlertController.createStockAlert);
router.put("/:id", auth, stockAlertController.updateStockAlert);
router.delete("/:id", auth, stockAlertController.deleteStockAlert);

// Alert actions
router.patch("/:id/acknowledge", auth, stockAlertController.acknowledgeAlert);
router.patch("/:id/resolve", auth, stockAlertController.resolveAlert);
router.patch("/:id/ignore", auth, stockAlertController.ignoreAlert);

module.exports = router;


const express = require("express");
const router = express.Router();
const stockInwardController = require("../controllers/stockInwardController");
const auth = require("../middleware/auth");

// Statistics and aggregates
router.get("/stats", auth, stockInwardController.getStockInwardStats);
router.get("/pending", auth, stockInwardController.getPendingVerifications);

// Get by inward number
router.get("/inward/:inwardNo", auth, stockInwardController.getStockInwardByNo);

// Get by vendor
router.get("/vendor/:vendorName", auth, stockInwardController.getInwardsByVendor);

// Create from purchase order
router.post("/from-po/:purchaseOrderId", auth, stockInwardController.createFromPurchaseOrder);

// CRUD operations
router.get("/", auth, stockInwardController.getAllStockInwards);
router.get("/:id", auth, stockInwardController.getStockInwardById);
router.post("/", auth, stockInwardController.createStockInward);
router.put("/:id", auth, stockInwardController.updateStockInward);
router.delete("/:id", auth, stockInwardController.deleteStockInward);

// Workflow actions
router.patch("/:id/submit", auth, stockInwardController.submitForVerification);
router.patch("/:id/verify", auth, stockInwardController.verifyAndUpdateStock);
router.patch("/:id/cancel", auth, stockInwardController.cancelStockInward);

module.exports = router;


const express = require("express");
const router = express.Router();
const stockTransferController = require("../controllers/stockTransferController");
const auth = require("../middleware/auth");

// Statistics and aggregates
router.get("/stats", auth, stockTransferController.getStockTransferStats);
router.get("/workshops", auth, stockTransferController.getWorkshops);

// Get by transfer number
router.get("/transfer/:transferNo", auth, stockTransferController.getStockTransferByNo);

// Get by workshop
router.get("/workshop/:workshop", auth, stockTransferController.getTransfersByWorkshop);

// CRUD operations
router.get("/", auth, stockTransferController.getAllStockTransfers);
router.get("/:id", auth, stockTransferController.getStockTransferById);
router.post("/", auth, stockTransferController.createStockTransfer);
router.put("/:id", auth, stockTransferController.updateStockTransfer);
router.delete("/:id", auth, stockTransferController.deleteStockTransfer);

// Workflow actions
router.patch("/:id/submit", auth, stockTransferController.submitForApproval);
router.patch("/:id/approve", auth, stockTransferController.approveTransfer);
router.patch("/:id/dispatch", auth, stockTransferController.dispatchTransfer);
router.patch("/:id/deliver", auth, stockTransferController.markAsDelivered);
router.patch("/:id/receive", auth, stockTransferController.receiveTransfer);
router.patch("/:id/cancel", auth, stockTransferController.cancelTransfer);

module.exports = router;


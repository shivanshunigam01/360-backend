const express = require("express");
const router = express.Router();
const purchaseReturnController = require("../controllers/purchaseReturnController");
const auth = require("../middleware/auth");

// Statistics and aggregates
router.get("/stats", auth, purchaseReturnController.getPurchaseReturnStats);
router.get("/pending-approvals", auth, purchaseReturnController.getPendingApprovals);

// Get by return number
router.get("/return/:returnNo", auth, purchaseReturnController.getPurchaseReturnByNo);

// Get by vendor
router.get("/vendor/:vendorName", auth, purchaseReturnController.getReturnsByVendor);

// Create from purchase order or inward
router.post("/from-po/:purchaseOrderId", auth, purchaseReturnController.createFromPurchaseOrder);
router.post("/from-inward/:stockInwardId", auth, purchaseReturnController.createFromStockInward);

// CRUD operations
router.get("/", auth, purchaseReturnController.getAllPurchaseReturns);
router.get("/:id", auth, purchaseReturnController.getPurchaseReturnById);
router.post("/", auth, purchaseReturnController.createPurchaseReturn);
router.put("/:id", auth, purchaseReturnController.updatePurchaseReturn);
router.delete("/:id", auth, purchaseReturnController.deletePurchaseReturn);

// Workflow actions
router.patch("/:id/submit", auth, purchaseReturnController.submitForApproval);
router.patch("/:id/approve", auth, purchaseReturnController.approveReturn);
router.patch("/:id/shipment", auth, purchaseReturnController.updateShipment);
router.patch("/:id/ship", auth, purchaseReturnController.markAsShipped);
router.patch("/:id/deliver", auth, purchaseReturnController.markAsDelivered);
router.patch("/:id/refund", auth, purchaseReturnController.updateRefund);
router.patch("/:id/close", auth, purchaseReturnController.closeReturn);
router.patch("/:id/cancel", auth, purchaseReturnController.cancelReturn);

module.exports = router;


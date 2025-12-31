const express = require("express");
const router = express.Router();
const purchaseOrderController = require("../controllers/purchaseOrderController");
const auth = require("../middleware/auth");

// Statistics and aggregates
router.get("/stats", auth, purchaseOrderController.getPurchaseOrderStats);
router.get("/vendors", auth, purchaseOrderController.getVendors);

// Get by order number
router.get("/order/:orderNo", auth, purchaseOrderController.getPurchaseOrderByOrderNo);

// Generate bill for vendor
router.get("/:id/bill", auth, purchaseOrderController.generateBill);

// CRUD operations
router.get("/", auth, purchaseOrderController.getAllPurchaseOrders);
router.get("/:id", auth, purchaseOrderController.getPurchaseOrderById);
router.post("/", auth, purchaseOrderController.createPurchaseOrder);
router.put("/:id", auth, purchaseOrderController.updatePurchaseOrder);
router.delete("/:id", auth, purchaseOrderController.deletePurchaseOrder);

// Parts management
router.post("/:id/inward", auth, purchaseOrderController.inwardParts);
router.post("/:id/reject", auth, purchaseOrderController.rejectParts);

// Order status management
router.patch("/:id/cancel", auth, purchaseOrderController.cancelPurchaseOrder);
router.patch("/:id/close", auth, purchaseOrderController.closePurchaseOrder);
router.patch("/:id/payment", auth, purchaseOrderController.updatePayment);

module.exports = router;


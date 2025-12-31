const express = require("express");
const router = express.Router();
const counterSaleController = require("../controllers/counterSaleController");
const auth = require("../middleware/auth");

// Statistics and reports
router.get("/stats", auth, counterSaleController.getCounterSaleStats);
router.get("/today", auth, counterSaleController.getTodaySales);
router.get("/pending-payments", auth, counterSaleController.getPendingPayments);

// Product search for POS
router.get("/products/search", auth, counterSaleController.searchProducts);

// Get by sale number
router.get("/sale/:saleNo", auth, counterSaleController.getCounterSaleBySaleNo);

// Get by customer mobile
router.get("/customer/:mobileNo", auth, counterSaleController.getSalesByCustomer);

// Quick sale (one-step sale)
router.post("/quick-sale", auth, counterSaleController.quickSale);

// CRUD operations
router.get("/", auth, counterSaleController.getAllCounterSales);
router.get("/:id", auth, counterSaleController.getCounterSaleById);
router.post("/", auth, counterSaleController.createCounterSale);
router.put("/:id", auth, counterSaleController.updateCounterSale);
router.delete("/:id", auth, counterSaleController.deleteCounterSale);

// Item operations
router.post("/:id/items", auth, counterSaleController.addItems);
router.delete("/:id/items/:itemIndex", auth, counterSaleController.removeItem);

// Sale actions
router.patch("/:id/complete", auth, counterSaleController.completeSale);
router.patch("/:id/cancel", auth, counterSaleController.cancelSale);
router.patch("/:id/refund", auth, counterSaleController.refundSale);

// Payment
router.post("/:id/payment", auth, counterSaleController.addPayment);

// Invoice
router.get("/:id/invoice", auth, counterSaleController.generateInvoice);

module.exports = router;


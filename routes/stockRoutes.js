const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockController");
const auth = require("../middleware/auth");

// Public routes (if needed, remove auth middleware)
// All routes below require authentication

// Get statistics and aggregates
router.get("/stats", auth, stockController.getStockStats);
router.get("/categories", auth, stockController.getCategories);
router.get("/brands", auth, stockController.getBrands);
router.get("/low-stock", auth, stockController.getLowStockItems);

// Search by barcode
router.get("/barcode/:barcode", auth, stockController.searchByBarcode);

// Get by part number
router.get("/part/:partNumber", auth, stockController.getStockByPartNumber);

// CRUD operations
router.get("/", auth, stockController.getAllStock);
router.get("/:id", auth, stockController.getStockById);
router.post("/", auth, stockController.createStock);
router.post("/bulk", auth, stockController.bulkCreateStock);
router.put("/:id", auth, stockController.updateStock);
router.patch("/:id/quantity", auth, stockController.updateQuantity);
router.delete("/:id", auth, stockController.deleteStock);

module.exports = router;


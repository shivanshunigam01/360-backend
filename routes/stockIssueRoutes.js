const express = require("express");
const router = express.Router();
const stockIssueController = require("../controllers/stockIssueController");
const auth = require("../middleware/auth");

// Statistics and aggregates
router.get("/stats", auth, stockIssueController.getStockIssueStats);
router.get("/pending", auth, stockIssueController.getPendingIssues);

// Get by issue number
router.get("/issue/:issueNo", auth, stockIssueController.getStockIssueByNo);

// Get by job card
router.get("/job-card/:jobCardNo", auth, stockIssueController.getIssuesByJobCard);

// Get by vehicle reg no
router.get("/vehicle/:regNo", auth, stockIssueController.getIssuesByRegNo);

// CRUD operations
router.get("/", auth, stockIssueController.getAllStockIssues);
router.get("/:id", auth, stockIssueController.getStockIssueById);
router.post("/", auth, stockIssueController.createStockIssue);
router.put("/:id", auth, stockIssueController.updateStockIssue);
router.delete("/:id", auth, stockIssueController.deleteStockIssue);

// Issue and return operations
router.post("/:id/issue", auth, stockIssueController.issueParts);
router.post("/:id/issue-all", auth, stockIssueController.issueAllParts);
router.post("/:id/return", auth, stockIssueController.returnParts);
router.patch("/:id/cancel", auth, stockIssueController.cancelStockIssue);

module.exports = router;


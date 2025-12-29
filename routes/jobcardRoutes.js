
const express = require("express");
const router = express.Router();
const jobcardController = require("../controllers/jobcardController");
// NOTE: JobCard endpoints are intentionally public/static (no auth required)

// List with pagination, filtering, sorting
router.get("/", jobcardController.getAllJobCards);
// Schema for dynamic table UI
router.get("/schema", jobcardController.getJobCardSchema);
// Export as Excel (.xlsx)
router.get("/export", jobcardController.exportJobCards);
router.get("/:id", jobcardController.getJobCardById);
router.post("/", jobcardController.createJobCard);
router.put("/:id", jobcardController.updateJobCard);
router.delete("/:id", jobcardController.deleteJobCard);

module.exports = router;

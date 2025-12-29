
const express = require("express");
const router = express.Router();
const jobcardController = require("../controllers/jobcardController");
const auth = require("../middleware/auth");

// List with pagination, filtering, sorting
router.get("/", jobcardController.getAllJobCards);
// Schema for dynamic table UI
router.get("/schema", jobcardController.getJobCardSchema);
router.get("/:id", jobcardController.getJobCardById);
router.post("/", auth, jobcardController.createJobCard);
router.put("/:id", auth, jobcardController.updateJobCard);
router.delete("/:id", auth, jobcardController.deleteJobCard);

module.exports = router;

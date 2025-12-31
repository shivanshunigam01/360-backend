const express = require("express");
const router = express.Router();
const jobCardController = require("../controllers/jobCardController"); 
 
router.post("/", jobCardController.createJobCard);
 
router.get("/", jobCardController.getAllJobCards);
 
router.get("/job-card-no/:jobCardNo", jobCardController.getJobCardByJobCardNo);
 
router.get("/:id", jobCardController.getJobCardById);
 
router.put("/:id", jobCardController.updateJobCard);
 
router.delete("/:id", jobCardController.deleteJobCard);

module.exports = router;


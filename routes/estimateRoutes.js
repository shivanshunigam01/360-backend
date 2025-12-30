const express = require("express");
const router = express.Router();

const estimateController = require("../controllers/estimateController");

router.get("/", estimateController.getAllEstimates);

router.get("/:id", estimateController.getEstimateById);

router.post("/", estimateController.createEstimate);

router.put("/:id", estimateController.updateEstimate);

router.patch("/:id/status", estimateController.updateEstimateStatus);

router.delete("/:id", estimateController.deleteEstimate);

module.exports = router;

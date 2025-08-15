const express = require("express");
const router = express.Router();
const faqController = require("../controllers/faqController");
const auth = require("../middleware/auth");

router.get("/", faqController.getAllFAQs);
router.post("/", auth, faqController.createFAQ);
router.put("/:id", auth, faqController.updateFAQ);
router.delete("/:id", auth, faqController.deleteFAQ);
router.put("/order/update", auth, faqController.updateFAQOrder);

module.exports = router;

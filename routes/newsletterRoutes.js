const express = require("express");
const router = express.Router();
const newsletterController = require("../controllers/newsletterController");
const auth = require("../middleware/auth");

router.get("/subscribers", auth, newsletterController.getAllSubscribers);
router.post("/subscribe", newsletterController.subscribe);
router.put("/unsubscribe/:id", auth, newsletterController.unsubscribe);
router.get("/export", auth, newsletterController.exportSubscribers);
router.get("/stats", auth, newsletterController.getStats);

module.exports = router;

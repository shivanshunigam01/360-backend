const express = require("express");
const router = express.Router();
const { sendOtpAndSaveLead } = require("../controllers/contact.controller");

router.post("/otp/send-otp", sendOtpAndSaveLead);

module.exports = router;

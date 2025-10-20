// routes/landingLeadRoutes.js
const express = require("express");
const {
  createLandingLead,
  listLandingLeads,
} = require("../controllers/landingLeadController");

const router = express.Router();

router.post("/createLandingLead", createLandingLead); // POST https://api.zentroverse.com/api/landing-leads
router.get("/", listLandingLeads); // (optional) list for admin/testing

module.exports = router;

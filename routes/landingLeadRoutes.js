// routes/landingLeadRoutes.js
const express = require("express");
const {
  createLandingLead,
  listLandingLeads,
} = require("../controllers/landingLeadController");

const router = express.Router();

// ✅ primary endpoint: POST /api/landing-leads
router.post("/", createLandingLead);

// (optional) backwards-compatible alias:
// POST /api/landing-leads/createLandingLead
router.post("/createLandingLead", createLandingLead);

// GET /api/landing-leads  -> list
router.get("/", listLandingLeads);

module.exports = router;

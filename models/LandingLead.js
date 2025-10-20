// models/LandingLead.js
const mongoose = require("mongoose");

const LandingLeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    state: { type: String, default: "" },
    city: { type: String, default: "" },
    pincode: { type: String, default: "" },
    vehicleModels: { type: [String], default: [] },
    source: { type: String, default: "" },
    expectedMonth: { type: String, default: "" }, // YYYY-MM
    message: { type: String, default: "" },
    agree: { type: Boolean, default: false },
    ctaSource: { type: String, default: "Direct Submit" },
    submittedAt: { type: Date, default: Date.now },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    status: {
      type: String,
      enum: ["new", "in_progress", "closed"],
      default: "new",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LandingLead", LandingLeadSchema);

import mongoose from "mongoose";

const LandingLeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true },              // 10-digit India mobile
    email: { type: String, required: true, lowercase: true, trim: true },
    state: { type: String, default: "" },                                // ISO code (e.g., BR)
    city: { type: String, default: "" },
    pincode: { type: String, default: "" },
    vehicleModels: { type: [String], default: [] },                      // selected model labels
    source: { type: String, default: "" },                               // Facebook / Instagram / ...
    expectedMonth: { type: String, default: "" },                        // YYYY-MM
    message: { type: String, default: "" },
    agree: { type: Boolean, default: false },
    ctaSource: { type: String, default: "Direct Submit" },               // which CTA triggered
    submittedAt: { type: Date, default: Date.now },

    // helpful metadata
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },

    // status for ops
    status: { type: String, enum: ["new", "in_progress", "closed"], default: "new" },
  },
  { timestamps: true }
);

export default mongoose.model("LandingLead", LandingLeadSchema);
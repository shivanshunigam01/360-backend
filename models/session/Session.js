const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    refreshToken: String,
    ipAddress: String,
    location: {
      country: String,
      city: String,
      timezone: String,
    },
    device: {
      browser: String,
      os: String,
      deviceType: String,
    },
    isActive: { type: Boolean, default: true },
    lastUsedAt: Date,
  }, { timestamps: true });
  
  module.exports = mongoose.model("Session", sessionSchema);
  
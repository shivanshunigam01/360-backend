const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },

    creditDays: {
      type: Number,
      required: true,
      min: 0
    },
    region: {
      type: String,
      required: true,
      trim: true,
    },
    gstin: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Vendor", vendorSchema);

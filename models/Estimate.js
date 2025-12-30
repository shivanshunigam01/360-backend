const mongoose = require("mongoose");

const estimateItemSchema = new mongoose.Schema(
  {
    part: {
      type: String,
      required: true,
      trim: true,
    },
    labour: {
      type: String,
      required: true,
      trim: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    labourCost: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    lineTotal: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

const estimateSchema = new mongoose.Schema(
  {
    estimateId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    jobNo: {
      type: String,
      required: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleDetails: {
      type: String,
      required: true,
      trim: true,
    },
    registrationNo: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["requested", "approved", "pending"],
      default: "requested",
    },
    items: {
      type: [estimateItemSchema],
      default: [],
    },
    grandTotal: {
      type: Number,
      min: 0,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Estimate", estimateSchema);
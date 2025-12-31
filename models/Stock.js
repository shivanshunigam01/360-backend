const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    partNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    partName: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    quantityOnHand: {
      type: Number,
      default: 0,
      min: 0,
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    taxType: {
      type: String,
      enum: ["GST", "VAT", "IGST", "CGST", "SGST", "None"],
      default: "GST",
    },
    taxPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    racNo: {
      type: String,
      trim: true,
    },
    ageing: {
      type: Number, // Days since last movement
      default: 0,
    },
    lastMovementDate: {
      type: Date,
      default: Date.now,
    },
    barcodeUrl: {
      type: String,
      trim: true,
    },
    minStockLevel: {
      type: Number,
      default: 0,
    },
    maxStockLevel: {
      type: Number,
    },
    location: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate tax amount before saving
stockSchema.pre("save", function (next) {
  if (this.isModified("sellingPrice") || this.isModified("taxPercent")) {
    this.taxAmount = (this.sellingPrice * this.taxPercent) / 100;
  }
  next();
});

// Calculate ageing based on last movement date
stockSchema.methods.calculateAgeing = function () {
  const now = new Date();
  const lastMovement = this.lastMovementDate || this.createdAt;
  const diffTime = Math.abs(now - lastMovement);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Virtual for total value
stockSchema.virtual("totalValue").get(function () {
  return this.quantityOnHand * this.purchasePrice;
});

// Virtual for selling value with tax
stockSchema.virtual("sellingPriceWithTax").get(function () {
  return this.sellingPrice + this.taxAmount;
});

// Ensure virtuals are included in JSON output
stockSchema.set("toJSON", { virtuals: true });
stockSchema.set("toObject", { virtuals: true });

// Indexes for better query performance
stockSchema.index({ partName: "text", brand: "text", category: "text" });
stockSchema.index({ category: 1 });
stockSchema.index({ brand: 1 });
stockSchema.index({ quantityOnHand: 1 });

module.exports = mongoose.model("Stock", stockSchema);


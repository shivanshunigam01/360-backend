const mongoose = require("mongoose");

const stockAlertSchema = new mongoose.Schema(
  {
    alertNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    stockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
    },
    partNo: {
      type: String,
      required: true,
    },
    partName: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
    },
    category: {
      type: String,
    },
    currentQty: {
      type: Number,
      default: 0,
    },
    minStockLevel: {
      type: Number,
      default: 0,
    },
    reorderQty: {
      type: Number,
      default: 0,
    },
    purchasePrice: {
      type: Number,
      default: 0,
    },
    // Related info
    jobCardNo: {
      type: String,
      trim: true,
    },
    jobCardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobCard",
    },
    vehicleNo: {
      type: String,
      trim: true,
    },
    vendorName: {
      type: String,
      trim: true,
    },
    inwardNo: {
      type: String,
      trim: true,
    },
    inwardDate: {
      type: Date,
    },
    // Alert type
    alertType: {
      type: String,
      enum: ["Low Stock", "Out of Stock", "Reorder Required", "Expiring Soon", "Slow Moving"],
      default: "Low Stock",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Active", "Acknowledged", "Resolved", "Ignored"],
      default: "Active",
    },
    // Resolution
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
    },
    resolutionNote: {
      type: String,
    },
    // Notification
    notificationSent: {
      type: Boolean,
      default: false,
    },
    notifiedAt: {
      type: Date,
    },
    notes: {
      type: String,
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

// Generate alert number
stockAlertSchema.statics.generateAlertNo = async function () {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const prefix = `ALT${year}${month}`;

  const lastAlert = await this.findOne({
    alertNo: { $regex: `^${prefix}` },
  }).sort({ alertNo: -1 });

  let sequence = 1;
  if (lastAlert) {
    const lastSequence = parseInt(lastAlert.alertNo.slice(-4));
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
};

// Auto-determine priority based on stock level
stockAlertSchema.methods.calculatePriority = function () {
  if (this.currentQty === 0) {
    this.priority = "Critical";
    this.alertType = "Out of Stock";
  } else if (this.currentQty <= this.minStockLevel * 0.25) {
    this.priority = "High";
  } else if (this.currentQty <= this.minStockLevel * 0.5) {
    this.priority = "Medium";
  } else {
    this.priority = "Low";
  }
};

// Indexes
stockAlertSchema.index({ status: 1 });
stockAlertSchema.index({ priority: 1 });
stockAlertSchema.index({ alertType: 1 });
stockAlertSchema.index({ partNo: 1 });
stockAlertSchema.index({ createdAt: -1 });

module.exports = mongoose.model("StockAlert", stockAlertSchema);


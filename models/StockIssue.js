const mongoose = require("mongoose");

const issueItemSchema = new mongoose.Schema({
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
  avgPurchasePrice: {
    type: Number,
    default: 0,
  },
  avgSellingPrice: {
    type: Number,
    default: 0,
  },
  avgMarginPrice: {
    type: Number,
    default: 0,
  },
  requestedQty: {
    type: Number,
    required: true,
    min: 1,
  },
  issuedQty: {
    type: Number,
    default: 0,
    min: 0,
  },
  pendingQty: {
    type: Number,
    default: 0,
  },
  returnQty: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ["Pending", "Partially Issued", "Issued", "Returned", "Cancelled"],
    default: "Pending",
  },
  issuedAt: {
    type: Date,
  },
  returnedAt: {
    type: Date,
  },
  remarks: {
    type: String,
  },
});

const stockIssueSchema = new mongoose.Schema(
  {
    issueNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    jobCardNo: {
      type: String,
      trim: true,
    },
    jobCardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobCard",
    },
    regNo: {
      type: String,
      trim: true,
    },
    vehicle: {
      make: String,
      model: String,
      year: Number,
      color: String,
    },
    // Technician/Employee receiving the parts
    issuedTo: {
      type: String,
      trim: true,
    },
    issuedToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Issue items
    items: [issueItemSchema],

    // Totals
    totalRequestedQty: {
      type: Number,
      default: 0,
    },
    totalIssuedQty: {
      type: Number,
      default: 0,
    },
    totalPendingQty: {
      type: Number,
      default: 0,
    },
    totalReturnQty: {
      type: Number,
      default: 0,
    },
    totalPurchaseValue: {
      type: Number,
      default: 0,
    },
    totalSellingValue: {
      type: Number,
      default: 0,
    },
    totalMarginValue: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Draft", "Pending", "Partially Issued", "Issued", "Partially Returned", "Returned", "Cancelled"],
      default: "Draft",
    },

    notes: {
      type: String,
    },

    // Stock deducted flag
    stockDeducted: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Calculate totals and pending quantities before saving
stockIssueSchema.pre("save", function (next) {
  let totalRequested = 0;
  let totalIssued = 0;
  let totalPending = 0;
  let totalReturn = 0;
  let totalPurchase = 0;
  let totalSelling = 0;
  let totalMargin = 0;

  this.items.forEach((item) => {
    // Calculate pending qty
    item.pendingQty = item.requestedQty - item.issuedQty - item.returnQty;
    if (item.pendingQty < 0) item.pendingQty = 0;

    // Calculate margin
    item.avgMarginPrice = item.avgSellingPrice - item.avgPurchasePrice;

    // Update item status
    if (item.returnQty >= item.issuedQty && item.issuedQty > 0) {
      item.status = "Returned";
    } else if (item.issuedQty >= item.requestedQty) {
      item.status = "Issued";
    } else if (item.issuedQty > 0) {
      item.status = "Partially Issued";
    } else {
      item.status = "Pending";
    }

    // Sum totals
    totalRequested += item.requestedQty;
    totalIssued += item.issuedQty;
    totalPending += item.pendingQty;
    totalReturn += item.returnQty;
    totalPurchase += item.issuedQty * item.avgPurchasePrice;
    totalSelling += item.issuedQty * item.avgSellingPrice;
    totalMargin += item.issuedQty * item.avgMarginPrice;
  });

  this.totalRequestedQty = totalRequested;
  this.totalIssuedQty = totalIssued;
  this.totalPendingQty = totalPending;
  this.totalReturnQty = totalReturn;
  this.totalPurchaseValue = totalPurchase;
  this.totalSellingValue = totalSelling;
  this.totalMarginValue = totalMargin;

  // Update overall status
  this.updateOverallStatus();

  next();
});

// Method to update overall status
stockIssueSchema.methods.updateOverallStatus = function () {
  if (this.status === "Cancelled") return;

  const allReturned = this.items.every((item) => item.status === "Returned");
  const someReturned = this.items.some((item) => item.returnQty > 0);
  const allIssued = this.items.every((item) => item.status === "Issued" || item.status === "Returned");
  const someIssued = this.items.some((item) => item.issuedQty > 0);

  if (allReturned && this.totalIssuedQty > 0) {
    this.status = "Returned";
  } else if (someReturned) {
    this.status = "Partially Returned";
  } else if (allIssued) {
    this.status = "Issued";
  } else if (someIssued) {
    this.status = "Partially Issued";
  } else {
    this.status = "Pending";
  }
};

// Generate issue number
stockIssueSchema.statics.generateIssueNo = async function () {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const prefix = `ISS${year}${month}`;

  const lastIssue = await this.findOne({
    issueNo: { $regex: `^${prefix}` },
  }).sort({ issueNo: -1 });

  let sequence = 1;
  if (lastIssue) {
    const lastSequence = parseInt(lastIssue.issueNo.slice(-4));
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
};

// Indexes
stockIssueSchema.index({ jobCardNo: 1 });
stockIssueSchema.index({ regNo: 1 });
stockIssueSchema.index({ status: 1 });
stockIssueSchema.index({ issueDate: -1 });
stockIssueSchema.index({ issuedTo: 1 });

module.exports = mongoose.model("StockIssue", stockIssueSchema);


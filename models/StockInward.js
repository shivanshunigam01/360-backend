const mongoose = require("mongoose");

const inwardItemSchema = new mongoose.Schema({
  stockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stock",
  },
  partNumber: {
    type: String,
    required: true,
  },
  partName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
  },
  amount: {
    type: Number,
    default: 0,
  },
  remarks: {
    type: String,
  },
});

const stockInwardSchema = new mongoose.Schema(
  {
    inwardNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderNo: {
      type: String,
      trim: true,
    },
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
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
    vendorName: {
      type: String,
      required: true,
      trim: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },
    orderDate: {
      type: Date,
    },
    inwardDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    receiptNo: {
      type: String,
      trim: true,
    },
    // Inward items
    items: [inwardItemSchema],

    // Totals
    totalQuantity: {
      type: Number,
      default: 0,
    },
    inwardValue: {
      type: Number,
      default: 0,
    },

    // Verification
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["Draft", "Pending Verification", "Verified", "Cancelled"],
      default: "Draft",
    },

    notes: {
      type: String,
    },

    // Stock updated flag
    stockUpdated: {
      type: Boolean,
      default: false,
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

// Calculate totals before saving
stockInwardSchema.pre("save", function (next) {
  let totalQty = 0;
  let totalValue = 0;

  this.items.forEach((item) => {
    item.amount = item.quantity * item.rate;
    totalQty += item.quantity;
    totalValue += item.amount;
  });

  this.totalQuantity = totalQty;
  this.inwardValue = totalValue;

  next();
});

// Generate inward number
stockInwardSchema.statics.generateInwardNo = async function () {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const prefix = `INW${year}${month}`;

  const lastInward = await this.findOne({
    inwardNo: { $regex: `^${prefix}` },
  }).sort({ inwardNo: -1 });

  let sequence = 1;
  if (lastInward) {
    const lastSequence = parseInt(lastInward.inwardNo.slice(-4));
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
};

// Indexes
stockInwardSchema.index({ vendorName: 1 });
stockInwardSchema.index({ status: 1 });
stockInwardSchema.index({ inwardDate: -1 });
stockInwardSchema.index({ orderNo: 1 });
stockInwardSchema.index({ jobCardNo: 1 });

module.exports = mongoose.model("StockInward", stockInwardSchema);


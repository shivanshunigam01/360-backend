const mongoose = require("mongoose");

const transferItemSchema = new mongoose.Schema({
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
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    default: 0,
  },
  totalValue: {
    type: Number,
    default: 0,
  },
  remarks: {
    type: String,
  },
  // Item status
  sentQty: {
    type: Number,
    default: 0,
  },
  receivedQty: {
    type: Number,
    default: 0,
  },
  damagedQty: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["Pending", "Sent", "Received", "Partial", "Damaged"],
    default: "Pending",
  },
});

const stockTransferSchema = new mongoose.Schema(
  {
    transferNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fromWorkshop: {
      type: String,
      required: true,
      trim: true,
    },
    fromWorkshopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workshop",
    },
    toWorkshop: {
      type: String,
      required: true,
      trim: true,
    },
    toWorkshopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workshop",
    },
    transferDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expectedDeliveryDate: {
      type: Date,
    },
    actualDeliveryDate: {
      type: Date,
    },
    // Items
    items: [transferItemSchema],

    // Totals
    totalItems: {
      type: Number,
      default: 0,
    },
    totalQuantity: {
      type: Number,
      default: 0,
    },
    totalValue: {
      type: Number,
      default: 0,
    },

    // Transfer details
    transferReason: {
      type: String,
      enum: ["Stock Balancing", "Urgent Requirement", "Workshop Closure", "Excess Stock", "Other"],
    },
    transferMethod: {
      type: String,
      enum: ["Vehicle", "Courier", "Hand Carry", "Other"],
    },
    vehicleNo: {
      type: String,
    },
    driverName: {
      type: String,
    },
    driverContact: {
      type: String,
    },

    // Status
    status: {
      type: String,
      enum: ["Draft", "Pending Approval", "Approved", "In Transit", "Delivered", "Received", "Cancelled"],
      default: "Draft",
    },

    // Approvals
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },

    // Dispatch
    dispatchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    dispatchedAt: {
      type: Date,
    },

    // Receipt
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    receivedAt: {
      type: Date,
    },
    receiverRemarks: {
      type: String,
    },

    // Stock updated flags
    sourceStockDeducted: {
      type: Boolean,
      default: false,
    },
    destinationStockAdded: {
      type: Boolean,
      default: false,
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

// Calculate totals before saving
stockTransferSchema.pre("save", function (next) {
  let totalQty = 0;
  let totalVal = 0;

  this.items.forEach((item) => {
    item.totalValue = item.quantity * item.unitPrice;
    totalQty += item.quantity;
    totalVal += item.totalValue;
  });

  this.totalItems = this.items.length;
  this.totalQuantity = totalQty;
  this.totalValue = totalVal;

  next();
});

// Generate transfer number
stockTransferSchema.statics.generateTransferNo = async function () {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const prefix = `TRF${year}${month}`;

  const lastTransfer = await this.findOne({
    transferNo: { $regex: `^${prefix}` },
  }).sort({ transferNo: -1 });

  let sequence = 1;
  if (lastTransfer) {
    const lastSequence = parseInt(lastTransfer.transferNo.slice(-4));
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
};

// Indexes
stockTransferSchema.index({ fromWorkshop: 1 });
stockTransferSchema.index({ toWorkshop: 1 });
stockTransferSchema.index({ status: 1 });
stockTransferSchema.index({ transferDate: -1 });

module.exports = mongoose.model("StockTransfer", stockTransferSchema);


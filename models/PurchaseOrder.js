const mongoose = require("mongoose");

const partItemSchema = new mongoose.Schema({
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
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  totalPrice: {
    type: Number,
    default: 0,
  },
  taxPercent: {
    type: Number,
    default: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    orderNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    regNo: {
      type: String,
      trim: true,
    },
    jobCardNo: {
      type: String,
      trim: true,
    },
    jobCardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobCard",
    },
    vendorName: {
      type: String,
      required: true,
      trim: true,
    },
    vendorContact: {
      phone: String,
      email: String,
      address: String,
      gstNo: String,
    },
    orderValue: {
      type: Number,
      default: 0,
    },
    taxTotal: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      default: 0,
    },
    // Ordered parts - what was requested
    orderedParts: [partItemSchema],

    // Inwarded parts - what was received
    inwardedParts: [
      {
        stockId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Stock",
        },
        partNumber: String,
        partName: String,
        quantity: Number,
        inwardDate: {
          type: Date,
          default: Date.now,
        },
        remarks: String,
      },
    ],

    // Rejected parts - what was rejected
    rejectedParts: [
      {
        stockId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Stock",
        },
        partNumber: String,
        partName: String,
        quantity: Number,
        rejectionDate: {
          type: Date,
          default: Date.now,
        },
        reason: String,
      },
    ],

    // Pending parts - calculated from ordered - inwarded - rejected
    pendingParts: [
      {
        stockId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Stock",
        },
        partNumber: String,
        partName: String,
        quantity: Number,
      },
    ],

    cancelDate: {
      type: Date,
    },
    cancelReason: {
      type: String,
    },

    status: {
      type: String,
      enum: [
        "Draft",
        "Pending",
        "Partially Received",
        "Received",
        "Cancelled",
        "Closed",
      ],
      default: "Draft",
    },

    notes: {
      type: String,
    },
    
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partial", "Paid"],
      default: "Unpaid",
    },
    paidAmount: {
      type: Number,
      default: 0,
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

// Calculate order value and totals before saving
purchaseOrderSchema.pre("save", function (next) {
  // Calculate order value from ordered parts
  let orderValue = 0;
  let taxTotal = 0;

  this.orderedParts.forEach((part) => {
    part.totalPrice = part.quantity * part.unitPrice;
    part.taxAmount = (part.totalPrice * part.taxPercent) / 100;
    orderValue += part.totalPrice;
    taxTotal += part.taxAmount;
  });

  this.orderValue = orderValue;
  this.taxTotal = taxTotal;
  this.grandTotal = orderValue + taxTotal;

  // Calculate pending parts
  this.calculatePendingParts();

  // Update status based on parts
  this.updateStatus();

  next();
});

// Method to calculate pending parts
purchaseOrderSchema.methods.calculatePendingParts = function () {
  const pending = [];

  this.orderedParts.forEach((ordered) => {
    const inwardedQty = this.inwardedParts
      .filter((p) => p.partNumber === ordered.partNumber)
      .reduce((sum, p) => sum + p.quantity, 0);

    const rejectedQty = this.rejectedParts
      .filter((p) => p.partNumber === ordered.partNumber)
      .reduce((sum, p) => sum + p.quantity, 0);

    const pendingQty = ordered.quantity - inwardedQty - rejectedQty;

    if (pendingQty > 0) {
      pending.push({
        stockId: ordered.stockId,
        partNumber: ordered.partNumber,
        partName: ordered.partName,
        quantity: pendingQty,
      });
    }
  });

  this.pendingParts = pending;
};

// Method to update status
purchaseOrderSchema.methods.updateStatus = function () {
  if (this.cancelDate) {
    this.status = "Cancelled";
    return;
  }

  const totalOrdered = this.orderedParts.reduce((sum, p) => sum + p.quantity, 0);
  const totalInwarded = this.inwardedParts.reduce((sum, p) => sum + p.quantity, 0);
  const totalRejected = this.rejectedParts.reduce((sum, p) => sum + p.quantity, 0);
  const totalReceived = totalInwarded + totalRejected;

  if (totalReceived === 0) {
    this.status = "Pending";
  } else if (totalReceived >= totalOrdered) {
    this.status = "Received";
  } else {
    this.status = "Partially Received";
  }
};

// Generate order number
purchaseOrderSchema.statics.generateOrderNo = async function () {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const prefix = `PO${year}${month}`;

  const lastOrder = await this.findOne({
    orderNo: { $regex: `^${prefix}` },
  }).sort({ orderNo: -1 });

  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNo.slice(-4));
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
};

// Indexes
purchaseOrderSchema.index({ vendorName: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ orderDate: -1 });
purchaseOrderSchema.index({ jobCardNo: 1 });

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);


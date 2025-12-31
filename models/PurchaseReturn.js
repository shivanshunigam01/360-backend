const mongoose = require("mongoose");

const returnItemSchema = new mongoose.Schema({
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
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  returnedQty: {
    type: Number,
    required: true,
    min: 1,
  },
  amount: {
    type: Number,
    default: 0,
  },
  reason: {
    type: String,
    enum: ["Defective", "Damaged", "Wrong Item", "Expired", "Quality Issue", "Excess Stock", "Other"],
    required: true,
  },
  reasonDetails: {
    type: String,
  },
  condition: {
    type: String,
    enum: ["Unopened", "Opened", "Used", "Damaged"],
    default: "Unopened",
  },
});

const purchaseReturnSchema = new mongoose.Schema(
  {
    returnNo: {
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
    inwardNo: {
      type: String,
      trim: true,
    },
    stockInwardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockInward",
    },
    orderDate: {
      type: Date,
    },
    inwardDate: {
      type: Date,
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
    },

    // Return items
    items: [returnItemSchema],

    // Return date
    returnedDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Totals
    totalReturnedQty: {
      type: Number,
      default: 0,
    },
    totalReturnValue: {
      type: Number,
      default: 0,
    },

    // Shipment details
    shipment: {
      method: {
        type: String,
        enum: ["Courier", "Hand Delivery", "Pickup", "Transport", "Other"],
      },
      trackingNo: String,
      courierName: String,
      shippedDate: Date,
      expectedDeliveryDate: Date,
      deliveredDate: Date,
      shippingCost: {
        type: Number,
        default: 0,
      },
      notes: String,
    },

    // Status
    status: {
      type: String,
      enum: [
        "Draft",
        "Pending Approval",
        "Approved",
        "Shipped",
        "Delivered",
        "Refund Pending",
        "Refund Received",
        "Closed",
        "Cancelled",
      ],
      default: "Draft",
    },

    // Refund
    refundStatus: {
      type: String,
      enum: ["Not Applicable", "Pending", "Partial", "Completed"],
      default: "Pending",
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundDate: {
      type: Date,
    },
    refundMethod: {
      type: String,
      enum: ["Credit Note", "Bank Transfer", "Cash", "Adjustment"],
    },
    refundReference: {
      type: String,
    },

    notes: {
      type: String,
    },

    // Stock updated flag
    stockDeducted: {
      type: Boolean,
      default: false,
    },

    // Approval
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
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
purchaseReturnSchema.pre("save", function (next) {
  let totalQty = 0;
  let totalValue = 0;

  this.items.forEach((item) => {
    item.amount = item.returnedQty * item.unitPrice;
    totalQty += item.returnedQty;
    totalValue += item.amount;
  });

  this.totalReturnedQty = totalQty;
  this.totalReturnValue = totalValue;

  next();
});

// Generate return number
purchaseReturnSchema.statics.generateReturnNo = async function () {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const prefix = `PR${year}${month}`;

  const lastReturn = await this.findOne({
    returnNo: { $regex: `^${prefix}` },
  }).sort({ returnNo: -1 });

  let sequence = 1;
  if (lastReturn) {
    const lastSequence = parseInt(lastReturn.returnNo.slice(-4));
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
};

// Indexes
purchaseReturnSchema.index({ vendorName: 1 });
purchaseReturnSchema.index({ status: 1 });
purchaseReturnSchema.index({ returnedDate: -1 });
purchaseReturnSchema.index({ orderNo: 1 });
purchaseReturnSchema.index({ inwardNo: 1 });

module.exports = mongoose.model("PurchaseReturn", purchaseReturnSchema);


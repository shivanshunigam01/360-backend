const mongoose = require("mongoose");

const saleItemSchema = new mongoose.Schema({
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
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  discountType: {
    type: String,
    enum: ["Flat", "Percent"],
    default: "Flat",
  },
  discountAmount: {
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
  totalPrice: {
    type: Number,
    default: 0,
  },
});

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  method: {
    type: String,
    enum: ["Cash", "Card", "UPI", "Bank Transfer", "Credit", "Other"],
    default: "Cash",
  },
  reference: {
    type: String,
  },
  paidAt: {
    type: Date,
    default: Date.now,
  },
});

const counterSaleSchema = new mongoose.Schema(
  {
    saleNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    saleDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Customer details
    regNo: {
      type: String,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNo: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
    },
    // Vehicle details (optional)
    vehicle: {
      make: String,
      model: String,
      year: Number,
    },
    // Sale items
    items: [saleItemSchema],

    // Totals
    subtotal: {
      type: Number,
      default: 0,
    },
    totalDiscount: {
      type: Number,
      default: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    // Payment
    payments: [paymentSchema],
    paidAmount: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
    // Overall discount
    billDiscount: {
      type: Number,
      default: 0,
    },
    billDiscountType: {
      type: String,
      enum: ["Flat", "Percent"],
      default: "Flat",
    },
    // Status
    status: {
      type: String,
      enum: ["Draft", "Completed", "Partial", "Pending", "Cancelled", "Refunded"],
      default: "Draft",
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partial", "Paid"],
      default: "Unpaid",
    },
    // Stock deducted flag
    stockDeducted: {
      type: Boolean,
      default: false,
    },
    // Invoice/Receipt
    invoiceNo: {
      type: String,
    },
    invoiceGenerated: {
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
counterSaleSchema.pre("save", function (next) {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  this.items.forEach((item) => {
    // Calculate item discount
    if (item.discountType === "Percent") {
      item.discountAmount = (item.unitPrice * item.quantity * item.discount) / 100;
    } else {
      item.discountAmount = item.discount;
    }

    // Calculate item total after discount
    const itemSubtotal = item.unitPrice * item.quantity - item.discountAmount;

    // Calculate tax
    item.taxAmount = (itemSubtotal * item.taxPercent) / 100;

    // Calculate total price
    item.totalPrice = itemSubtotal + item.taxAmount;

    subtotal += item.unitPrice * item.quantity;
    totalDiscount += item.discountAmount;
    totalTax += item.taxAmount;
  });

  this.subtotal = subtotal;
  this.totalDiscount = totalDiscount;
  this.totalTax = totalTax;

  // Apply bill discount
  let billDiscountAmount = 0;
  if (this.billDiscountType === "Percent") {
    billDiscountAmount = ((subtotal - totalDiscount + totalTax) * this.billDiscount) / 100;
  } else {
    billDiscountAmount = this.billDiscount;
  }

  this.totalAmount = subtotal - totalDiscount + totalTax - billDiscountAmount;
  this.totalDiscount = totalDiscount + billDiscountAmount;

  // Calculate paid amount
  this.paidAmount = this.payments.reduce((sum, p) => sum + p.amount, 0);
  this.balance = this.totalAmount - this.paidAmount;

  // Update payment status
  if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = "Paid";
    this.balance = 0;
  } else if (this.paidAmount > 0) {
    this.paymentStatus = "Partial";
  } else {
    this.paymentStatus = "Unpaid";
  }

  next();
});

// Generate sale number
counterSaleSchema.statics.generateSaleNo = async function () {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const day = today.getDate().toString().padStart(2, "0");
  const prefix = `CS${year}${month}${day}`;

  const lastSale = await this.findOne({
    saleNo: { $regex: `^${prefix}` },
  }).sort({ saleNo: -1 });

  let sequence = 1;
  if (lastSale) {
    const lastSequence = parseInt(lastSale.saleNo.slice(-4));
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
};

// Indexes
counterSaleSchema.index({ customerName: 1 });
counterSaleSchema.index({ mobileNo: 1 });
counterSaleSchema.index({ regNo: 1 });
counterSaleSchema.index({ status: 1 });
counterSaleSchema.index({ saleDate: -1 });
counterSaleSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model("CounterSale", counterSaleSchema);


const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  addressLine1: {
    type: String,
    trim: true,
  },
  addressLine2: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  region: {
    type: String,
    trim: true,
  },
  regionCode: {
    type: String,
    trim: true,
  },
  pincode: {
    type: String,
    trim: true,
  },
  country: {
    type: String,
    default: "India",
  },
});

const customerSchema = new mongoose.Schema(
  {
    // Customer type
    customerType: {
      type: String,
      enum: ["Individual", "Corporate"],
      required: true,
      default: "Individual",
    },

    // Common fields
    customerCode: {
      type: String,
      unique: true,
      index: true,
    },
    tpin: {
      type: String,
      trim: true,
      index: true,
    },

    // Individual fields
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    birthday: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },

    // Corporate fields
    companyName: {
      type: String,
      trim: true,
    },
    gstNo: {
      type: String,
      trim: true,
    },
    panNo: {
      type: String,
      trim: true,
    },
    cinNo: {
      type: String,
      trim: true,
    },
    industryType: {
      type: String,
      trim: true,
    },
    // Contact person for corporate
    contactPerson: {
      name: String,
      designation: String,
      phone: String,
      email: String,
    },

    // Contact details
    mobileNo: {
      type: String,
      trim: true,
      index: true,
    },
    altMobileNo: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    altEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // Address
    address: addressSchema,

    // Billing address (for corporate)
    billingAddress: addressSchema,

    // Shipping address
    shippingAddress: addressSchema,

    // Vehicle details
    vehicles: [
      {
        regNo: String,
        make: String,
        model: String,
        year: Number,
        color: String,
        vinNo: String,
        engineNo: String,
        fuelType: {
          type: String,
          enum: ["Petrol", "Diesel", "CNG", "Electric", "Hybrid", "Other"],
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Credit details
    creditLimit: {
      type: Number,
      default: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    paymentTerms: {
      type: String,
      enum: ["Immediate", "Net 7", "Net 15", "Net 30", "Net 45", "Net 60"],
      default: "Immediate",
    },

    // Loyalty
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    membershipTier: {
      type: String,
      enum: ["Bronze", "Silver", "Gold", "Platinum"],
      default: "Bronze",
    },

    // Preferences
    preferredContact: {
      type: String,
      enum: ["Phone", "Email", "SMS", "WhatsApp"],
      default: "Phone",
    },
    marketingOptIn: {
      type: Boolean,
      default: true,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isBlacklisted: {
      type: Boolean,
      default: false,
    },
    blacklistReason: {
      type: String,
    },

    // Notes
    notes: {
      type: String,
    },

    // Metadata
    source: {
      type: String,
      enum: ["Walk-in", "Referral", "Online", "Advertisement", "Other"],
      default: "Walk-in",
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Generate customer code
customerSchema.statics.generateCustomerCode = async function (type) {
  const prefix = type === "Corporate" ? "CORP" : "CUST";
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);

  const lastCustomer = await this.findOne({
    customerCode: { $regex: `^${prefix}${year}` },
  }).sort({ customerCode: -1 });

  let sequence = 1;
  if (lastCustomer) {
    const lastSequence = parseInt(lastCustomer.customerCode.slice(-5));
    sequence = lastSequence + 1;
  }

  return `${prefix}${year}${sequence.toString().padStart(5, "0")}`;
};

// Pre-save middleware
customerSchema.pre("save", async function (next) {
  // Generate customer code if not present
  if (!this.customerCode) {
    this.customerCode = await this.constructor.generateCustomerCode(
      this.customerType
    );
  }

  // Set customerName from firstName + lastName for individuals
  // if (this.customerType === "Individual" && this.firstName) {
  //   this.customerName = `${this.firstName} ${this.lastName || ""}`.trim();
  // }

  // Set customerName from companyName for corporate
  if (this.customerType === "Corporate" && this.companyName) {
    this.customerName = this.companyName;
  }

  next();
});

// Virtual for full address
customerSchema.virtual("fullAddress").get(function () {
  if (!this.address) return "";
  const parts = [
    this.address.addressLine1,
    this.address.addressLine2,
    this.address.city,
    this.address.region,
    this.address.pincode,
    this.address.country,
  ].filter(Boolean);
  return parts.join(", ");
});

// Ensure virtuals are included
customerSchema.set("toJSON", { virtuals: true });
customerSchema.set("toObject", { virtuals: true });

// Indexes
customerSchema.index({ customerName: "text", companyName: "text", email: "text" });
customerSchema.index({ customerType: 1 });
customerSchema.index({ isActive: 1 });
customerSchema.index({ "vehicles.regNo": 1 });

module.exports = mongoose.model("Customer", customerSchema);

const mongoose = require("mongoose");

const jobCardSchema = new mongoose.Schema(
    {
        rfeNo: {
            type: String,
            trim: true,
        },
        jobCardNo: {
            type: String,
            unique: true,
            sparse: true, // Allows multiple null values, but enforces uniqueness for non-null values
            trim: true,
            uppercase: true,
        },
        regNo: {
            type: String,
            required: [true, "Registration No. is required"],
            trim: true,
            uppercase: true,
        },
        invoiceNo: {
            type: String,
            trim: true,
        },
        serviceType: {
            type: String,
            trim: true,
        },
        vehicle: {
            type: String,
            required: [true, "Vehicle is required"],
            trim: true,
        },
        status: {
            type: String,
            enum: ["Pending", "In Progress", "Invoice", "Delivered", "Cancelled"],
            default: "Pending",
        },
        customerName: {
            type: String,
            required: [true, "Customer Name is required"],
            trim: true,
        },
        mobileNo: {
            type: String,
            required: [true, "Mobile No. is required"],
            trim: true,
        },
        arrivalDate: {
            type: Date,
            required: [true, "Arrival Date is required"],
        },
        arrivalTime: {
            type: String,
            required: [true, "Arrival Time is required"],
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Pre-save hook to ensure jobCardNo is never null or empty
jobCardSchema.pre("save", async function (next) {
    // If jobCardNo is missing or empty, it should have been generated in the controller
    // This is a safety check to prevent null/empty values
    if (!this.jobCardNo || this.jobCardNo.trim() === "") {
        // This should not happen if controller logic is correct
        // But as a fallback, we'll throw an error
        const error = new Error("Job Card No. cannot be null or empty. It must be auto-generated.");
        return next(error);
    }
    next();
});

// Index for better query performance
jobCardSchema.index({ jobCardNo: 1 });
jobCardSchema.index({ regNo: 1 });
jobCardSchema.index({ status: 1 });
jobCardSchema.index({ arrivalDate: -1 });

module.exports = mongoose.model("JobCard", jobCardSchema);


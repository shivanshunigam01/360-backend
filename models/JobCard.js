const mongoose = require("mongoose");

const jobCardSchema = new mongoose.Schema(
    {
        rfeNo: {
            type: String,
            trim: true,
        },
        jobCardNo: {
            type: String,
            required: [true, "Job Card No. is required"],
            unique: true,
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

// Index for better query performance
jobCardSchema.index({ jobCardNo: 1 });
jobCardSchema.index({ regNo: 1 });
jobCardSchema.index({ status: 1 });
jobCardSchema.index({ arrivalDate: -1 });

module.exports = mongoose.model("JobCard", jobCardSchema);


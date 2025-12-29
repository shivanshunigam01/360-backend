const JobCard = require("../models/JobCard");

// Create a new job card
exports.createJobCard = async (req, res) => {
    try {
        const {
            rfeNo,
            jobCardNo,
            regNo,
            invoiceNo,
            serviceType,
            vehicle,
            status,
            customerName,
            mobileNo,
            arrivalDate,
            arrivalTime,
            notes,
        } = req.body;

        // Basic validation
        if (!jobCardNo || !regNo || !vehicle || !customerName || !mobileNo || !arrivalDate || !arrivalTime) {
            return res.status(400).json({
                success: false,
                message: "Required fields: jobCardNo, regNo, vehicle, customerName, mobileNo, arrivalDate, arrivalTime",
            });
        }

        // Check if job card number already exists
        const existingJobCard = await JobCard.findOne({ jobCardNo: jobCardNo.toUpperCase() });
        if (existingJobCard) {
            return res.status(400).json({
                success: false,
                message: "Job Card No. already exists",
            });
        }

        const jobCard = await JobCard.create({
            rfeNo: rfeNo || "",
            jobCardNo: jobCardNo.toUpperCase().trim(),
            regNo: regNo.toUpperCase().trim(),
            invoiceNo: invoiceNo || "",
            serviceType: serviceType || "",
            vehicle: vehicle.trim(),
            status: status || "Pending",
            customerName: customerName.trim(),
            mobileNo: mobileNo.trim(),
            arrivalDate: new Date(arrivalDate),
            arrivalTime: arrivalTime.trim(),
            notes: notes || "",
        });

        return res.status(201).json({
            success: true,
            message: "Job card created successfully",
            jobCard,
        });
    } catch (err) {
        console.error("❌ Error creating job card:", err.message);

        // Handle duplicate key error
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Job Card No. already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create job card",
            error: err.message,
        });
    }
};

// Get all job cards with optional filters
exports.getAllJobCards = async (req, res) => {
    try {
        const { status, regNo, customerName, startDate, endDate, page = 1, limit = 10 } = req.query;

        let query = {};

        // Apply filters
        if (status) {
            query.status = status;
        }
        if (regNo) {
            query.regNo = { $regex: regNo, $options: "i" };
        }
        if (customerName) {
            query.customerName = { $regex: customerName, $options: "i" };
        }
        if (startDate || endDate) {
            query.arrivalDate = {};
            if (startDate) query.arrivalDate.$gte = new Date(startDate);
            if (endDate) query.arrivalDate.$lte = new Date(endDate);
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const jobCards = await JobCard.find(query)
            .sort({ arrivalDate: -1, createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await JobCard.countDocuments(query);

        return res.status(200).json({
            success: true,
            jobCards,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalItems: total,
                itemsPerPage: limitNum,
            },
        });
    } catch (err) {
        console.error("❌ Error fetching job cards:", err.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch job cards",
            error: err.message,
        });
    }
};

// Get a single job card by ID
exports.getJobCardById = async (req, res) => {
    try {
        const jobCard = await JobCard.findById(req.params.id);

        if (!jobCard) {
            return res.status(404).json({
                success: false,
                message: "Job card not found",
            });
        }

        return res.status(200).json({
            success: true,
            jobCard,
        });
    } catch (err) {
        console.error("❌ Error fetching job card:", err.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch job card",
            error: err.message,
        });
    }
};

// Update a job card
exports.updateJobCard = async (req, res) => {
    try {
        const {
            rfeNo,
            jobCardNo,
            regNo,
            invoiceNo,
            serviceType,
            vehicle,
            status,
            customerName,
            mobileNo,
            arrivalDate,
            arrivalTime,
            notes,
        } = req.body;

        // Check if job card exists
        const existingJobCard = await JobCard.findById(req.params.id);
        if (!existingJobCard) {
            return res.status(404).json({
                success: false,
                message: "Job card not found",
            });
        }

        // If jobCardNo is being updated, check for duplicates
        if (jobCardNo && jobCardNo.toUpperCase() !== existingJobCard.jobCardNo) {
            const duplicate = await JobCard.findOne({ jobCardNo: jobCardNo.toUpperCase() });
            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: "Job Card No. already exists",
                });
            }
        }

        // Build update object
        const updateData = {};
        if (rfeNo !== undefined) updateData.rfeNo = rfeNo;
        if (jobCardNo !== undefined) updateData.jobCardNo = jobCardNo.toUpperCase().trim();
        if (regNo !== undefined) updateData.regNo = regNo.toUpperCase().trim();
        if (invoiceNo !== undefined) updateData.invoiceNo = invoiceNo;
        if (serviceType !== undefined) updateData.serviceType = serviceType;
        if (vehicle !== undefined) updateData.vehicle = vehicle.trim();
        if (status !== undefined) updateData.status = status;
        if (customerName !== undefined) updateData.customerName = customerName.trim();
        if (mobileNo !== undefined) updateData.mobileNo = mobileNo.trim();
        if (arrivalDate !== undefined) updateData.arrivalDate = new Date(arrivalDate);
        if (arrivalTime !== undefined) updateData.arrivalTime = arrivalTime.trim();
        if (notes !== undefined) updateData.notes = notes;

        const jobCard = await JobCard.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        );

        return res.status(200).json({
            success: true,
            message: "Job card updated successfully",
            jobCard,
        });
    } catch (err) {
        console.error("❌ Error updating job card:", err.message);

        // Handle duplicate key error
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Job Card No. already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update job card",
            error: err.message,
        });
    }
};

// Delete a job card
exports.deleteJobCard = async (req, res) => {
    try {
        const jobCard = await JobCard.findByIdAndDelete(req.params.id);

        if (!jobCard) {
            return res.status(404).json({
                success: false,
                message: "Job card not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Job card deleted successfully",
        });
    } catch (err) {
        console.error("❌ Error deleting job card:", err.message);
        return res.status(500).json({
            success: false,
            message: "Failed to delete job card",
            error: err.message,
        });
    }
};

// Get job card by job card number
exports.getJobCardByJobCardNo = async (req, res) => {
    try {
        const jobCard = await JobCard.findOne({ jobCardNo: req.params.jobCardNo.toUpperCase() });

        if (!jobCard) {
            return res.status(404).json({
                success: false,
                message: "Job card not found",
            });
        }

        return res.status(200).json({
            success: true,
            jobCard,
        });
    } catch (err) {
        console.error("❌ Error fetching job card:", err.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch job card",
            error: err.message,
        });
    }
};


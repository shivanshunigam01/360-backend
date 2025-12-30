const JobCard = require("../models/JobCard");

// Helper function to generate the next sequential job card number
const generateJobCardNo = async (retryCount = 0) => {
    try {
        // Find all job cards with valid jobCardNo and extract the highest number
        const allJobCards = await JobCard.find({
            jobCardNo: { $exists: true, $ne: null, $ne: "" }
        })
            .select("jobCardNo")
            .sort({ jobCardNo: -1 }) // Sort descending to get the latest first
            .lean();

        let maxNumber = 0;

        // Extract numbers from all job card numbers and find the maximum
        // Supports formats: "JC-001", "JC001", "JC-123", etc.
        allJobCards.forEach((card) => {
            if (card.jobCardNo) {
                // Extract number from job card number (e.g., "JC-001" -> 1, "JC001" -> 1, "JC-123" -> 123)
                const match = card.jobCardNo.match(/\d+$/);
                if (match) {
                    const num = parseInt(match[0], 10);
                    if (!isNaN(num) && num > maxNumber) {
                        maxNumber = num;
                    }
                }
            }
        });

        // Increment and format as JC-001, JC-002, etc. (3-digit padding with hyphen)
        const nextNumber = maxNumber + 1;
        const generatedNo = `JC-${nextNumber.toString().padStart(3, "0")}`;

        // Double-check if this number already exists (race condition protection)
        const exists = await JobCard.findOne({ jobCardNo: generatedNo });
        if (exists) {
            if (retryCount < 10) {
                // If exists, recursively try again with incremented number
                return generateJobCardNo(retryCount + 1);
            } else {
                // If too many retries, throw error
                throw new Error("Unable to generate unique job card number after multiple attempts");
            }
        }

        return generatedNo;
    } catch (error) {
        console.error("Error generating job card number:", error);
        // If retry count exceeded, throw the error
        if (error.message.includes("Unable to generate")) {
            throw error;
        }
        // Fallback: use timestamp-based number with hyphen (only as last resort)
        const timestamp = Date.now().toString().slice(-6);
        return `JC-${timestamp}`;
    }
};

// Create a new job card
exports.createJobCard = async (req, res) => {
    // Extract variables outside try block so they're accessible in catch block
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

    try {

        // Basic validation
        if (!regNo || !vehicle || !customerName || !mobileNo || !arrivalDate || !arrivalTime) {
            return res.status(400).json({
                success: false,
                message: "Required fields: regNo, vehicle, customerName, mobileNo, arrivalDate, arrivalTime",
            });
        }

        // Always auto-generate jobCardNo (never null, never empty, always sequential)
        // Ignore any manual input and always auto-generate to ensure sequence and uniqueness
        let finalJobCardNo;
        try {
            finalJobCardNo = await generateJobCardNo();
            console.log("✅ Generated job card number:", finalJobCardNo);
        } catch (genError) {
            console.error("❌ Failed to generate job card number:", genError);
            return res.status(500).json({
                success: false,
                message: "Failed to generate Job Card No. Please try again.",
                error: genError.message,
            });
        }

        // Final validation: ensure jobCardNo is always set (should never be null/undefined/empty)
        if (!finalJobCardNo || finalJobCardNo.trim() === "") {
            console.error("❌ Generated job card number is empty or null!");
            return res.status(500).json({
                success: false,
                message: "Failed to generate Job Card No.",
            });
        }

        console.log("📝 Creating job card with jobCardNo:", finalJobCardNo);
        const jobCard = await JobCard.create({
            rfeNo: rfeNo || "",
            jobCardNo: finalJobCardNo,
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
        console.error("❌ Error details:", JSON.stringify(err, null, 2));

        // Check for old database index error
        if (err.message && err.message.includes("jobNumber_1")) {
            return res.status(500).json({
                success: false,
                message: "Database configuration error: Old index detected",
                error: "The database has an old 'jobNumber_1' index that needs to be removed. Please run the migration script: node scripts/dropOldJobCardIndex.js",
                details: err.message,
            });
        }

        // Handle duplicate key error - always retry since we auto-generate
        if (err.code === 11000) {
            try {
                // Retry with a new generated number (handles race conditions)
                const retryJobCardNo = await generateJobCardNo();
                const jobCard = await JobCard.create({
                    rfeNo: rfeNo || "",
                    jobCardNo: retryJobCardNo,
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
            } catch (retryErr) {
                console.error("❌ Retry failed:", retryErr.message);
                // Check if retry also has the old index error
                if (retryErr.message && retryErr.message.includes("jobNumber_1")) {
                    return res.status(500).json({
                        success: false,
                        message: "Database configuration error: Old index detected",
                        error: "The database has an old 'jobNumber_1' index that needs to be removed. Please run the migration script: node scripts/dropOldJobCardIndex.js",
                        details: retryErr.message,
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: "Job Card No. conflict. Please try again.",
                    error: retryErr.message,
                });
            }
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


const StockInward = require("../models/StockInward");
const Stock = require("../models/Stock");
const PurchaseOrder = require("../models/PurchaseOrder");

// Create new stock inward record
exports.createStockInward = async (req, res) => {
  try {
    const {
      orderNo,
      purchaseOrderId,
      jobCardNo,
      jobCardId,
      regNo,
      vendorName,
      orderDate,
      inwardDate,
      receiptNo,
      items,
      notes,
    } = req.body;

    // Generate inward number
    const inwardNo = await StockInward.generateInwardNo();

    const stockInward = new StockInward({
      inwardNo,
      orderNo,
      purchaseOrderId,
      jobCardNo,
      jobCardId,
      regNo,
      vendorName,
      orderDate,
      inwardDate: inwardDate || new Date(),
      receiptNo,
      items,
      notes,
      createdBy: req.user?.userId,
      status: "Draft",
    });

    await stockInward.save();

    res.status(201).json({
      success: true,
      message: "Stock inward record created successfully",
      data: stockInward,
    });
  } catch (error) {
    console.error("Create Stock Inward Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create inward from purchase order
exports.createFromPurchaseOrder = async (req, res) => {
  try {
    const { purchaseOrderId } = req.params;
    const { items, receiptNo, inwardDate, notes } = req.body;

    const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
    }

    // Generate inward number
    const inwardNo = await StockInward.generateInwardNo();

    // If no items provided, use all ordered parts
    let inwardItems = items;
    if (!inwardItems || inwardItems.length === 0) {
      inwardItems = purchaseOrder.orderedParts.map((part) => ({
        stockId: part.stockId,
        partNumber: part.partNumber,
        partName: part.partName,
        quantity: part.quantity,
        rate: part.unitPrice,
      }));
    }

    const stockInward = new StockInward({
      inwardNo,
      orderNo: purchaseOrder.orderNo,
      purchaseOrderId: purchaseOrder._id,
      jobCardNo: purchaseOrder.jobCardNo,
      jobCardId: purchaseOrder.jobCardId,
      regNo: purchaseOrder.regNo,
      vendorName: purchaseOrder.vendorName,
      orderDate: purchaseOrder.orderDate,
      inwardDate: inwardDate || new Date(),
      receiptNo,
      items: inwardItems,
      notes,
      createdBy: req.user?.userId,
      status: "Draft",
    });

    await stockInward.save();

    res.status(201).json({
      success: true,
      message: "Stock inward created from purchase order",
      data: stockInward,
    });
  } catch (error) {
    console.error("Create From PO Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all stock inward records
exports.getAllStockInwards = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      vendorName,
      fromDate,
      toDate,
      jobCardNo,
      orderNo,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    // Search
    if (search) {
      query.$or = [
        { inwardNo: { $regex: search, $options: "i" } },
        { orderNo: { $regex: search, $options: "i" } },
        { vendorName: { $regex: search, $options: "i" } },
        { jobCardNo: { $regex: search, $options: "i" } },
        { regNo: { $regex: search, $options: "i" } },
        { receiptNo: { $regex: search, $options: "i" } },
      ];
    }

    // Filters
    if (status) query.status = status;
    if (vendorName) query.vendorName = { $regex: vendorName, $options: "i" };
    if (jobCardNo) query.jobCardNo = jobCardNo;
    if (orderNo) query.orderNo = orderNo;

    // Date range
    if (fromDate || toDate) {
      query.inwardDate = {};
      if (fromDate) query.inwardDate.$gte = new Date(fromDate);
      if (toDate) query.inwardDate.$lte = new Date(toDate);
    }

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const total = await StockInward.countDocuments(query);
    const stockInwards = await StockInward.find(query)
      .populate("createdBy", "name email")
      .populate("verifiedBy", "name email")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: stockInwards,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get All Stock Inwards Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single stock inward by ID
exports.getStockInwardById = async (req, res) => {
  try {
    const stockInward = await StockInward.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("verifiedBy", "name email")
      .populate("purchaseOrderId")
      .populate("items.stockId", "partNumber partName brand category");

    if (!stockInward) {
      return res.status(404).json({
        success: false,
        message: "Stock inward record not found",
      });
    }

    res.json({
      success: true,
      data: stockInward,
    });
  } catch (error) {
    console.error("Get Stock Inward By ID Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get by inward number
exports.getStockInwardByNo = async (req, res) => {
  try {
    const stockInward = await StockInward.findOne({
      inwardNo: req.params.inwardNo,
    })
      .populate("createdBy", "name email")
      .populate("verifiedBy", "name email");

    if (!stockInward) {
      return res.status(404).json({
        success: false,
        message: "Stock inward record not found",
      });
    }

    res.json({
      success: true,
      data: stockInward,
    });
  } catch (error) {
    console.error("Get Stock Inward By No Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update stock inward
exports.updateStockInward = async (req, res) => {
  try {
    const {
      orderNo,
      jobCardNo,
      regNo,
      vendorName,
      orderDate,
      inwardDate,
      receiptNo,
      items,
      notes,
    } = req.body;

    const stockInward = await StockInward.findById(req.params.id);

    if (!stockInward) {
      return res.status(404).json({
        success: false,
        message: "Stock inward record not found",
      });
    }

    // Only allow updates if not verified
    if (stockInward.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Cannot update verified inward record",
      });
    }

    if (orderNo !== undefined) stockInward.orderNo = orderNo;
    if (jobCardNo !== undefined) stockInward.jobCardNo = jobCardNo;
    if (regNo !== undefined) stockInward.regNo = regNo;
    if (vendorName !== undefined) stockInward.vendorName = vendorName;
    if (orderDate !== undefined) stockInward.orderDate = orderDate;
    if (inwardDate !== undefined) stockInward.inwardDate = inwardDate;
    if (receiptNo !== undefined) stockInward.receiptNo = receiptNo;
    if (items !== undefined) stockInward.items = items;
    if (notes !== undefined) stockInward.notes = notes;

    await stockInward.save();

    res.json({
      success: true,
      message: "Stock inward updated successfully",
      data: stockInward,
    });
  } catch (error) {
    console.error("Update Stock Inward Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Verify inward and update stock
exports.verifyAndUpdateStock = async (req, res) => {
  try {
    const stockInward = await StockInward.findById(req.params.id);

    if (!stockInward) {
      return res.status(404).json({
        success: false,
        message: "Stock inward record not found",
      });
    }

    if (stockInward.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Already verified",
      });
    }

    // Update stock quantities
    for (const item of stockInward.items) {
      if (item.stockId) {
        await Stock.findByIdAndUpdate(item.stockId, {
          $inc: { quantityOnHand: item.quantity },
          lastMovementDate: new Date(),
        });
      } else {
        // Try to find stock by part number
        const stock = await Stock.findOne({ partNumber: item.partNumber });
        if (stock) {
          stock.quantityOnHand += item.quantity;
          stock.lastMovementDate = new Date();
          await stock.save();
        }
      }
    }

    // Update purchase order if linked
    if (stockInward.purchaseOrderId) {
      const purchaseOrder = await PurchaseOrder.findById(stockInward.purchaseOrderId);
      if (purchaseOrder) {
        for (const item of stockInward.items) {
          const orderedPart = purchaseOrder.orderedParts.find(
            (p) => p.partNumber === item.partNumber
          );

          if (orderedPart) {
            purchaseOrder.inwardedParts.push({
              stockId: orderedPart.stockId,
              partNumber: item.partNumber,
              partName: item.partName,
              quantity: item.quantity,
              inwardDate: stockInward.inwardDate,
              remarks: `Inward No: ${stockInward.inwardNo}`,
            });
          }
        }
        await purchaseOrder.save();
      }
    }

    // Mark as verified
    stockInward.isVerified = true;
    stockInward.verifiedBy = req.user?.userId;
    stockInward.verifiedAt = new Date();
    stockInward.status = "Verified";
    stockInward.stockUpdated = true;

    await stockInward.save();

    res.json({
      success: true,
      message: "Stock inward verified and stock updated successfully",
      data: stockInward,
    });
  } catch (error) {
    console.error("Verify Stock Inward Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Submit for verification
exports.submitForVerification = async (req, res) => {
  try {
    const stockInward = await StockInward.findById(req.params.id);

    if (!stockInward) {
      return res.status(404).json({
        success: false,
        message: "Stock inward record not found",
      });
    }

    if (stockInward.status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft records can be submitted",
      });
    }

    if (!stockInward.items || stockInward.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot submit empty inward record",
      });
    }

    stockInward.status = "Pending Verification";
    await stockInward.save();

    res.json({
      success: true,
      message: "Submitted for verification",
      data: stockInward,
    });
  } catch (error) {
    console.error("Submit For Verification Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Cancel inward
exports.cancelStockInward = async (req, res) => {
  try {
    const { reason } = req.body;

    const stockInward = await StockInward.findById(req.params.id);

    if (!stockInward) {
      return res.status(404).json({
        success: false,
        message: "Stock inward record not found",
      });
    }

    if (stockInward.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel verified inward record",
      });
    }

    stockInward.status = "Cancelled";
    stockInward.notes = stockInward.notes
      ? `${stockInward.notes}\nCancelled: ${reason}`
      : `Cancelled: ${reason}`;

    await stockInward.save();

    res.json({
      success: true,
      message: "Stock inward cancelled",
      data: stockInward,
    });
  } catch (error) {
    console.error("Cancel Stock Inward Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete inward (draft only)
exports.deleteStockInward = async (req, res) => {
  try {
    const stockInward = await StockInward.findById(req.params.id);

    if (!stockInward) {
      return res.status(404).json({
        success: false,
        message: "Stock inward record not found",
      });
    }

    if (stockInward.status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft records can be deleted",
      });
    }

    await StockInward.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Stock inward deleted successfully",
    });
  } catch (error) {
    console.error("Delete Stock Inward Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get statistics
exports.getStockInwardStats = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const dateFilter = {};
    if (fromDate || toDate) {
      dateFilter.inwardDate = {};
      if (fromDate) dateFilter.inwardDate.$gte = new Date(fromDate);
      if (toDate) dateFilter.inwardDate.$lte = new Date(toDate);
    }

    const totalRecords = await StockInward.countDocuments(dateFilter);

    const statusCounts = await StockInward.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$inwardValue" },
        },
      },
    ]);

    const totalValues = await StockInward.aggregate([
      { $match: { ...dateFilter, status: "Verified" } },
      {
        $group: {
          _id: null,
          totalInwardValue: { $sum: "$inwardValue" },
          totalQuantity: { $sum: "$totalQuantity" },
        },
      },
    ]);

    const vendorStats = await StockInward.aggregate([
      { $match: { ...dateFilter, status: "Verified" } },
      {
        $group: {
          _id: "$vendorName",
          inwardCount: { $sum: 1 },
          totalValue: { $sum: "$inwardValue" },
          totalQuantity: { $sum: "$totalQuantity" },
        },
      },
      { $sort: { totalValue: -1 } },
      { $limit: 10 },
    ]);

    const dailyInwards = await StockInward.aggregate([
      { $match: { ...dateFilter, status: "Verified" } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$inwardDate" },
          },
          count: { $sum: 1 },
          totalValue: { $sum: "$inwardValue" },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ]);

    res.json({
      success: true,
      data: {
        totalRecords,
        statusCounts,
        totalInwardValue: totalValues[0]?.totalInwardValue || 0,
        totalQuantity: totalValues[0]?.totalQuantity || 0,
        topVendors: vendorStats,
        dailyInwards,
      },
    });
  } catch (error) {
    console.error("Get Stock Inward Stats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get inwards by vendor
exports.getInwardsByVendor = async (req, res) => {
  try {
    const { vendorName } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const query = { vendorName: { $regex: vendorName, $options: "i" } };

    const total = await StockInward.countDocuments(query);
    const inwards = await StockInward.find(query)
      .sort({ inwardDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: inwards,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Inwards By Vendor Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get pending verifications
exports.getPendingVerifications = async (req, res) => {
  try {
    const pendingInwards = await StockInward.find({
      status: "Pending Verification",
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pendingInwards.length,
      data: pendingInwards,
    });
  } catch (error) {
    console.error("Get Pending Verifications Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


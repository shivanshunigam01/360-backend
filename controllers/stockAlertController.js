const StockAlert = require("../models/StockAlert");
const Stock = require("../models/Stock");

// Create new stock alert
exports.createStockAlert = async (req, res) => {
  try {
    const {
      stockId,
      partNo,
      partName,
      brand,
      category,
      currentQty,
      minStockLevel,
      reorderQty,
      purchasePrice,
      jobCardNo,
      jobCardId,
      vehicleNo,
      vendorName,
      inwardNo,
      inwardDate,
      alertType,
      priority,
      notes,
    } = req.body;

    // Generate alert number
    const alertNo = await StockAlert.generateAlertNo();

    const stockAlert = new StockAlert({
      alertNo,
      stockId,
      partNo,
      partName,
      brand,
      category,
      currentQty,
      minStockLevel,
      reorderQty,
      purchasePrice,
      jobCardNo,
      jobCardId,
      vehicleNo,
      vendorName,
      inwardNo,
      inwardDate,
      alertType: alertType || "Low Stock",
      priority,
      notes,
      createdBy: req.user?.userId,
    });

    // Auto-calculate priority if not provided
    if (!priority) {
      stockAlert.calculatePriority();
    }

    await stockAlert.save();

    res.status(201).json({
      success: true,
      message: "Stock alert created successfully",
      data: stockAlert,
    });
  } catch (error) {
    console.error("Create Stock Alert Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Auto-generate alerts for low stock items
exports.generateLowStockAlerts = async (req, res) => {
  try {
    // Find all items with low stock
    const lowStockItems = await Stock.find({
      isActive: true,
      $expr: { $lte: ["$quantityOnHand", "$minStockLevel"] },
    });

    const alerts = [];
    const skipped = [];

    for (const stock of lowStockItems) {
      // Check if active alert already exists for this stock
      const existingAlert = await StockAlert.findOne({
        stockId: stock._id,
        status: "Active",
      });

      if (existingAlert) {
        skipped.push(stock.partNumber);
        continue;
      }

      const alertNo = await StockAlert.generateAlertNo();

      const alert = new StockAlert({
        alertNo,
        stockId: stock._id,
        partNo: stock.partNumber,
        partName: stock.partName,
        brand: stock.brand,
        category: stock.category,
        currentQty: stock.quantityOnHand,
        minStockLevel: stock.minStockLevel,
        purchasePrice: stock.purchasePrice,
        alertType: stock.quantityOnHand === 0 ? "Out of Stock" : "Low Stock",
        createdBy: req.user?.userId,
      });

      alert.calculatePriority();
      await alert.save();
      alerts.push(alert);
    }

    res.json({
      success: true,
      message: `Generated ${alerts.length} alerts, ${skipped.length} skipped (already have active alerts)`,
      data: {
        created: alerts.length,
        skipped: skipped.length,
        alerts,
      },
    });
  } catch (error) {
    console.error("Generate Low Stock Alerts Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all stock alerts
exports.getAllStockAlerts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      priority,
      alertType,
      vendorName,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    // Search
    if (search) {
      query.$or = [
        { alertNo: { $regex: search, $options: "i" } },
        { partNo: { $regex: search, $options: "i" } },
        { partName: { $regex: search, $options: "i" } },
        { vendorName: { $regex: search, $options: "i" } },
        { jobCardNo: { $regex: search, $options: "i" } },
        { vehicleNo: { $regex: search, $options: "i" } },
      ];
    }

    // Filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (alertType) query.alertType = alertType;
    if (vendorName) query.vendorName = { $regex: vendorName, $options: "i" };

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const total = await StockAlert.countDocuments(query);
    const stockAlerts = await StockAlert.find(query)
      .populate("createdBy", "name email")
      .populate("resolvedBy", "name email")
      .populate("stockId", "partNumber partName quantityOnHand")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: stockAlerts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get All Stock Alerts Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single stock alert by ID
exports.getStockAlertById = async (req, res) => {
  try {
    const stockAlert = await StockAlert.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("resolvedBy", "name email")
      .populate("stockId");

    if (!stockAlert) {
      return res.status(404).json({
        success: false,
        message: "Stock alert not found",
      });
    }

    res.json({
      success: true,
      data: stockAlert,
    });
  } catch (error) {
    console.error("Get Stock Alert By ID Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update stock alert
exports.updateStockAlert = async (req, res) => {
  try {
    const {
      jobCardNo,
      vehicleNo,
      vendorName,
      inwardNo,
      inwardDate,
      purchasePrice,
      reorderQty,
      priority,
      notes,
    } = req.body;

    const stockAlert = await StockAlert.findById(req.params.id);

    if (!stockAlert) {
      return res.status(404).json({
        success: false,
        message: "Stock alert not found",
      });
    }

    if (jobCardNo !== undefined) stockAlert.jobCardNo = jobCardNo;
    if (vehicleNo !== undefined) stockAlert.vehicleNo = vehicleNo;
    if (vendorName !== undefined) stockAlert.vendorName = vendorName;
    if (inwardNo !== undefined) stockAlert.inwardNo = inwardNo;
    if (inwardDate !== undefined) stockAlert.inwardDate = inwardDate;
    if (purchasePrice !== undefined) stockAlert.purchasePrice = purchasePrice;
    if (reorderQty !== undefined) stockAlert.reorderQty = reorderQty;
    if (priority !== undefined) stockAlert.priority = priority;
    if (notes !== undefined) stockAlert.notes = notes;

    await stockAlert.save();

    res.json({
      success: true,
      message: "Stock alert updated successfully",
      data: stockAlert,
    });
  } catch (error) {
    console.error("Update Stock Alert Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Acknowledge alert
exports.acknowledgeAlert = async (req, res) => {
  try {
    const stockAlert = await StockAlert.findById(req.params.id);

    if (!stockAlert) {
      return res.status(404).json({
        success: false,
        message: "Stock alert not found",
      });
    }

    stockAlert.status = "Acknowledged";
    await stockAlert.save();

    res.json({
      success: true,
      message: "Alert acknowledged",
      data: stockAlert,
    });
  } catch (error) {
    console.error("Acknowledge Alert Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Resolve alert
exports.resolveAlert = async (req, res) => {
  try {
    const { resolutionNote } = req.body;

    const stockAlert = await StockAlert.findById(req.params.id);

    if (!stockAlert) {
      return res.status(404).json({
        success: false,
        message: "Stock alert not found",
      });
    }

    stockAlert.status = "Resolved";
    stockAlert.resolvedBy = req.user?.userId;
    stockAlert.resolvedAt = new Date();
    stockAlert.resolutionNote = resolutionNote;

    await stockAlert.save();

    res.json({
      success: true,
      message: "Alert resolved",
      data: stockAlert,
    });
  } catch (error) {
    console.error("Resolve Alert Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Ignore alert
exports.ignoreAlert = async (req, res) => {
  try {
    const { reason } = req.body;

    const stockAlert = await StockAlert.findById(req.params.id);

    if (!stockAlert) {
      return res.status(404).json({
        success: false,
        message: "Stock alert not found",
      });
    }

    stockAlert.status = "Ignored";
    stockAlert.notes = stockAlert.notes
      ? `${stockAlert.notes}\nIgnored: ${reason}`
      : `Ignored: ${reason}`;

    await stockAlert.save();

    res.json({
      success: true,
      message: "Alert ignored",
      data: stockAlert,
    });
  } catch (error) {
    console.error("Ignore Alert Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete alert
exports.deleteStockAlert = async (req, res) => {
  try {
    const stockAlert = await StockAlert.findByIdAndDelete(req.params.id);

    if (!stockAlert) {
      return res.status(404).json({
        success: false,
        message: "Stock alert not found",
      });
    }

    res.json({
      success: true,
      message: "Stock alert deleted successfully",
    });
  } catch (error) {
    console.error("Delete Stock Alert Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get active alerts count
exports.getActiveAlertsCount = async (req, res) => {
  try {
    const counts = await StockAlert.aggregate([
      { $match: { status: "Active" } },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalActive = await StockAlert.countDocuments({ status: "Active" });

    res.json({
      success: true,
      data: {
        total: totalActive,
        byPriority: counts,
      },
    });
  } catch (error) {
    console.error("Get Active Alerts Count Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get statistics
exports.getStockAlertStats = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const dateFilter = {};
    if (fromDate || toDate) {
      dateFilter.createdAt = {};
      if (fromDate) dateFilter.createdAt.$gte = new Date(fromDate);
      if (toDate) dateFilter.createdAt.$lte = new Date(toDate);
    }

    const totalAlerts = await StockAlert.countDocuments(dateFilter);

    const statusCounts = await StockAlert.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityCounts = await StockAlert.aggregate([
      { $match: { ...dateFilter, status: "Active" } },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const typeCounts = await StockAlert.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$alertType",
          count: { $sum: 1 },
        },
      },
    ]);

    const topAlertedParts = await StockAlert.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$partNo",
          partName: { $first: "$partName" },
          alertCount: { $sum: 1 },
        },
      },
      { $sort: { alertCount: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        totalAlerts,
        statusCounts,
        priorityCounts,
        typeCounts,
        topAlertedParts,
      },
    });
  } catch (error) {
    console.error("Get Stock Alert Stats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Bulk resolve alerts
exports.bulkResolveAlerts = async (req, res) => {
  try {
    const { alertIds, resolutionNote } = req.body;

    await StockAlert.updateMany(
      { _id: { $in: alertIds } },
      {
        status: "Resolved",
        resolvedBy: req.user?.userId,
        resolvedAt: new Date(),
        resolutionNote,
      }
    );

    res.json({
      success: true,
      message: `${alertIds.length} alerts resolved`,
    });
  } catch (error) {
    console.error("Bulk Resolve Alerts Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


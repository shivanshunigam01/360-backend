const StockTransfer = require("../models/StockTransfer");
const Stock = require("../models/Stock");

// Create new stock transfer
exports.createStockTransfer = async (req, res) => {
  try {
    const {
      fromWorkshop,
      fromWorkshopId,
      toWorkshop,
      toWorkshopId,
      transferDate,
      expectedDeliveryDate,
      items,
      transferReason,
      transferMethod,
      vehicleNo,
      driverName,
      driverContact,
      notes,
    } = req.body;

    // Validate workshops
    if (fromWorkshop === toWorkshop) {
      return res.status(400).json({
        success: false,
        message: "Source and destination workshops cannot be the same",
      });
    }

    // Generate transfer number
    const transferNo = await StockTransfer.generateTransferNo();

    // Enrich items with stock info
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        let stock = null;

        if (item.stockId) {
          stock = await Stock.findById(item.stockId);
        } else if (item.partNo) {
          stock = await Stock.findOne({ partNumber: item.partNo });
        }

        return {
          stockId: stock?._id || item.stockId,
          partNo: item.partNo || stock?.partNumber,
          partName: item.partName || stock?.partName,
          brand: item.brand || stock?.brand,
          quantity: item.quantity,
          unitPrice: item.unitPrice || stock?.purchasePrice || 0,
          remarks: item.remarks,
          sentQty: 0,
          receivedQty: 0,
          status: "Pending",
        };
      })
    );

    const stockTransfer = new StockTransfer({
      transferNo,
      fromWorkshop,
      fromWorkshopId,
      toWorkshop,
      toWorkshopId,
      transferDate: transferDate || new Date(),
      expectedDeliveryDate,
      items: enrichedItems,
      transferReason,
      transferMethod,
      vehicleNo,
      driverName,
      driverContact,
      notes,
      createdBy: req.user?.userId,
      status: "Draft",
    });

    await stockTransfer.save();

    res.status(201).json({
      success: true,
      message: "Stock transfer created successfully",
      data: stockTransfer,
    });
  } catch (error) {
    console.error("Create Stock Transfer Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all stock transfers
exports.getAllStockTransfers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      fromWorkshop,
      toWorkshop,
      fromDate,
      toDate,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    // Search
    if (search) {
      query.$or = [
        { transferNo: { $regex: search, $options: "i" } },
        { fromWorkshop: { $regex: search, $options: "i" } },
        { toWorkshop: { $regex: search, $options: "i" } },
        { "items.partNo": { $regex: search, $options: "i" } },
        { "items.partName": { $regex: search, $options: "i" } },
      ];
    }

    // Filters
    if (status) query.status = status;
    if (fromWorkshop) query.fromWorkshop = { $regex: fromWorkshop, $options: "i" };
    if (toWorkshop) query.toWorkshop = { $regex: toWorkshop, $options: "i" };

    // Date range
    if (fromDate || toDate) {
      query.transferDate = {};
      if (fromDate) query.transferDate.$gte = new Date(fromDate);
      if (toDate) query.transferDate.$lte = new Date(toDate);
    }

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const total = await StockTransfer.countDocuments(query);
    const stockTransfers = await StockTransfer.find(query)
      .populate("createdBy", "name email")
      .populate("approvedBy", "name email")
      .populate("dispatchedBy", "name email")
      .populate("receivedBy", "name email")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: stockTransfers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get All Stock Transfers Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single stock transfer by ID
exports.getStockTransferById = async (req, res) => {
  try {
    const stockTransfer = await StockTransfer.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("approvedBy", "name email")
      .populate("dispatchedBy", "name email")
      .populate("receivedBy", "name email")
      .populate("items.stockId", "partNumber partName brand quantityOnHand");

    if (!stockTransfer) {
      return res.status(404).json({
        success: false,
        message: "Stock transfer not found",
      });
    }

    res.json({
      success: true,
      data: stockTransfer,
    });
  } catch (error) {
    console.error("Get Stock Transfer By ID Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get by transfer number
exports.getStockTransferByNo = async (req, res) => {
  try {
    const stockTransfer = await StockTransfer.findOne({
      transferNo: req.params.transferNo,
    })
      .populate("createdBy", "name email")
      .populate("approvedBy", "name email");

    if (!stockTransfer) {
      return res.status(404).json({
        success: false,
        message: "Stock transfer not found",
      });
    }

    res.json({
      success: true,
      data: stockTransfer,
    });
  } catch (error) {
    console.error("Get Stock Transfer By No Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update stock transfer
exports.updateStockTransfer = async (req, res) => {
  try {
    const {
      fromWorkshop,
      toWorkshop,
      transferDate,
      expectedDeliveryDate,
      items,
      transferReason,
      transferMethod,
      vehicleNo,
      driverName,
      driverContact,
      notes,
    } = req.body;

    const stockTransfer = await StockTransfer.findById(req.params.id);

    if (!stockTransfer) {
      return res.status(404).json({
        success: false,
        message: "Stock transfer not found",
      });
    }

    // Only allow updates if not dispatched
    if (!["Draft", "Pending Approval", "Approved"].includes(stockTransfer.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot update after dispatch",
      });
    }

    if (fromWorkshop !== undefined) stockTransfer.fromWorkshop = fromWorkshop;
    if (toWorkshop !== undefined) stockTransfer.toWorkshop = toWorkshop;
    if (transferDate !== undefined) stockTransfer.transferDate = transferDate;
    if (expectedDeliveryDate !== undefined) stockTransfer.expectedDeliveryDate = expectedDeliveryDate;
    if (items !== undefined) stockTransfer.items = items;
    if (transferReason !== undefined) stockTransfer.transferReason = transferReason;
    if (transferMethod !== undefined) stockTransfer.transferMethod = transferMethod;
    if (vehicleNo !== undefined) stockTransfer.vehicleNo = vehicleNo;
    if (driverName !== undefined) stockTransfer.driverName = driverName;
    if (driverContact !== undefined) stockTransfer.driverContact = driverContact;
    if (notes !== undefined) stockTransfer.notes = notes;

    await stockTransfer.save();

    res.json({
      success: true,
      message: "Stock transfer updated successfully",
      data: stockTransfer,
    });
  } catch (error) {
    console.error("Update Stock Transfer Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Submit for approval
exports.submitForApproval = async (req, res) => {
  try {
    const stockTransfer = await StockTransfer.findById(req.params.id);

    if (!stockTransfer) {
      return res.status(404).json({
        success: false,
        message: "Stock transfer not found",
      });
    }

    if (stockTransfer.status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft transfers can be submitted",
      });
    }

    if (!stockTransfer.items || stockTransfer.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot submit empty transfer",
      });
    }

    stockTransfer.status = "Pending Approval";
    await stockTransfer.save();

    res.json({
      success: true,
      message: "Submitted for approval",
      data: stockTransfer,
    });
  } catch (error) {
    console.error("Submit For Approval Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Approve transfer
exports.approveTransfer = async (req, res) => {
  try {
    const stockTransfer = await StockTransfer.findById(req.params.id);

    if (!stockTransfer) {
      return res.status(404).json({
        success: false,
        message: "Stock transfer not found",
      });
    }

    if (stockTransfer.status !== "Pending Approval") {
      return res.status(400).json({
        success: false,
        message: "Only pending transfers can be approved",
      });
    }

    // Check stock availability
    for (const item of stockTransfer.items) {
      let stock = null;
      if (item.stockId) {
        stock = await Stock.findById(item.stockId);
      } else {
        stock = await Stock.findOne({ partNumber: item.partNo });
      }

      if (!stock || stock.quantityOnHand < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.partNo}. Available: ${stock?.quantityOnHand || 0}`,
        });
      }
    }

    stockTransfer.status = "Approved";
    stockTransfer.approvedBy = req.user?.userId;
    stockTransfer.approvedAt = new Date();

    await stockTransfer.save();

    res.json({
      success: true,
      message: "Transfer approved",
      data: stockTransfer,
    });
  } catch (error) {
    console.error("Approve Transfer Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Dispatch transfer (deduct from source stock)
exports.dispatchTransfer = async (req, res) => {
  try {
    const { vehicleNo, driverName, driverContact } = req.body;

    const stockTransfer = await StockTransfer.findById(req.params.id);

    if (!stockTransfer) {
      return res.status(404).json({
        success: false,
        message: "Stock transfer not found",
      });
    }

    if (stockTransfer.status !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved transfers can be dispatched",
      });
    }

    // Deduct from source stock
    for (const item of stockTransfer.items) {
      let stock = null;
      if (item.stockId) {
        stock = await Stock.findById(item.stockId);
      } else {
        stock = await Stock.findOne({ partNumber: item.partNo });
      }

      if (!stock || stock.quantityOnHand < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.partNo}. Available: ${stock?.quantityOnHand || 0}`,
        });
      }

      stock.quantityOnHand -= item.quantity;
      stock.lastMovementDate = new Date();
      await stock.save();

      item.sentQty = item.quantity;
      item.status = "Sent";
    }

    if (vehicleNo) stockTransfer.vehicleNo = vehicleNo;
    if (driverName) stockTransfer.driverName = driverName;
    if (driverContact) stockTransfer.driverContact = driverContact;

    stockTransfer.status = "In Transit";
    stockTransfer.sourceStockDeducted = true;
    stockTransfer.dispatchedBy = req.user?.userId;
    stockTransfer.dispatchedAt = new Date();

    await stockTransfer.save();

    res.json({
      success: true,
      message: "Transfer dispatched and stock deducted from source",
      data: stockTransfer,
    });
  } catch (error) {
    console.error("Dispatch Transfer Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Mark as delivered
exports.markAsDelivered = async (req, res) => {
  try {
    const stockTransfer = await StockTransfer.findById(req.params.id);

    if (!stockTransfer) {
      return res.status(404).json({
        success: false,
        message: "Stock transfer not found",
      });
    }

    if (stockTransfer.status !== "In Transit") {
      return res.status(400).json({
        success: false,
        message: "Only in-transit transfers can be marked as delivered",
      });
    }

    stockTransfer.status = "Delivered";
    stockTransfer.actualDeliveryDate = new Date();

    await stockTransfer.save();

    res.json({
      success: true,
      message: "Transfer marked as delivered",
      data: stockTransfer,
    });
  } catch (error) {
    console.error("Mark As Delivered Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Receive transfer (add to destination stock)
exports.receiveTransfer = async (req, res) => {
  try {
    const { items, receiverRemarks } = req.body;
    // items: [{ partNo, receivedQty, damagedQty, remarks }]

    const stockTransfer = await StockTransfer.findById(req.params.id);

    if (!stockTransfer) {
      return res.status(404).json({
        success: false,
        message: "Stock transfer not found",
      });
    }

    if (!["Delivered", "In Transit"].includes(stockTransfer.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot receive transfer in current status",
      });
    }

    // Process received items
    for (const receivedItem of items || []) {
      const transferItem = stockTransfer.items.find(
        (item) => item.partNo === receivedItem.partNo
      );

      if (transferItem) {
        transferItem.receivedQty = receivedItem.receivedQty || transferItem.quantity;
        transferItem.damagedQty = receivedItem.damagedQty || 0;

        if (receivedItem.remarks) {
          transferItem.remarks = transferItem.remarks
            ? `${transferItem.remarks}; Received: ${receivedItem.remarks}`
            : `Received: ${receivedItem.remarks}`;
        }

        // Update item status
        if (transferItem.damagedQty > 0) {
          transferItem.status = "Damaged";
        } else if (transferItem.receivedQty < transferItem.quantity) {
          transferItem.status = "Partial";
        } else {
          transferItem.status = "Received";
        }

        // Add to destination stock (Note: In a multi-workshop setup, you'd have separate stock per workshop)
        // For now, we'll just log the receipt. In production, you'd update the destination workshop's stock.
        // This is a simplified version - you may want to implement workshop-specific stock tracking
      }
    }

    // If no items provided, mark all as fully received
    if (!items || items.length === 0) {
      for (const item of stockTransfer.items) {
        item.receivedQty = item.quantity;
        item.status = "Received";
      }
    }

    stockTransfer.status = "Received";
    stockTransfer.destinationStockAdded = true;
    stockTransfer.receivedBy = req.user?.userId;
    stockTransfer.receivedAt = new Date();
    if (receiverRemarks) stockTransfer.receiverRemarks = receiverRemarks;

    await stockTransfer.save();

    res.json({
      success: true,
      message: "Transfer received successfully",
      data: stockTransfer,
    });
  } catch (error) {
    console.error("Receive Transfer Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Cancel transfer
exports.cancelTransfer = async (req, res) => {
  try {
    const { reason } = req.body;

    const stockTransfer = await StockTransfer.findById(req.params.id);

    if (!stockTransfer) {
      return res.status(404).json({
        success: false,
        message: "Stock transfer not found",
      });
    }

    // If stock was deducted, add it back
    if (stockTransfer.sourceStockDeducted) {
      for (const item of stockTransfer.items) {
        if (item.stockId) {
          await Stock.findByIdAndUpdate(item.stockId, {
            $inc: { quantityOnHand: item.sentQty },
            lastMovementDate: new Date(),
          });
        }
      }
    }

    stockTransfer.status = "Cancelled";
    stockTransfer.notes = stockTransfer.notes
      ? `${stockTransfer.notes}\nCancelled: ${reason}`
      : `Cancelled: ${reason}`;

    await stockTransfer.save();

    res.json({
      success: true,
      message: "Transfer cancelled",
      data: stockTransfer,
    });
  } catch (error) {
    console.error("Cancel Transfer Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete transfer (draft only)
exports.deleteStockTransfer = async (req, res) => {
  try {
    const stockTransfer = await StockTransfer.findById(req.params.id);

    if (!stockTransfer) {
      return res.status(404).json({
        success: false,
        message: "Stock transfer not found",
      });
    }

    if (stockTransfer.status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft transfers can be deleted",
      });
    }

    await StockTransfer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Stock transfer deleted successfully",
    });
  } catch (error) {
    console.error("Delete Stock Transfer Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get transfers by workshop
exports.getTransfersByWorkshop = async (req, res) => {
  try {
    const { workshop } = req.params;
    const { direction = "all", page = 1, limit = 20 } = req.query;

    let query = {};

    if (direction === "from") {
      query.fromWorkshop = { $regex: workshop, $options: "i" };
    } else if (direction === "to") {
      query.toWorkshop = { $regex: workshop, $options: "i" };
    } else {
      query.$or = [
        { fromWorkshop: { $regex: workshop, $options: "i" } },
        { toWorkshop: { $regex: workshop, $options: "i" } },
      ];
    }

    const total = await StockTransfer.countDocuments(query);
    const transfers = await StockTransfer.find(query)
      .sort({ transferDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: transfers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Transfers By Workshop Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get statistics
exports.getStockTransferStats = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const dateFilter = {};
    if (fromDate || toDate) {
      dateFilter.transferDate = {};
      if (fromDate) dateFilter.transferDate.$gte = new Date(fromDate);
      if (toDate) dateFilter.transferDate.$lte = new Date(toDate);
    }

    const totalTransfers = await StockTransfer.countDocuments(dateFilter);

    const statusCounts = await StockTransfer.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$totalValue" },
        },
      },
    ]);

    const totalValues = await StockTransfer.aggregate([
      { $match: { ...dateFilter, status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: null,
          totalTransferValue: { $sum: "$totalValue" },
          totalQuantity: { $sum: "$totalQuantity" },
        },
      },
    ]);

    const workshopStats = await StockTransfer.aggregate([
      { $match: { ...dateFilter, status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: { from: "$fromWorkshop", to: "$toWorkshop" },
          transferCount: { $sum: 1 },
          totalValue: { $sum: "$totalValue" },
        },
      },
      { $sort: { transferCount: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        totalTransfers,
        statusCounts,
        totalTransferValue: totalValues[0]?.totalTransferValue || 0,
        totalQuantity: totalValues[0]?.totalQuantity || 0,
        workshopStats,
      },
    });
  } catch (error) {
    console.error("Get Stock Transfer Stats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all workshops
exports.getWorkshops = async (req, res) => {
  try {
    const fromWorkshops = await StockTransfer.distinct("fromWorkshop");
    const toWorkshops = await StockTransfer.distinct("toWorkshop");

    const allWorkshops = [...new Set([...fromWorkshops, ...toWorkshops])].filter(Boolean).sort();

    res.json({
      success: true,
      data: allWorkshops,
    });
  } catch (error) {
    console.error("Get Workshops Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


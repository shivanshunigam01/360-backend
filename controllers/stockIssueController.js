const StockIssue = require("../models/StockIssue");
const Stock = require("../models/Stock");

// Create new stock issue request
exports.createStockIssue = async (req, res) => {
  try {
    const {
      issueDate,
      jobCardNo,
      jobCardId,
      regNo,
      vehicle,
      issuedTo,
      issuedToId,
      items,
      notes,
    } = req.body;

    // Generate issue number
    const issueNo = await StockIssue.generateIssueNo();

    // Fetch stock info for each item
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        let stockInfo = null;

        if (item.stockId) {
          stockInfo = await Stock.findById(item.stockId);
        } else if (item.partNo) {
          stockInfo = await Stock.findOne({ partNumber: item.partNo });
        }

        return {
          stockId: stockInfo?._id || item.stockId,
          partNo: item.partNo || stockInfo?.partNumber,
          partName: item.partName || stockInfo?.partName,
          brand: item.brand || stockInfo?.brand,
          avgPurchasePrice: item.avgPurchasePrice || stockInfo?.purchasePrice || 0,
          avgSellingPrice: item.avgSellingPrice || stockInfo?.sellingPrice || 0,
          requestedQty: item.requestedQty,
          issuedQty: 0,
          pendingQty: item.requestedQty,
          returnQty: 0,
          status: "Pending",
          remarks: item.remarks,
        };
      })
    );

    const stockIssue = new StockIssue({
      issueNo,
      issueDate: issueDate || new Date(),
      jobCardNo,
      jobCardId,
      regNo,
      vehicle,
      issuedTo,
      issuedToId,
      items: enrichedItems,
      notes,
      createdBy: req.user?.userId,
      status: "Pending",
    });

    await stockIssue.save();

    res.status(201).json({
      success: true,
      message: "Stock issue request created successfully",
      data: stockIssue,
    });
  } catch (error) {
    console.error("Create Stock Issue Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all stock issues
exports.getAllStockIssues = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      jobCardNo,
      regNo,
      issuedTo,
      fromDate,
      toDate,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    // Search
    if (search) {
      query.$or = [
        { issueNo: { $regex: search, $options: "i" } },
        { jobCardNo: { $regex: search, $options: "i" } },
        { regNo: { $regex: search, $options: "i" } },
        { issuedTo: { $regex: search, $options: "i" } },
        { "items.partNo": { $regex: search, $options: "i" } },
        { "items.partName": { $regex: search, $options: "i" } },
      ];
    }

    // Filters
    if (status) query.status = status;
    if (jobCardNo) query.jobCardNo = jobCardNo;
    if (regNo) query.regNo = regNo;
    if (issuedTo) query.issuedTo = { $regex: issuedTo, $options: "i" };

    // Date range
    if (fromDate || toDate) {
      query.issueDate = {};
      if (fromDate) query.issueDate.$gte = new Date(fromDate);
      if (toDate) query.issueDate.$lte = new Date(toDate);
    }

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const total = await StockIssue.countDocuments(query);
    const stockIssues = await StockIssue.find(query)
      .populate("createdBy", "name email")
      .populate("issuedBy", "name email")
      .populate("issuedToId", "name email")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: stockIssues,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get All Stock Issues Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single stock issue by ID
exports.getStockIssueById = async (req, res) => {
  try {
    const stockIssue = await StockIssue.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("issuedBy", "name email")
      .populate("issuedToId", "name email")
      .populate("jobCardId")
      .populate("items.stockId", "partNumber partName brand category quantityOnHand");

    if (!stockIssue) {
      return res.status(404).json({
        success: false,
        message: "Stock issue not found",
      });
    }

    res.json({
      success: true,
      data: stockIssue,
    });
  } catch (error) {
    console.error("Get Stock Issue By ID Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get by issue number
exports.getStockIssueByNo = async (req, res) => {
  try {
    const stockIssue = await StockIssue.findOne({
      issueNo: req.params.issueNo,
    })
      .populate("createdBy", "name email")
      .populate("issuedBy", "name email");

    if (!stockIssue) {
      return res.status(404).json({
        success: false,
        message: "Stock issue not found",
      });
    }

    res.json({
      success: true,
      data: stockIssue,
    });
  } catch (error) {
    console.error("Get Stock Issue By No Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update stock issue request
exports.updateStockIssue = async (req, res) => {
  try {
    const {
      issueDate,
      jobCardNo,
      regNo,
      vehicle,
      issuedTo,
      items,
      notes,
    } = req.body;

    const stockIssue = await StockIssue.findById(req.params.id);

    if (!stockIssue) {
      return res.status(404).json({
        success: false,
        message: "Stock issue not found",
      });
    }

    // Only allow updates if not issued yet
    if (stockIssue.stockDeducted) {
      return res.status(400).json({
        success: false,
        message: "Cannot update after stock has been issued",
      });
    }

    if (issueDate !== undefined) stockIssue.issueDate = issueDate;
    if (jobCardNo !== undefined) stockIssue.jobCardNo = jobCardNo;
    if (regNo !== undefined) stockIssue.regNo = regNo;
    if (vehicle !== undefined) stockIssue.vehicle = vehicle;
    if (issuedTo !== undefined) stockIssue.issuedTo = issuedTo;
    if (items !== undefined) stockIssue.items = items;
    if (notes !== undefined) stockIssue.notes = notes;

    await stockIssue.save();

    res.json({
      success: true,
      message: "Stock issue updated successfully",
      data: stockIssue,
    });
  } catch (error) {
    console.error("Update Stock Issue Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Issue parts (deduct from stock)
exports.issueParts = async (req, res) => {
  try {
    const { items } = req.body;
    // items: [{ partNo, issuedQty }]

    const stockIssue = await StockIssue.findById(req.params.id);

    if (!stockIssue) {
      return res.status(404).json({
        success: false,
        message: "Stock issue not found",
      });
    }

    if (stockIssue.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot issue parts for cancelled request",
      });
    }

    // Process each item
    for (const issueItem of items) {
      const itemIndex = stockIssue.items.findIndex(
        (item) => item.partNo === issueItem.partNo
      );

      if (itemIndex === -1) {
        return res.status(400).json({
          success: false,
          message: `Part ${issueItem.partNo} not found in issue request`,
        });
      }

      const item = stockIssue.items[itemIndex];
      const qtyToIssue = issueItem.issuedQty;

      // Check if qty is valid
      const maxAllowed = item.requestedQty - item.issuedQty;
      if (qtyToIssue > maxAllowed) {
        return res.status(400).json({
          success: false,
          message: `Cannot issue ${qtyToIssue} of ${issueItem.partNo}. Maximum allowed: ${maxAllowed}`,
        });
      }

      // Check stock availability
      let stock = null;
      if (item.stockId) {
        stock = await Stock.findById(item.stockId);
      } else {
        stock = await Stock.findOne({ partNumber: item.partNo });
      }

      if (!stock) {
        return res.status(400).json({
          success: false,
          message: `Stock not found for part ${issueItem.partNo}`,
        });
      }

      if (stock.quantityOnHand < qtyToIssue) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${issueItem.partNo}. Available: ${stock.quantityOnHand}, Requested: ${qtyToIssue}`,
        });
      }

      // Deduct from stock
      stock.quantityOnHand -= qtyToIssue;
      stock.lastMovementDate = new Date();
      await stock.save();

      // Update issue item
      item.issuedQty += qtyToIssue;
      item.issuedAt = new Date();
      item.stockId = stock._id;

      // Update prices from current stock
      item.avgPurchasePrice = stock.purchasePrice;
      item.avgSellingPrice = stock.sellingPrice;
    }

    stockIssue.stockDeducted = true;
    stockIssue.issuedBy = req.user?.userId;

    await stockIssue.save();

    res.json({
      success: true,
      message: "Parts issued successfully",
      data: stockIssue,
    });
  } catch (error) {
    console.error("Issue Parts Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Issue all pending parts
exports.issueAllParts = async (req, res) => {
  try {
    const stockIssue = await StockIssue.findById(req.params.id);

    if (!stockIssue) {
      return res.status(404).json({
        success: false,
        message: "Stock issue not found",
      });
    }

    if (stockIssue.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot issue parts for cancelled request",
      });
    }

    const errors = [];

    // Process each item
    for (const item of stockIssue.items) {
      const pendingQty = item.requestedQty - item.issuedQty;
      if (pendingQty <= 0) continue;

      // Find stock
      let stock = null;
      if (item.stockId) {
        stock = await Stock.findById(item.stockId);
      } else {
        stock = await Stock.findOne({ partNumber: item.partNo });
      }

      if (!stock) {
        errors.push(`Stock not found for ${item.partNo}`);
        continue;
      }

      // Issue available quantity
      const qtyToIssue = Math.min(pendingQty, stock.quantityOnHand);
      if (qtyToIssue <= 0) {
        errors.push(`No stock available for ${item.partNo}`);
        continue;
      }

      // Deduct from stock
      stock.quantityOnHand -= qtyToIssue;
      stock.lastMovementDate = new Date();
      await stock.save();

      // Update issue item
      item.issuedQty += qtyToIssue;
      item.issuedAt = new Date();
      item.stockId = stock._id;
      item.avgPurchasePrice = stock.purchasePrice;
      item.avgSellingPrice = stock.sellingPrice;
    }

    stockIssue.stockDeducted = true;
    stockIssue.issuedBy = req.user?.userId;

    await stockIssue.save();

    res.json({
      success: true,
      message: errors.length > 0 ? "Partially issued with some errors" : "All parts issued successfully",
      errors: errors.length > 0 ? errors : undefined,
      data: stockIssue,
    });
  } catch (error) {
    console.error("Issue All Parts Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Return parts (add back to stock)
exports.returnParts = async (req, res) => {
  try {
    const { items } = req.body;
    // items: [{ partNo, returnQty, remarks }]

    const stockIssue = await StockIssue.findById(req.params.id);

    if (!stockIssue) {
      return res.status(404).json({
        success: false,
        message: "Stock issue not found",
      });
    }

    // Process each return item
    for (const returnItem of items) {
      const itemIndex = stockIssue.items.findIndex(
        (item) => item.partNo === returnItem.partNo
      );

      if (itemIndex === -1) {
        return res.status(400).json({
          success: false,
          message: `Part ${returnItem.partNo} not found in issue`,
        });
      }

      const item = stockIssue.items[itemIndex];
      const qtyToReturn = returnItem.returnQty;

      // Check if return qty is valid
      const maxReturn = item.issuedQty - item.returnQty;
      if (qtyToReturn > maxReturn) {
        return res.status(400).json({
          success: false,
          message: `Cannot return ${qtyToReturn} of ${returnItem.partNo}. Maximum returnable: ${maxReturn}`,
        });
      }

      // Add back to stock
      if (item.stockId) {
        await Stock.findByIdAndUpdate(item.stockId, {
          $inc: { quantityOnHand: qtyToReturn },
          lastMovementDate: new Date(),
        });
      } else {
        const stock = await Stock.findOne({ partNumber: item.partNo });
        if (stock) {
          stock.quantityOnHand += qtyToReturn;
          stock.lastMovementDate = new Date();
          await stock.save();
        }
      }

      // Update return qty
      item.returnQty += qtyToReturn;
      item.returnedAt = new Date();
      if (returnItem.remarks) {
        item.remarks = item.remarks
          ? `${item.remarks}; Return: ${returnItem.remarks}`
          : `Return: ${returnItem.remarks}`;
      }
    }

    await stockIssue.save();

    res.json({
      success: true,
      message: "Parts returned successfully",
      data: stockIssue,
    });
  } catch (error) {
    console.error("Return Parts Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Cancel stock issue
exports.cancelStockIssue = async (req, res) => {
  try {
    const { reason } = req.body;

    const stockIssue = await StockIssue.findById(req.params.id);

    if (!stockIssue) {
      return res.status(404).json({
        success: false,
        message: "Stock issue not found",
      });
    }

    // If parts were issued, return them to stock first
    if (stockIssue.stockDeducted) {
      for (const item of stockIssue.items) {
        const netIssued = item.issuedQty - item.returnQty;
        if (netIssued > 0 && item.stockId) {
          await Stock.findByIdAndUpdate(item.stockId, {
            $inc: { quantityOnHand: netIssued },
            lastMovementDate: new Date(),
          });
        }
      }
    }

    stockIssue.status = "Cancelled";
    stockIssue.notes = stockIssue.notes
      ? `${stockIssue.notes}\nCancelled: ${reason}`
      : `Cancelled: ${reason}`;

    await stockIssue.save();

    res.json({
      success: true,
      message: "Stock issue cancelled and stock restored",
      data: stockIssue,
    });
  } catch (error) {
    console.error("Cancel Stock Issue Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete stock issue (draft only)
exports.deleteStockIssue = async (req, res) => {
  try {
    const stockIssue = await StockIssue.findById(req.params.id);

    if (!stockIssue) {
      return res.status(404).json({
        success: false,
        message: "Stock issue not found",
      });
    }

    if (stockIssue.stockDeducted) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete after stock has been issued. Cancel instead.",
      });
    }

    await StockIssue.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Stock issue deleted successfully",
    });
  } catch (error) {
    console.error("Delete Stock Issue Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get stock issues by job card
exports.getIssuesByJobCard = async (req, res) => {
  try {
    const { jobCardNo } = req.params;

    const issues = await StockIssue.find({ jobCardNo })
      .populate("createdBy", "name email")
      .populate("issuedBy", "name email")
      .sort({ issueDate: -1 });

    res.json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error) {
    console.error("Get Issues By Job Card Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get stock issues by vehicle reg no
exports.getIssuesByRegNo = async (req, res) => {
  try {
    const { regNo } = req.params;

    const issues = await StockIssue.find({
      regNo: { $regex: regNo, $options: "i" },
    })
      .populate("createdBy", "name email")
      .sort({ issueDate: -1 });

    res.json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error) {
    console.error("Get Issues By Reg No Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get statistics
exports.getStockIssueStats = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const dateFilter = {};
    if (fromDate || toDate) {
      dateFilter.issueDate = {};
      if (fromDate) dateFilter.issueDate.$gte = new Date(fromDate);
      if (toDate) dateFilter.issueDate.$lte = new Date(toDate);
    }

    const totalIssues = await StockIssue.countDocuments(dateFilter);

    const statusCounts = await StockIssue.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalValues = await StockIssue.aggregate([
      { $match: { ...dateFilter, status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: null,
          totalPurchaseValue: { $sum: "$totalPurchaseValue" },
          totalSellingValue: { $sum: "$totalSellingValue" },
          totalMarginValue: { $sum: "$totalMarginValue" },
          totalIssuedQty: { $sum: "$totalIssuedQty" },
          totalReturnQty: { $sum: "$totalReturnQty" },
        },
      },
    ]);

    const topParts = await StockIssue.aggregate([
      { $match: { ...dateFilter, status: { $ne: "Cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.partNo",
          partName: { $first: "$items.partName" },
          totalIssued: { $sum: "$items.issuedQty" },
          totalReturned: { $sum: "$items.returnQty" },
          totalValue: {
            $sum: { $multiply: ["$items.issuedQty", "$items.avgSellingPrice"] },
          },
        },
      },
      { $sort: { totalIssued: -1 } },
      { $limit: 10 },
    ]);

    const dailyIssues = await StockIssue.aggregate([
      { $match: { ...dateFilter, status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$issueDate" },
          },
          count: { $sum: 1 },
          totalValue: { $sum: "$totalSellingValue" },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ]);

    res.json({
      success: true,
      data: {
        totalIssues,
        statusCounts,
        totalPurchaseValue: totalValues[0]?.totalPurchaseValue || 0,
        totalSellingValue: totalValues[0]?.totalSellingValue || 0,
        totalMarginValue: totalValues[0]?.totalMarginValue || 0,
        totalIssuedQty: totalValues[0]?.totalIssuedQty || 0,
        totalReturnQty: totalValues[0]?.totalReturnQty || 0,
        topParts,
        dailyIssues,
      },
    });
  } catch (error) {
    console.error("Get Stock Issue Stats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get pending issues
exports.getPendingIssues = async (req, res) => {
  try {
    const pendingIssues = await StockIssue.find({
      status: { $in: ["Pending", "Partially Issued"] },
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pendingIssues.length,
      data: pendingIssues,
    });
  } catch (error) {
    console.error("Get Pending Issues Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


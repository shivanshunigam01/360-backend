const PurchaseReturn = require("../models/PurchaseReturn");
const PurchaseOrder = require("../models/PurchaseOrder");
const StockInward = require("../models/StockInward");
const Stock = require("../models/Stock");

// Create new purchase return
exports.createPurchaseReturn = async (req, res) => {
  try {
    const {
      orderNo,
      purchaseOrderId,
      inwardNo,
      stockInwardId,
      orderDate,
      inwardDate,
      regNo,
      jobCardNo,
      jobCardId,
      vendorName,
      vendorContact,
      items,
      returnedDate,
      shipment,
      notes,
    } = req.body;

    // Generate return number
    const returnNo = await PurchaseReturn.generateReturnNo();

    const purchaseReturn = new PurchaseReturn({
      returnNo,
      orderNo,
      purchaseOrderId,
      inwardNo,
      stockInwardId,
      orderDate,
      inwardDate,
      regNo,
      jobCardNo,
      jobCardId,
      vendorName,
      vendorContact,
      items,
      returnedDate: returnedDate || new Date(),
      shipment,
      notes,
      createdBy: req.user?.userId,
      status: "Draft",
    });

    await purchaseReturn.save();

    res.status(201).json({
      success: true,
      message: "Purchase return created successfully",
      data: purchaseReturn,
    });
  } catch (error) {
    console.error("Create Purchase Return Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create return from purchase order
exports.createFromPurchaseOrder = async (req, res) => {
  try {
    const { purchaseOrderId } = req.params;
    const { items, returnedDate, notes } = req.body;

    const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
    }

    // Generate return number
    const returnNo = await PurchaseReturn.generateReturnNo();

    const purchaseReturn = new PurchaseReturn({
      returnNo,
      orderNo: purchaseOrder.orderNo,
      purchaseOrderId: purchaseOrder._id,
      orderDate: purchaseOrder.orderDate,
      regNo: purchaseOrder.regNo,
      jobCardNo: purchaseOrder.jobCardNo,
      jobCardId: purchaseOrder.jobCardId,
      vendorName: purchaseOrder.vendorName,
      vendorContact: purchaseOrder.vendorContact,
      items,
      returnedDate: returnedDate || new Date(),
      notes,
      createdBy: req.user?.userId,
      status: "Draft",
    });

    await purchaseReturn.save();

    res.status(201).json({
      success: true,
      message: "Purchase return created from order",
      data: purchaseReturn,
    });
  } catch (error) {
    console.error("Create From PO Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create return from stock inward
exports.createFromStockInward = async (req, res) => {
  try {
    const { stockInwardId } = req.params;
    const { items, returnedDate, notes } = req.body;

    const stockInward = await StockInward.findById(stockInwardId);

    if (!stockInward) {
      return res.status(404).json({
        success: false,
        message: "Stock inward not found",
      });
    }

    // Generate return number
    const returnNo = await PurchaseReturn.generateReturnNo();

    const purchaseReturn = new PurchaseReturn({
      returnNo,
      orderNo: stockInward.orderNo,
      purchaseOrderId: stockInward.purchaseOrderId,
      inwardNo: stockInward.inwardNo,
      stockInwardId: stockInward._id,
      orderDate: stockInward.orderDate,
      inwardDate: stockInward.inwardDate,
      regNo: stockInward.regNo,
      jobCardNo: stockInward.jobCardNo,
      jobCardId: stockInward.jobCardId,
      vendorName: stockInward.vendorName,
      items,
      returnedDate: returnedDate || new Date(),
      notes,
      createdBy: req.user?.userId,
      status: "Draft",
    });

    await purchaseReturn.save();

    res.status(201).json({
      success: true,
      message: "Purchase return created from inward",
      data: purchaseReturn,
    });
  } catch (error) {
    console.error("Create From Inward Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all purchase returns
exports.getAllPurchaseReturns = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      vendorName,
      fromDate,
      toDate,
      orderNo,
      inwardNo,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    // Search
    if (search) {
      query.$or = [
        { returnNo: { $regex: search, $options: "i" } },
        { orderNo: { $regex: search, $options: "i" } },
        { inwardNo: { $regex: search, $options: "i" } },
        { vendorName: { $regex: search, $options: "i" } },
        { jobCardNo: { $regex: search, $options: "i" } },
        { "items.partNo": { $regex: search, $options: "i" } },
        { "items.partName": { $regex: search, $options: "i" } },
      ];
    }

    // Filters
    if (status) query.status = status;
    if (vendorName) query.vendorName = { $regex: vendorName, $options: "i" };
    if (orderNo) query.orderNo = orderNo;
    if (inwardNo) query.inwardNo = inwardNo;

    // Date range
    if (fromDate || toDate) {
      query.returnedDate = {};
      if (fromDate) query.returnedDate.$gte = new Date(fromDate);
      if (toDate) query.returnedDate.$lte = new Date(toDate);
    }

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const total = await PurchaseReturn.countDocuments(query);
    const purchaseReturns = await PurchaseReturn.find(query)
      .populate("createdBy", "name email")
      .populate("approvedBy", "name email")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: purchaseReturns,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get All Purchase Returns Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single purchase return by ID
exports.getPurchaseReturnById = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("approvedBy", "name email")
      .populate("purchaseOrderId")
      .populate("stockInwardId")
      .populate("items.stockId", "partNumber partName brand category");

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: "Purchase return not found",
      });
    }

    res.json({
      success: true,
      data: purchaseReturn,
    });
  } catch (error) {
    console.error("Get Purchase Return By ID Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get by return number
exports.getPurchaseReturnByNo = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findOne({
      returnNo: req.params.returnNo,
    })
      .populate("createdBy", "name email")
      .populate("approvedBy", "name email");

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: "Purchase return not found",
      });
    }

    res.json({
      success: true,
      data: purchaseReturn,
    });
  } catch (error) {
    console.error("Get Purchase Return By No Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update purchase return
exports.updatePurchaseReturn = async (req, res) => {
  try {
    const {
      orderNo,
      inwardNo,
      orderDate,
      inwardDate,
      regNo,
      jobCardNo,
      vendorName,
      vendorContact,
      items,
      returnedDate,
      shipment,
      notes,
    } = req.body;

    const purchaseReturn = await PurchaseReturn.findById(req.params.id);

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: "Purchase return not found",
      });
    }

    // Only allow updates if not approved yet
    if (!["Draft", "Pending Approval"].includes(purchaseReturn.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot update after approval",
      });
    }

    if (orderNo !== undefined) purchaseReturn.orderNo = orderNo;
    if (inwardNo !== undefined) purchaseReturn.inwardNo = inwardNo;
    if (orderDate !== undefined) purchaseReturn.orderDate = orderDate;
    if (inwardDate !== undefined) purchaseReturn.inwardDate = inwardDate;
    if (regNo !== undefined) purchaseReturn.regNo = regNo;
    if (jobCardNo !== undefined) purchaseReturn.jobCardNo = jobCardNo;
    if (vendorName !== undefined) purchaseReturn.vendorName = vendorName;
    if (vendorContact !== undefined) purchaseReturn.vendorContact = vendorContact;
    if (items !== undefined) purchaseReturn.items = items;
    if (returnedDate !== undefined) purchaseReturn.returnedDate = returnedDate;
    if (shipment !== undefined) purchaseReturn.shipment = shipment;
    if (notes !== undefined) purchaseReturn.notes = notes;

    await purchaseReturn.save();

    res.json({
      success: true,
      message: "Purchase return updated successfully",
      data: purchaseReturn,
    });
  } catch (error) {
    console.error("Update Purchase Return Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Submit for approval
exports.submitForApproval = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findById(req.params.id);

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: "Purchase return not found",
      });
    }

    if (purchaseReturn.status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft returns can be submitted",
      });
    }

    if (!purchaseReturn.items || purchaseReturn.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot submit empty return",
      });
    }

    purchaseReturn.status = "Pending Approval";
    await purchaseReturn.save();

    res.json({
      success: true,
      message: "Submitted for approval",
      data: purchaseReturn,
    });
  } catch (error) {
    console.error("Submit For Approval Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Approve return and deduct from stock
exports.approveReturn = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findById(req.params.id);

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: "Purchase return not found",
      });
    }

    if (purchaseReturn.status !== "Pending Approval") {
      return res.status(400).json({
        success: false,
        message: "Only pending returns can be approved",
      });
    }

    // Deduct from stock
    for (const item of purchaseReturn.items) {
      if (item.stockId) {
        const stock = await Stock.findById(item.stockId);
        if (stock) {
          if (stock.quantityOnHand < item.returnedQty) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for ${item.partNo}. Available: ${stock.quantityOnHand}`,
            });
          }
          stock.quantityOnHand -= item.returnedQty;
          stock.lastMovementDate = new Date();
          await stock.save();
        }
      } else {
        const stock = await Stock.findOne({ partNumber: item.partNo });
        if (stock) {
          if (stock.quantityOnHand < item.returnedQty) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for ${item.partNo}. Available: ${stock.quantityOnHand}`,
            });
          }
          stock.quantityOnHand -= item.returnedQty;
          stock.lastMovementDate = new Date();
          await stock.save();
          item.stockId = stock._id;
        }
      }
    }

    purchaseReturn.status = "Approved";
    purchaseReturn.stockDeducted = true;
    purchaseReturn.approvedBy = req.user?.userId;
    purchaseReturn.approvedAt = new Date();

    await purchaseReturn.save();

    res.json({
      success: true,
      message: "Purchase return approved and stock deducted",
      data: purchaseReturn,
    });
  } catch (error) {
    console.error("Approve Return Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update shipment status
exports.updateShipment = async (req, res) => {
  try {
    const { shipment, status } = req.body;

    const purchaseReturn = await PurchaseReturn.findById(req.params.id);

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: "Purchase return not found",
      });
    }

    if (shipment) {
      purchaseReturn.shipment = {
        ...purchaseReturn.shipment,
        ...shipment,
      };
    }

    if (status) {
      purchaseReturn.status = status;
    }

    await purchaseReturn.save();

    res.json({
      success: true,
      message: "Shipment updated successfully",
      data: purchaseReturn,
    });
  } catch (error) {
    console.error("Update Shipment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Mark as shipped
exports.markAsShipped = async (req, res) => {
  try {
    const { trackingNo, courierName, shippedDate, expectedDeliveryDate, shippingCost, notes } = req.body;

    const purchaseReturn = await PurchaseReturn.findById(req.params.id);

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: "Purchase return not found",
      });
    }

    if (purchaseReturn.status !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved returns can be shipped",
      });
    }

    purchaseReturn.shipment = {
      ...purchaseReturn.shipment,
      trackingNo,
      courierName,
      shippedDate: shippedDate || new Date(),
      expectedDeliveryDate,
      shippingCost,
      notes,
    };
    purchaseReturn.status = "Shipped";

    await purchaseReturn.save();

    res.json({
      success: true,
      message: "Marked as shipped",
      data: purchaseReturn,
    });
  } catch (error) {
    console.error("Mark As Shipped Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Mark as delivered
exports.markAsDelivered = async (req, res) => {
  try {
    const { deliveredDate } = req.body;

    const purchaseReturn = await PurchaseReturn.findById(req.params.id);

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: "Purchase return not found",
      });
    }

    if (purchaseReturn.status !== "Shipped") {
      return res.status(400).json({
        success: false,
        message: "Only shipped returns can be marked as delivered",
      });
    }

    purchaseReturn.shipment.deliveredDate = deliveredDate || new Date();
    purchaseReturn.status = "Delivered";
    purchaseReturn.refundStatus = "Pending";

    await purchaseReturn.save();

    res.json({
      success: true,
      message: "Marked as delivered",
      data: purchaseReturn,
    });
  } catch (error) {
    console.error("Mark As Delivered Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update refund status
exports.updateRefund = async (req, res) => {
  try {
    const { refundAmount, refundStatus, refundDate, refundMethod, refundReference } = req.body;

    const purchaseReturn = await PurchaseReturn.findById(req.params.id);

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: "Purchase return not found",
      });
    }

    if (refundAmount !== undefined) purchaseReturn.refundAmount = refundAmount;
    if (refundStatus) purchaseReturn.refundStatus = refundStatus;
    if (refundDate) purchaseReturn.refundDate = refundDate;
    if (refundMethod) purchaseReturn.refundMethod = refundMethod;
    if (refundReference) purchaseReturn.refundReference = refundReference;

    // Auto-update status
    if (refundStatus === "Completed") {
      purchaseReturn.status = "Refund Received";
    } else if (refundStatus === "Partial") {
      purchaseReturn.status = "Refund Pending";
    }

    await purchaseReturn.save();

    res.json({
      success: true,
      message: "Refund updated successfully",
      data: purchaseReturn,
    });
  } catch (error) {
    console.error("Update Refund Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Close return
exports.closeReturn = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findById(req.params.id);

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: "Purchase return not found",
      });
    }

    purchaseReturn.status = "Closed";
    await purchaseReturn.save();

    res.json({
      success: true,
      message: "Purchase return closed",
      data: purchaseReturn,
    });
  } catch (error) {
    console.error("Close Return Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Cancel return
exports.cancelReturn = async (req, res) => {
  try {
    const { reason } = req.body;

    const purchaseReturn = await PurchaseReturn.findById(req.params.id);

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: "Purchase return not found",
      });
    }

    // If stock was deducted, add it back
    if (purchaseReturn.stockDeducted) {
      for (const item of purchaseReturn.items) {
        if (item.stockId) {
          await Stock.findByIdAndUpdate(item.stockId, {
            $inc: { quantityOnHand: item.returnedQty },
            lastMovementDate: new Date(),
          });
        }
      }
    }

    purchaseReturn.status = "Cancelled";
    purchaseReturn.notes = purchaseReturn.notes
      ? `${purchaseReturn.notes}\nCancelled: ${reason}`
      : `Cancelled: ${reason}`;

    await purchaseReturn.save();

    res.json({
      success: true,
      message: "Purchase return cancelled",
      data: purchaseReturn,
    });
  } catch (error) {
    console.error("Cancel Return Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete return (draft only)
exports.deletePurchaseReturn = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findById(req.params.id);

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: "Purchase return not found",
      });
    }

    if (purchaseReturn.status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft returns can be deleted",
      });
    }

    await PurchaseReturn.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Purchase return deleted successfully",
    });
  } catch (error) {
    console.error("Delete Purchase Return Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get returns by vendor
exports.getReturnsByVendor = async (req, res) => {
  try {
    const { vendorName } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const query = { vendorName: { $regex: vendorName, $options: "i" } };

    const total = await PurchaseReturn.countDocuments(query);
    const returns = await PurchaseReturn.find(query)
      .sort({ returnedDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: returns,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Returns By Vendor Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get statistics
exports.getPurchaseReturnStats = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const dateFilter = {};
    if (fromDate || toDate) {
      dateFilter.returnedDate = {};
      if (fromDate) dateFilter.returnedDate.$gte = new Date(fromDate);
      if (toDate) dateFilter.returnedDate.$lte = new Date(toDate);
    }

    const totalReturns = await PurchaseReturn.countDocuments(dateFilter);

    const statusCounts = await PurchaseReturn.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$totalReturnValue" },
        },
      },
    ]);

    const totalValues = await PurchaseReturn.aggregate([
      { $match: { ...dateFilter, status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: null,
          totalReturnValue: { $sum: "$totalReturnValue" },
          totalRefunded: { $sum: "$refundAmount" },
          totalReturnedQty: { $sum: "$totalReturnedQty" },
        },
      },
    ]);

    const reasonStats = await PurchaseReturn.aggregate([
      { $match: { ...dateFilter, status: { $ne: "Cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.reason",
          count: { $sum: 1 },
          totalQty: { $sum: "$items.returnedQty" },
          totalValue: { $sum: "$items.amount" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const vendorStats = await PurchaseReturn.aggregate([
      { $match: { ...dateFilter, status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: "$vendorName",
          returnCount: { $sum: 1 },
          totalValue: { $sum: "$totalReturnValue" },
        },
      },
      { $sort: { totalValue: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        totalReturns,
        statusCounts,
        totalReturnValue: totalValues[0]?.totalReturnValue || 0,
        totalRefunded: totalValues[0]?.totalRefunded || 0,
        pendingRefund:
          (totalValues[0]?.totalReturnValue || 0) - (totalValues[0]?.totalRefunded || 0),
        totalReturnedQty: totalValues[0]?.totalReturnedQty || 0,
        reasonStats,
        topVendors: vendorStats,
      },
    });
  } catch (error) {
    console.error("Get Purchase Return Stats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get pending approvals
exports.getPendingApprovals = async (req, res) => {
  try {
    const pendingReturns = await PurchaseReturn.find({
      status: "Pending Approval",
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pendingReturns.length,
      data: pendingReturns,
    });
  } catch (error) {
    console.error("Get Pending Approvals Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


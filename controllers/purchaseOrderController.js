const PurchaseOrder = require("../models/PurchaseOrder");
const Stock = require("../models/Stock");

// Create new purchase order
exports.createPurchaseOrder = async (req, res) => {
  try {
    const {
      orderDate,
      regNo,
      jobCardNo,
      jobCardId,
      vendorName,
      vendorContact,
      orderedParts,
      notes,
    } = req.body;

    // Generate order number
    const orderNo = await PurchaseOrder.generateOrderNo();

    const purchaseOrder = new PurchaseOrder({
      orderNo,
      orderDate: orderDate || new Date(),
      regNo,
      jobCardNo,
      jobCardId,
      vendorName,
      vendorContact,
      orderedParts,
      notes,
      createdBy: req.user?.userId,
      status: "Pending",
    });

    await purchaseOrder.save();

    res.status(201).json({
      success: true,
      message: "Purchase order created successfully",
      data: purchaseOrder,
    });
  } catch (error) {
    console.error("Create Purchase Order Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all purchase orders with filters
exports.getAllPurchaseOrders = async (req, res) => {
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
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    // Search by order number, vendor name, or job card
    if (search) {
      query.$or = [
        { orderNo: { $regex: search, $options: "i" } },
        { vendorName: { $regex: search, $options: "i" } },
        { jobCardNo: { $regex: search, $options: "i" } },
        { regNo: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by vendor
    if (vendorName) {
      query.vendorName = { $regex: vendorName, $options: "i" };
    }

    // Filter by job card
    if (jobCardNo) {
      query.jobCardNo = jobCardNo;
    }

    // Filter by date range
    if (fromDate || toDate) {
      query.orderDate = {};
      if (fromDate) query.orderDate.$gte = new Date(fromDate);
      if (toDate) query.orderDate.$lte = new Date(toDate);
    }

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const total = await PurchaseOrder.countDocuments(query);
    const purchaseOrders = await PurchaseOrder.find(query)
      .populate("createdBy", "name email")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: purchaseOrders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get All Purchase Orders Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single purchase order by ID
exports.getPurchaseOrderById = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("orderedParts.stockId", "partNumber partName brand")
      .populate("inwardedParts.stockId", "partNumber partName brand")
      .populate("rejectedParts.stockId", "partNumber partName brand");

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
    }

    res.json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error) {
    console.error("Get Purchase Order By ID Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get purchase order by order number
exports.getPurchaseOrderByOrderNo = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findOne({
      orderNo: req.params.orderNo,
    })
      .populate("createdBy", "name email")
      .populate("orderedParts.stockId", "partNumber partName brand");

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
    }

    res.json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error) {
    console.error("Get Purchase Order By Order No Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update purchase order
exports.updatePurchaseOrder = async (req, res) => {
  try {
    const {
      orderDate,
      regNo,
      jobCardNo,
      jobCardId,
      vendorName,
      vendorContact,
      orderedParts,
      notes,
    } = req.body;

    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
    }

    // Only allow updates if status is Draft or Pending
    if (!["Draft", "Pending"].includes(purchaseOrder.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot update purchase order in current status",
      });
    }

    if (orderDate !== undefined) purchaseOrder.orderDate = orderDate;
    if (regNo !== undefined) purchaseOrder.regNo = regNo;
    if (jobCardNo !== undefined) purchaseOrder.jobCardNo = jobCardNo;
    if (jobCardId !== undefined) purchaseOrder.jobCardId = jobCardId;
    if (vendorName !== undefined) purchaseOrder.vendorName = vendorName;
    if (vendorContact !== undefined) purchaseOrder.vendorContact = vendorContact;
    if (orderedParts !== undefined) purchaseOrder.orderedParts = orderedParts;
    if (notes !== undefined) purchaseOrder.notes = notes;

    await purchaseOrder.save();

    res.json({
      success: true,
      message: "Purchase order updated successfully",
      data: purchaseOrder,
    });
  } catch (error) {
    console.error("Update Purchase Order Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Inward parts (receive parts from vendor)
exports.inwardParts = async (req, res) => {
  try {
    const { parts, updateStock = true } = req.body;
    // parts: [{ partNumber, quantity, remarks }]

    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
    }

    if (purchaseOrder.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot inward parts for cancelled order",
      });
    }

    for (const part of parts) {
      // Find the ordered part
      const orderedPart = purchaseOrder.orderedParts.find(
        (p) => p.partNumber === part.partNumber
      );

      if (!orderedPart) {
        return res.status(400).json({
          success: false,
          message: `Part ${part.partNumber} not found in order`,
        });
      }

      // Check if quantity is valid
      const alreadyInwarded = purchaseOrder.inwardedParts
        .filter((p) => p.partNumber === part.partNumber)
        .reduce((sum, p) => sum + p.quantity, 0);

      const alreadyRejected = purchaseOrder.rejectedParts
        .filter((p) => p.partNumber === part.partNumber)
        .reduce((sum, p) => sum + p.quantity, 0);

      const maxAllowed = orderedPart.quantity - alreadyInwarded - alreadyRejected;

      if (part.quantity > maxAllowed) {
        return res.status(400).json({
          success: false,
          message: `Cannot inward ${part.quantity} of ${part.partNumber}. Maximum allowed: ${maxAllowed}`,
        });
      }

      // Add to inwarded parts
      purchaseOrder.inwardedParts.push({
        stockId: orderedPart.stockId,
        partNumber: part.partNumber,
        partName: orderedPart.partName,
        quantity: part.quantity,
        inwardDate: new Date(),
        remarks: part.remarks,
      });

      // Update stock if requested
      if (updateStock && orderedPart.stockId) {
        await Stock.findByIdAndUpdate(orderedPart.stockId, {
          $inc: { quantityOnHand: part.quantity },
          lastMovementDate: new Date(),
        });
      } else if (updateStock) {
        // Try to find stock by part number
        const stock = await Stock.findOne({ partNumber: part.partNumber });
        if (stock) {
          stock.quantityOnHand += part.quantity;
          stock.lastMovementDate = new Date();
          await stock.save();
        }
      }
    }

    await purchaseOrder.save();

    res.json({
      success: true,
      message: "Parts inwarded successfully",
      data: purchaseOrder,
    });
  } catch (error) {
    console.error("Inward Parts Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Reject parts
exports.rejectParts = async (req, res) => {
  try {
    const { parts } = req.body;
    // parts: [{ partNumber, quantity, reason }]

    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
    }

    if (purchaseOrder.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot reject parts for cancelled order",
      });
    }

    for (const part of parts) {
      const orderedPart = purchaseOrder.orderedParts.find(
        (p) => p.partNumber === part.partNumber
      );

      if (!orderedPart) {
        return res.status(400).json({
          success: false,
          message: `Part ${part.partNumber} not found in order`,
        });
      }

      // Check if quantity is valid
      const alreadyInwarded = purchaseOrder.inwardedParts
        .filter((p) => p.partNumber === part.partNumber)
        .reduce((sum, p) => sum + p.quantity, 0);

      const alreadyRejected = purchaseOrder.rejectedParts
        .filter((p) => p.partNumber === part.partNumber)
        .reduce((sum, p) => sum + p.quantity, 0);

      const maxAllowed = orderedPart.quantity - alreadyInwarded - alreadyRejected;

      if (part.quantity > maxAllowed) {
        return res.status(400).json({
          success: false,
          message: `Cannot reject ${part.quantity} of ${part.partNumber}. Maximum allowed: ${maxAllowed}`,
        });
      }

      // Add to rejected parts
      purchaseOrder.rejectedParts.push({
        stockId: orderedPart.stockId,
        partNumber: part.partNumber,
        partName: orderedPart.partName,
        quantity: part.quantity,
        rejectionDate: new Date(),
        reason: part.reason,
      });
    }

    await purchaseOrder.save();

    res.json({
      success: true,
      message: "Parts rejected successfully",
      data: purchaseOrder,
    });
  } catch (error) {
    console.error("Reject Parts Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Cancel purchase order
exports.cancelPurchaseOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
    }

    if (purchaseOrder.status === "Received" || purchaseOrder.status === "Closed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel completed purchase order",
      });
    }

    purchaseOrder.status = "Cancelled";
    purchaseOrder.cancelDate = new Date();
    purchaseOrder.cancelReason = reason;

    await purchaseOrder.save();

    res.json({
      success: true,
      message: "Purchase order cancelled successfully",
      data: purchaseOrder,
    });
  } catch (error) {
    console.error("Cancel Purchase Order Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Close purchase order
exports.closePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
    }

    purchaseOrder.status = "Closed";
    await purchaseOrder.save();

    res.json({
      success: true,
      message: "Purchase order closed successfully",
      data: purchaseOrder,
    });
  } catch (error) {
    console.error("Close Purchase Order Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update payment status
exports.updatePayment = async (req, res) => {
  try {
    const { amount, paymentStatus } = req.body;

    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
    }

    if (amount !== undefined) {
      purchaseOrder.paidAmount += amount;
    }

    if (paymentStatus) {
      purchaseOrder.paymentStatus = paymentStatus;
    } else {
      // Auto-determine payment status
      if (purchaseOrder.paidAmount >= purchaseOrder.grandTotal) {
        purchaseOrder.paymentStatus = "Paid";
      } else if (purchaseOrder.paidAmount > 0) {
        purchaseOrder.paymentStatus = "Partial";
      }
    }

    await purchaseOrder.save();

    res.json({
      success: true,
      message: "Payment updated successfully",
      data: purchaseOrder,
    });
  } catch (error) {
    console.error("Update Payment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete purchase order
exports.deletePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
    }

    // Only allow deletion of draft orders
    if (purchaseOrder.status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft orders can be deleted",
      });
    }

    await PurchaseOrder.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Purchase order deleted successfully",
    });
  } catch (error) {
    console.error("Delete Purchase Order Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get purchase order statistics
exports.getPurchaseOrderStats = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const dateFilter = {};
    if (fromDate || toDate) {
      dateFilter.orderDate = {};
      if (fromDate) dateFilter.orderDate.$gte = new Date(fromDate);
      if (toDate) dateFilter.orderDate.$lte = new Date(toDate);
    }

    const totalOrders = await PurchaseOrder.countDocuments(dateFilter);

    const statusCounts = await PurchaseOrder.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$grandTotal" },
        },
      },
    ]);

    const totalValue = await PurchaseOrder.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalOrderValue: { $sum: "$grandTotal" },
          totalPaid: { $sum: "$paidAmount" },
        },
      },
    ]);

    const vendorStats = await PurchaseOrder.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$vendorName",
          orderCount: { $sum: 1 },
          totalValue: { $sum: "$grandTotal" },
        },
      },
      { $sort: { totalValue: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        statusCounts,
        totalOrderValue: totalValue[0]?.totalOrderValue || 0,
        totalPaid: totalValue[0]?.totalPaid || 0,
        pendingPayment:
          (totalValue[0]?.totalOrderValue || 0) - (totalValue[0]?.totalPaid || 0),
        topVendors: vendorStats,
      },
    });
  } catch (error) {
    console.error("Get Purchase Order Stats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all unique vendors
exports.getVendors = async (req, res) => {
  try {
    const vendors = await PurchaseOrder.aggregate([
      {
        $group: {
          _id: "$vendorName",
          lastOrder: { $max: "$orderDate" },
          totalOrders: { $sum: 1 },
          contact: { $first: "$vendorContact" },
        },
      },
      { $sort: { lastOrder: -1 } },
    ]);

    res.json({
      success: true,
      data: vendors,
    });
  } catch (error) {
    console.error("Get Vendors Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Generate vendor bill / invoice
exports.generateBill = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate("createdBy", "name email");

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
    }

    // Generate bill data
    const bill = {
      billNo: `BILL-${purchaseOrder.orderNo}`,
      billDate: new Date(),
      purchaseOrder: {
        orderNo: purchaseOrder.orderNo,
        orderDate: purchaseOrder.orderDate,
      },
      vendor: {
        name: purchaseOrder.vendorName,
        ...purchaseOrder.vendorContact,
      },
      regNo: purchaseOrder.regNo,
      jobCardNo: purchaseOrder.jobCardNo,
      items: purchaseOrder.orderedParts.map((part) => ({
        partNumber: part.partNumber,
        partName: part.partName,
        quantity: part.quantity,
        unitPrice: part.unitPrice,
        totalPrice: part.totalPrice,
        taxPercent: part.taxPercent,
        taxAmount: part.taxAmount,
      })),
      subtotal: purchaseOrder.orderValue,
      taxTotal: purchaseOrder.taxTotal,
      grandTotal: purchaseOrder.grandTotal,
      paidAmount: purchaseOrder.paidAmount,
      balanceDue: purchaseOrder.grandTotal - purchaseOrder.paidAmount,
      paymentStatus: purchaseOrder.paymentStatus,
    };

    res.json({
      success: true,
      data: bill,
    });
  } catch (error) {
    console.error("Generate Bill Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


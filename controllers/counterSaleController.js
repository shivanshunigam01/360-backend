const CounterSale = require("../models/CounterSale");
const Stock = require("../models/Stock");

// Create new counter sale
exports.createCounterSale = async (req, res) => {
  try {
    const {
      saleDate,
      regNo,
      customerName,
      mobileNo,
      email,
      address,
      vehicle,
      items,
      billDiscount,
      billDiscountType,
      notes,
    } = req.body;

    // Generate sale number
    const saleNo = await CounterSale.generateSaleNo();

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
          unitPrice: item.unitPrice || stock?.sellingPrice || 0,
          discount: item.discount || 0,
          discountType: item.discountType || "Flat",
          taxPercent: item.taxPercent || stock?.taxPercent || 0,
        };
      })
    );

    const counterSale = new CounterSale({
      saleNo,
      saleDate: saleDate || new Date(),
      regNo,
      customerName,
      mobileNo,
      email,
      address,
      vehicle,
      items: enrichedItems,
      billDiscount: billDiscount || 0,
      billDiscountType: billDiscountType || "Flat",
      notes,
      createdBy: req.user?.userId,
      status: "Draft",
    });

    await counterSale.save();

    res.status(201).json({
      success: true,
      message: "Counter sale created successfully",
      data: counterSale,
    });
  } catch (error) {
    console.error("Create Counter Sale Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Quick sale (create and complete in one step)
exports.quickSale = async (req, res) => {
  try {
    const {
      regNo,
      customerName,
      mobileNo,
      items,
      payments,
      billDiscount,
      billDiscountType,
      notes,
    } = req.body;

    // Generate sale number
    const saleNo = await CounterSale.generateSaleNo();

    // Enrich items and check stock
    const enrichedItems = [];
    for (const item of items) {
      let stock = null;

      if (item.stockId) {
        stock = await Stock.findById(item.stockId);
      } else if (item.partNo) {
        stock = await Stock.findOne({ partNumber: item.partNo });
      }

      if (!stock) {
        return res.status(400).json({
          success: false,
          message: `Stock not found for ${item.partNo || item.partName}`,
        });
      }

      if (stock.quantityOnHand < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${stock.partNumber}. Available: ${stock.quantityOnHand}`,
        });
      }

      enrichedItems.push({
        stockId: stock._id,
        partNo: stock.partNumber,
        partName: stock.partName,
        brand: stock.brand,
        quantity: item.quantity,
        unitPrice: item.unitPrice || stock.sellingPrice,
        discount: item.discount || 0,
        discountType: item.discountType || "Flat",
        taxPercent: item.taxPercent || stock.taxPercent || 0,
      });
    }

    const counterSale = new CounterSale({
      saleNo,
      saleDate: new Date(),
      regNo,
      customerName: customerName || "Walk-in Customer",
      mobileNo,
      items: enrichedItems,
      payments: payments || [],
      billDiscount: billDiscount || 0,
      billDiscountType: billDiscountType || "Flat",
      notes,
      createdBy: req.user?.userId,
      status: "Completed",
    });

    // Deduct stock
    for (const item of enrichedItems) {
      await Stock.findByIdAndUpdate(item.stockId, {
        $inc: { quantityOnHand: -item.quantity },
        lastMovementDate: new Date(),
      });
    }

    counterSale.stockDeducted = true;
    await counterSale.save();

    res.status(201).json({
      success: true,
      message: "Sale completed successfully",
      data: counterSale,
    });
  } catch (error) {
    console.error("Quick Sale Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all counter sales
exports.getAllCounterSales = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      paymentStatus,
      fromDate,
      toDate,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    // Search
    if (search) {
      query.$or = [
        { saleNo: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { mobileNo: { $regex: search, $options: "i" } },
        { regNo: { $regex: search, $options: "i" } },
        { "items.partNo": { $regex: search, $options: "i" } },
        { "items.partName": { $regex: search, $options: "i" } },
      ];
    }

    // Filters
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    // Date range
    if (fromDate || toDate) {
      query.saleDate = {};
      if (fromDate) query.saleDate.$gte = new Date(fromDate);
      if (toDate) query.saleDate.$lte = new Date(toDate);
    }

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const total = await CounterSale.countDocuments(query);
    const counterSales = await CounterSale.find(query)
      .populate("createdBy", "name email")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: counterSales,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get All Counter Sales Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single counter sale by ID
exports.getCounterSaleById = async (req, res) => {
  try {
    const counterSale = await CounterSale.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("items.stockId", "partNumber partName brand quantityOnHand");

    if (!counterSale) {
      return res.status(404).json({
        success: false,
        message: "Counter sale not found",
      });
    }

    res.json({
      success: true,
      data: counterSale,
    });
  } catch (error) {
    console.error("Get Counter Sale By ID Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get by sale number
exports.getCounterSaleBySaleNo = async (req, res) => {
  try {
    const counterSale = await CounterSale.findOne({
      saleNo: req.params.saleNo,
    }).populate("createdBy", "name email");

    if (!counterSale) {
      return res.status(404).json({
        success: false,
        message: "Counter sale not found",
      });
    }

    res.json({
      success: true,
      data: counterSale,
    });
  } catch (error) {
    console.error("Get Counter Sale By Sale No Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update counter sale (draft only)
exports.updateCounterSale = async (req, res) => {
  try {
    const {
      regNo,
      customerName,
      mobileNo,
      email,
      address,
      vehicle,
      items,
      billDiscount,
      billDiscountType,
      notes,
    } = req.body;

    const counterSale = await CounterSale.findById(req.params.id);

    if (!counterSale) {
      return res.status(404).json({
        success: false,
        message: "Counter sale not found",
      });
    }

    if (counterSale.status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft sales can be updated",
      });
    }

    if (regNo !== undefined) counterSale.regNo = regNo;
    if (customerName !== undefined) counterSale.customerName = customerName;
    if (mobileNo !== undefined) counterSale.mobileNo = mobileNo;
    if (email !== undefined) counterSale.email = email;
    if (address !== undefined) counterSale.address = address;
    if (vehicle !== undefined) counterSale.vehicle = vehicle;
    if (items !== undefined) counterSale.items = items;
    if (billDiscount !== undefined) counterSale.billDiscount = billDiscount;
    if (billDiscountType !== undefined) counterSale.billDiscountType = billDiscountType;
    if (notes !== undefined) counterSale.notes = notes;

    await counterSale.save();

    res.json({
      success: true,
      message: "Counter sale updated successfully",
      data: counterSale,
    });
  } catch (error) {
    console.error("Update Counter Sale Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add items to sale
exports.addItems = async (req, res) => {
  try {
    const { items } = req.body;

    const counterSale = await CounterSale.findById(req.params.id);

    if (!counterSale) {
      return res.status(404).json({
        success: false,
        message: "Counter sale not found",
      });
    }

    if (counterSale.stockDeducted) {
      return res.status(400).json({
        success: false,
        message: "Cannot add items after stock is deducted",
      });
    }

    // Enrich and add items
    for (const item of items) {
      let stock = null;

      if (item.stockId) {
        stock = await Stock.findById(item.stockId);
      } else if (item.partNo) {
        stock = await Stock.findOne({ partNumber: item.partNo });
      }

      counterSale.items.push({
        stockId: stock?._id || item.stockId,
        partNo: item.partNo || stock?.partNumber,
        partName: item.partName || stock?.partName,
        brand: item.brand || stock?.brand,
        quantity: item.quantity,
        unitPrice: item.unitPrice || stock?.sellingPrice || 0,
        discount: item.discount || 0,
        discountType: item.discountType || "Flat",
        taxPercent: item.taxPercent || stock?.taxPercent || 0,
      });
    }

    await counterSale.save();

    res.json({
      success: true,
      message: "Items added successfully",
      data: counterSale,
    });
  } catch (error) {
    console.error("Add Items Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove item from sale
exports.removeItem = async (req, res) => {
  try {
    const { itemIndex } = req.params;

    const counterSale = await CounterSale.findById(req.params.id);

    if (!counterSale) {
      return res.status(404).json({
        success: false,
        message: "Counter sale not found",
      });
    }

    if (counterSale.stockDeducted) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove items after stock is deducted",
      });
    }

    if (itemIndex < 0 || itemIndex >= counterSale.items.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid item index",
      });
    }

    counterSale.items.splice(itemIndex, 1);
    await counterSale.save();

    res.json({
      success: true,
      message: "Item removed successfully",
      data: counterSale,
    });
  } catch (error) {
    console.error("Remove Item Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Complete sale (deduct stock)
exports.completeSale = async (req, res) => {
  try {
    const counterSale = await CounterSale.findById(req.params.id);

    if (!counterSale) {
      return res.status(404).json({
        success: false,
        message: "Counter sale not found",
      });
    }

    if (counterSale.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Sale already completed",
      });
    }

    if (counterSale.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot complete sale with no items",
      });
    }

    // Check and deduct stock
    for (const item of counterSale.items) {
      let stock = null;

      if (item.stockId) {
        stock = await Stock.findById(item.stockId);
      } else {
        stock = await Stock.findOne({ partNumber: item.partNo });
      }

      if (!stock) {
        return res.status(400).json({
          success: false,
          message: `Stock not found for ${item.partNo}`,
        });
      }

      if (stock.quantityOnHand < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.partNo}. Available: ${stock.quantityOnHand}`,
        });
      }

      stock.quantityOnHand -= item.quantity;
      stock.lastMovementDate = new Date();
      await stock.save();

      item.stockId = stock._id;
    }

    counterSale.status = "Completed";
    counterSale.stockDeducted = true;

    await counterSale.save();

    res.json({
      success: true,
      message: "Sale completed successfully",
      data: counterSale,
    });
  } catch (error) {
    console.error("Complete Sale Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add payment
exports.addPayment = async (req, res) => {
  try {
    const { amount, method, reference } = req.body;

    const counterSale = await CounterSale.findById(req.params.id);

    if (!counterSale) {
      return res.status(404).json({
        success: false,
        message: "Counter sale not found",
      });
    }

    if (counterSale.status === "Cancelled" || counterSale.status === "Refunded") {
      return res.status(400).json({
        success: false,
        message: "Cannot add payment to cancelled/refunded sale",
      });
    }

    counterSale.payments.push({
      amount,
      method: method || "Cash",
      reference,
      paidAt: new Date(),
    });

    await counterSale.save();

    res.json({
      success: true,
      message: "Payment added successfully",
      data: counterSale,
    });
  } catch (error) {
    console.error("Add Payment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Cancel sale
exports.cancelSale = async (req, res) => {
  try {
    const { reason } = req.body;

    const counterSale = await CounterSale.findById(req.params.id);

    if (!counterSale) {
      return res.status(404).json({
        success: false,
        message: "Counter sale not found",
      });
    }

    // If stock was deducted, add it back
    if (counterSale.stockDeducted) {
      for (const item of counterSale.items) {
        if (item.stockId) {
          await Stock.findByIdAndUpdate(item.stockId, {
            $inc: { quantityOnHand: item.quantity },
            lastMovementDate: new Date(),
          });
        }
      }
    }

    counterSale.status = "Cancelled";
    counterSale.notes = counterSale.notes
      ? `${counterSale.notes}\nCancelled: ${reason}`
      : `Cancelled: ${reason}`;

    await counterSale.save();

    res.json({
      success: true,
      message: "Sale cancelled and stock restored",
      data: counterSale,
    });
  } catch (error) {
    console.error("Cancel Sale Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Refund sale
exports.refundSale = async (req, res) => {
  try {
    const { refundAmount, reason } = req.body;

    const counterSale = await CounterSale.findById(req.params.id);

    if (!counterSale) {
      return res.status(404).json({
        success: false,
        message: "Counter sale not found",
      });
    }

    if (counterSale.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "Only completed sales can be refunded",
      });
    }

    // Add stock back
    if (counterSale.stockDeducted) {
      for (const item of counterSale.items) {
        if (item.stockId) {
          await Stock.findByIdAndUpdate(item.stockId, {
            $inc: { quantityOnHand: item.quantity },
            lastMovementDate: new Date(),
          });
        }
      }
    }

    counterSale.status = "Refunded";
    counterSale.notes = counterSale.notes
      ? `${counterSale.notes}\nRefunded: ${reason || "Customer request"}`
      : `Refunded: ${reason || "Customer request"}`;

    await counterSale.save();

    res.json({
      success: true,
      message: "Sale refunded and stock restored",
      data: counterSale,
    });
  } catch (error) {
    console.error("Refund Sale Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete sale (draft only)
exports.deleteCounterSale = async (req, res) => {
  try {
    const counterSale = await CounterSale.findById(req.params.id);

    if (!counterSale) {
      return res.status(404).json({
        success: false,
        message: "Counter sale not found",
      });
    }

    if (counterSale.status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft sales can be deleted",
      });
    }

    await CounterSale.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Counter sale deleted successfully",
    });
  } catch (error) {
    console.error("Delete Counter Sale Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get sales by customer mobile
exports.getSalesByCustomer = async (req, res) => {
  try {
    const { mobileNo } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const query = { mobileNo: { $regex: mobileNo, $options: "i" } };

    const total = await CounterSale.countDocuments(query);
    const sales = await CounterSale.find(query)
      .sort({ saleDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: sales,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Sales By Customer Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get today's sales
exports.getTodaySales = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sales = await CounterSale.find({
      saleDate: { $gte: today, $lt: tomorrow },
      status: { $ne: "Cancelled" },
    }).sort({ saleDate: -1 });

    const summary = {
      totalSales: sales.length,
      totalAmount: sales.reduce((sum, s) => sum + s.totalAmount, 0),
      totalPaid: sales.reduce((sum, s) => sum + s.paidAmount, 0),
      totalPending: sales.reduce((sum, s) => sum + s.balance, 0),
    };

    res.json({
      success: true,
      data: {
        sales,
        summary,
      },
    });
  } catch (error) {
    console.error("Get Today Sales Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get pending payments
exports.getPendingPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const query = {
      status: { $in: ["Completed", "Partial"] },
      paymentStatus: { $in: ["Unpaid", "Partial"] },
    };

    const total = await CounterSale.countDocuments(query);
    const sales = await CounterSale.find(query)
      .sort({ saleDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalPending = await CounterSale.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$balance" } } },
    ]);

    res.json({
      success: true,
      data: sales,
      totalPendingAmount: totalPending[0]?.total || 0,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Pending Payments Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get statistics
exports.getCounterSaleStats = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const dateFilter = {};
    if (fromDate || toDate) {
      dateFilter.saleDate = {};
      if (fromDate) dateFilter.saleDate.$gte = new Date(fromDate);
      if (toDate) dateFilter.saleDate.$lte = new Date(toDate);
    }

    const totalSales = await CounterSale.countDocuments({
      ...dateFilter,
      status: { $ne: "Cancelled" },
    });

    const statusCounts = await CounterSale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalValues = await CounterSale.aggregate([
      { $match: { ...dateFilter, status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: null,
          totalSalesAmount: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          totalPending: { $sum: "$balance" },
          totalDiscount: { $sum: "$totalDiscount" },
          totalTax: { $sum: "$totalTax" },
        },
      },
    ]);

    const topProducts = await CounterSale.aggregate([
      { $match: { ...dateFilter, status: { $ne: "Cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.partNo",
          partName: { $first: "$items.partName" },
          totalQty: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalPrice" },
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: 10 },
    ]);

    const dailySales = await CounterSale.aggregate([
      { $match: { ...dateFilter, status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$saleDate" },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ]);

    const paymentMethodStats = await CounterSale.aggregate([
      { $match: { ...dateFilter, status: { $ne: "Cancelled" } } },
      { $unwind: "$payments" },
      {
        $group: {
          _id: "$payments.method",
          count: { $sum: 1 },
          totalAmount: { $sum: "$payments.amount" },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalSales,
        statusCounts,
        totalSalesAmount: totalValues[0]?.totalSalesAmount || 0,
        totalPaid: totalValues[0]?.totalPaid || 0,
        totalPending: totalValues[0]?.totalPending || 0,
        totalDiscount: totalValues[0]?.totalDiscount || 0,
        totalTax: totalValues[0]?.totalTax || 0,
        topProducts,
        dailySales,
        paymentMethodStats,
      },
    });
  } catch (error) {
    console.error("Get Counter Sale Stats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Generate invoice
exports.generateInvoice = async (req, res) => {
  try {
    const counterSale = await CounterSale.findById(req.params.id)
      .populate("createdBy", "name email");

    if (!counterSale) {
      return res.status(404).json({
        success: false,
        message: "Counter sale not found",
      });
    }

    // Generate invoice data
    const invoice = {
      invoiceNo: `INV-${counterSale.saleNo}`,
      invoiceDate: new Date(),
      sale: {
        saleNo: counterSale.saleNo,
        saleDate: counterSale.saleDate,
      },
      customer: {
        name: counterSale.customerName,
        mobile: counterSale.mobileNo,
        email: counterSale.email,
        address: counterSale.address,
        regNo: counterSale.regNo,
      },
      items: counterSale.items.map((item) => ({
        partNo: item.partNo,
        partName: item.partName,
        brand: item.brand,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discountAmount,
        tax: item.taxAmount,
        total: item.totalPrice,
      })),
      subtotal: counterSale.subtotal,
      totalDiscount: counterSale.totalDiscount,
      totalTax: counterSale.totalTax,
      totalAmount: counterSale.totalAmount,
      paidAmount: counterSale.paidAmount,
      balance: counterSale.balance,
      payments: counterSale.payments,
      paymentStatus: counterSale.paymentStatus,
    };

    // Mark invoice as generated
    counterSale.invoiceNo = invoice.invoiceNo;
    counterSale.invoiceGenerated = true;
    await counterSale.save();

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Generate Invoice Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Search products for POS
exports.searchProducts = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const products = await Stock.find({
      isActive: true,
      quantityOnHand: { $gt: 0 },
      $or: [
        { partNumber: { $regex: query, $options: "i" } },
        { partName: { $regex: query, $options: "i" } },
        { brand: { $regex: query, $options: "i" } },
      ],
    })
      .select("partNumber partName brand category sellingPrice taxPercent quantityOnHand")
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Search Products Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


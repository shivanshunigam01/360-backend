const Stock = require("../models/Stock");

// Create new stock item
exports.createStock = async (req, res) => {
  try {
    const {
      partNumber,
      partName,
      brand,
      category,
      quantityOnHand,
      purchasePrice,
      sellingPrice,
      taxType,
      taxPercent,
      racNo,
      barcodeUrl,
      minStockLevel,
      maxStockLevel,
      location,
    } = req.body;

    // Check if part number already exists
    const existingStock = await Stock.findOne({ partNumber });
    if (existingStock) {
      return res.status(400).json({
        success: false,
        message: "Part number already exists",
      });
    }

    const stock = new Stock({
      partNumber,
      partName,
      brand,
      category,
      quantityOnHand: quantityOnHand || 0,
      purchasePrice,
      sellingPrice,
      taxType,
      taxPercent,
      racNo,
      barcodeUrl,
      minStockLevel,
      maxStockLevel,
      location,
      lastMovementDate: new Date(),
    });

    await stock.save();

    res.status(201).json({
      success: true,
      message: "Stock item created successfully",
      data: stock,
    });
  } catch (error) {
    console.error("Create Stock Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all stock items with filtering, sorting, and pagination
exports.getAllStock = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      brand,
      sortBy = "createdAt",
      sortOrder = "desc",
      lowStock,
      isActive,
    } = req.query;

    const query = {};

    // Search by part number, part name, or brand
    if (search) {
      query.$or = [
        { partNumber: { $regex: search, $options: "i" } },
        { partName: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by brand
    if (brand) {
      query.brand = brand;
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Filter low stock items
    if (lowStock === "true") {
      query.$expr = { $lte: ["$quantityOnHand", "$minStockLevel"] };
    }

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const total = await Stock.countDocuments(query);
    const stocks = await Stock.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Calculate ageing for each stock item
    const stocksWithAgeing = stocks.map((stock) => {
      const stockObj = stock.toObject();
      stockObj.ageing = stock.calculateAgeing();
      return stockObj;
    });

    res.json({
      success: true,
      data: stocksWithAgeing,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get All Stock Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single stock item by ID
exports.getStockById = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock item not found",
      });
    }

    const stockObj = stock.toObject();
    stockObj.ageing = stock.calculateAgeing();

    res.json({
      success: true,
      data: stockObj,
    });
  } catch (error) {
    console.error("Get Stock By ID Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get stock by part number
exports.getStockByPartNumber = async (req, res) => {
  try {
    const stock = await Stock.findOne({ partNumber: req.params.partNumber });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock item not found",
      });
    }

    const stockObj = stock.toObject();
    stockObj.ageing = stock.calculateAgeing();

    res.json({
      success: true,
      data: stockObj,
    });
  } catch (error) {
    console.error("Get Stock By Part Number Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update stock item
exports.updateStock = async (req, res) => {
  try {
    const {
      partNumber,
      partName,
      brand,
      category,
      quantityOnHand,
      purchasePrice,
      sellingPrice,
      taxType,
      taxPercent,
      racNo,
      barcodeUrl,
      minStockLevel,
      maxStockLevel,
      location,
      isActive,
    } = req.body;

    const stock = await Stock.findById(req.params.id);

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock item not found",
      });
    }

    // Check if updating to a part number that already exists
    if (partNumber && partNumber !== stock.partNumber) {
      const existingStock = await Stock.findOne({ partNumber });
      if (existingStock) {
        return res.status(400).json({
          success: false,
          message: "Part number already exists",
        });
      }
    }

    // Track quantity changes for ageing
    const quantityChanged =
      quantityOnHand !== undefined && quantityOnHand !== stock.quantityOnHand;

    // Update fields
    if (partNumber !== undefined) stock.partNumber = partNumber;
    if (partName !== undefined) stock.partName = partName;
    if (brand !== undefined) stock.brand = brand;
    if (category !== undefined) stock.category = category;
    if (quantityOnHand !== undefined) stock.quantityOnHand = quantityOnHand;
    if (purchasePrice !== undefined) stock.purchasePrice = purchasePrice;
    if (sellingPrice !== undefined) stock.sellingPrice = sellingPrice;
    if (taxType !== undefined) stock.taxType = taxType;
    if (taxPercent !== undefined) stock.taxPercent = taxPercent;
    if (racNo !== undefined) stock.racNo = racNo;
    if (barcodeUrl !== undefined) stock.barcodeUrl = barcodeUrl;
    if (minStockLevel !== undefined) stock.minStockLevel = minStockLevel;
    if (maxStockLevel !== undefined) stock.maxStockLevel = maxStockLevel;
    if (location !== undefined) stock.location = location;
    if (isActive !== undefined) stock.isActive = isActive;

    // Update last movement date if quantity changed
    if (quantityChanged) {
      stock.lastMovementDate = new Date();
    }

    await stock.save();

    const stockObj = stock.toObject();
    stockObj.ageing = stock.calculateAgeing();

    res.json({
      success: true,
      message: "Stock item updated successfully",
      data: stockObj,
    });
  } catch (error) {
    console.error("Update Stock Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update stock quantity (for quick adjustments)
exports.updateQuantity = async (req, res) => {
  try {
    const { quantity, type } = req.body; // type: 'add' | 'subtract' | 'set'

    const stock = await Stock.findById(req.params.id);

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock item not found",
      });
    }

    let newQuantity = stock.quantityOnHand;

    switch (type) {
      case "add":
        newQuantity += quantity;
        break;
      case "subtract":
        newQuantity -= quantity;
        if (newQuantity < 0) {
          return res.status(400).json({
            success: false,
            message: "Insufficient stock quantity",
          });
        }
        break;
      case "set":
        newQuantity = quantity;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid type. Use 'add', 'subtract', or 'set'",
        });
    }

    stock.quantityOnHand = newQuantity;
    stock.lastMovementDate = new Date();
    await stock.save();

    res.json({
      success: true,
      message: "Stock quantity updated successfully",
      data: {
        partNumber: stock.partNumber,
        partName: stock.partName,
        previousQuantity: stock.quantityOnHand,
        newQuantity: newQuantity,
      },
    });
  } catch (error) {
    console.error("Update Quantity Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete stock item
exports.deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findByIdAndDelete(req.params.id);

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock item not found",
      });
    }

    res.json({
      success: true,
      message: "Stock item deleted successfully",
    });
  } catch (error) {
    console.error("Delete Stock Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Bulk create stock items
exports.bulkCreateStock = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required",
      });
    }

    const results = {
      created: [],
      failed: [],
    };

    for (const item of items) {
      try {
        const existingStock = await Stock.findOne({
          partNumber: item.partNumber,
        });

        if (existingStock) {
          results.failed.push({
            partNumber: item.partNumber,
            reason: "Part number already exists",
          });
          continue;
        }

        const stock = new Stock({
          ...item,
          lastMovementDate: new Date(),
        });

        await stock.save();
        results.created.push(stock);
      } catch (err) {
        results.failed.push({
          partNumber: item.partNumber,
          reason: err.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${results.created.length} items, ${results.failed.length} failed`,
      data: results,
    });
  } catch (error) {
    console.error("Bulk Create Stock Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get stock statistics
exports.getStockStats = async (req, res) => {
  try {
    const totalItems = await Stock.countDocuments({ isActive: true });

    const lowStockItems = await Stock.countDocuments({
      isActive: true,
      $expr: { $lte: ["$quantityOnHand", "$minStockLevel"] },
    });

    const outOfStockItems = await Stock.countDocuments({
      isActive: true,
      quantityOnHand: 0,
    });

    const totalValueResult = await Stock.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalPurchaseValue: {
            $sum: { $multiply: ["$quantityOnHand", "$purchasePrice"] },
          },
          totalSellingValue: {
            $sum: { $multiply: ["$quantityOnHand", "$sellingPrice"] },
          },
          totalQuantity: { $sum: "$quantityOnHand" },
        },
      },
    ]);

    const categoryStats = await Stock.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalQuantity: { $sum: "$quantityOnHand" },
          totalValue: { $sum: { $multiply: ["$quantityOnHand", "$purchasePrice"] } },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const brandStats = await Stock.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$brand",
          count: { $sum: 1 },
          totalQuantity: { $sum: "$quantityOnHand" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        totalItems,
        lowStockItems,
        outOfStockItems,
        totalPurchaseValue: totalValueResult[0]?.totalPurchaseValue || 0,
        totalSellingValue: totalValueResult[0]?.totalSellingValue || 0,
        totalQuantity: totalValueResult[0]?.totalQuantity || 0,
        categoryStats,
        brandStats,
      },
    });
  } catch (error) {
    console.error("Get Stock Stats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all unique categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Stock.distinct("category", { isActive: true });
    res.json({
      success: true,
      data: categories.filter(Boolean).sort(),
    });
  } catch (error) {
    console.error("Get Categories Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all unique brands
exports.getBrands = async (req, res) => {
  try {
    const brands = await Stock.distinct("brand", { isActive: true });
    res.json({
      success: true,
      data: brands.filter(Boolean).sort(),
    });
  } catch (error) {
    console.error("Get Brands Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get low stock items
exports.getLowStockItems = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const lowStockItems = await Stock.find({
      isActive: true,
      $expr: { $lte: ["$quantityOnHand", "$minStockLevel"] },
    })
      .sort({ quantityOnHand: 1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: lowStockItems.length,
      data: lowStockItems,
    });
  } catch (error) {
    console.error("Get Low Stock Items Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Search stock by barcode
exports.searchByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    const stock = await Stock.findOne({
      barcodeUrl: { $regex: barcode, $options: "i" },
      isActive: true,
    });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock item not found",
      });
    }

    res.json({
      success: true,
      data: stock,
    });
  } catch (error) {
    console.error("Search By Barcode Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


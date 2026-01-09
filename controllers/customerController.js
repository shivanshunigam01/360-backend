const Customer = require("../models/Customer");

// Create new customer
exports.createCustomer = async (req, res) => {
  try {
    const {
      customerType,
      tpin,
      customerName,
      firstName,
      lastName,
      birthday,
      gender,
      companyName,
      gstNo,
      panNo,
      cinNo,
      industryType,
      contactPerson,
      mobileNo,
      altMobileNo,
      email,
      altEmail,
      address,
      billingAddress,
      shippingAddress,
      vehicles,
      creditLimit,
      paymentTerms,
      preferredContact,
      marketingOptIn,
      notes,
      source,
      referredBy,
    } = req.body;

    // Check for duplicate mobile or email
    if (mobileNo) {
      const existingByMobile = await Customer.findOne({ mobileNo });
      if (existingByMobile) {
        return res.status(400).json({
          success: false,
          message: "Customer with this mobile number already exists",
        });
      }
    }

    if (email) {
      const existingByEmail = await Customer.findOne({ email: email.toLowerCase() });
      if (existingByEmail) {
        return res.status(400).json({
          success: false,
          message: "Customer with this email already exists",
        });
      }
    }

    const customer = new Customer({
      customerType: customerType || "Individual",
      tpin,
      customerName,
      firstName,
      lastName,
      birthday,
      gender,
      companyName,
      gstNo,
      panNo,
      cinNo,
      industryType,
      contactPerson,
      mobileNo,
      altMobileNo,
      email,
      altEmail,
      address,
      billingAddress,
      shippingAddress,
      vehicles,
      creditLimit,
      paymentTerms,
      preferredContact,
      marketingOptIn,
      notes,
      source,
      referredBy,
      createdBy: req.user?.userId,
      customerName: `${firstName} ${lastName}`.trim(),
    });

    await customer.save();

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Create Customer Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      customerType,
      isActive,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    // Search
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { mobileNo: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { tpin: { $regex: search, $options: "i" } },
        { customerCode: { $regex: search, $options: "i" } },
        { "vehicles.regNo": { $regex: search, $options: "i" } },
      ];
    }

    // Filters
    if (customerType) query.customerType = customerType;
    if (isActive !== undefined) query.isActive = isActive === "true";

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .populate("createdBy", "name email")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get All Customers Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .populate("referredBy", "customerName mobileNo");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Get Customer By ID Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get by customer code
exports.getCustomerByCode = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      customerCode: req.params.code,
    }).populate("createdBy", "name email");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Get Customer By Code Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get by mobile number
exports.getCustomerByMobile = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      mobileNo: req.params.mobileNo,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Get Customer By Mobile Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get by vehicle registration number
exports.getCustomerByVehicle = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      "vehicles.regNo": { $regex: req.params.regNo, $options: "i" },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Get Customer By Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const {
      customerType,
      tpin,
      customerName,
      firstName,
      lastName,
      birthday,
      gender,
      companyName,
      gstNo,
      panNo,
      cinNo,
      industryType,
      contactPerson,
      mobileNo,
      altMobileNo,
      email,
      altEmail,
      address,
      billingAddress,
      shippingAddress,
      vehicles,
      creditLimit,
      paymentTerms,
      preferredContact,
      marketingOptIn,
      isActive,
      notes,
    } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check for duplicate mobile (if changed)
    if (mobileNo && mobileNo !== customer.mobileNo) {
      const existingByMobile = await Customer.findOne({ mobileNo });
      if (existingByMobile) {
        return res.status(400).json({
          success: false,
          message: "Customer with this mobile number already exists",
        });
      }
    }

    // Check for duplicate email (if changed)
    if (email && email.toLowerCase() !== customer.email) {
      const existingByEmail = await Customer.findOne({ email: email.toLowerCase() });
      if (existingByEmail) {
        return res.status(400).json({
          success: false,
          message: "Customer with this email already exists",
        });
      }
    }

    // Update fields
    if (customerType !== undefined) customer.customerType = customerType;
    if (tpin !== undefined) customer.tpin = tpin;
    if (customerName !== undefined) customer.customerName = customerName;
    if (firstName !== undefined) customer.firstName = firstName;
    if (lastName !== undefined) customer.lastName = lastName;
    if (birthday !== undefined) customer.birthday = birthday;
    if (gender !== undefined) customer.gender = gender;
    if (companyName !== undefined) customer.companyName = companyName;
    if (gstNo !== undefined) customer.gstNo = gstNo;
    if (panNo !== undefined) customer.panNo = panNo;
    if (cinNo !== undefined) customer.cinNo = cinNo;
    if (industryType !== undefined) customer.industryType = industryType;
    if (contactPerson !== undefined) customer.contactPerson = contactPerson;
    if (mobileNo !== undefined) customer.mobileNo = mobileNo;
    if (altMobileNo !== undefined) customer.altMobileNo = altMobileNo;
    if (email !== undefined) customer.email = email;
    if (altEmail !== undefined) customer.altEmail = altEmail;
    if (address !== undefined) customer.address = address;
    if (billingAddress !== undefined) customer.billingAddress = billingAddress;
    if (shippingAddress !== undefined) customer.shippingAddress = shippingAddress;
    if (vehicles !== undefined) customer.vehicles = vehicles;
    if (creditLimit !== undefined) customer.creditLimit = creditLimit;
    if (paymentTerms !== undefined) customer.paymentTerms = paymentTerms;
    if (preferredContact !== undefined) customer.preferredContact = preferredContact;
    if (marketingOptIn !== undefined) customer.marketingOptIn = marketingOptIn;
    if (isActive !== undefined) customer.isActive = isActive;
    if (notes !== undefined) customer.notes = notes;

    customer.updatedBy = req.user?.userId;

    await customer.save();

    res.json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Update Customer Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add vehicle to customer
exports.addVehicle = async (req, res) => {
  try {
    const { regNo, make, model, year, color, vinNo, engineNo, fuelType, isDefault } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check if vehicle already exists
    const existingVehicle = customer.vehicles.find(
      (v) => v.regNo.toLowerCase() === regNo.toLowerCase()
    );

    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: "Vehicle already exists for this customer",
      });
    }

    // If new vehicle is default, remove default from others
    if (isDefault) {
      customer.vehicles.forEach((v) => (v.isDefault = false));
    }

    customer.vehicles.push({
      regNo,
      make,
      model,
      year,
      color,
      vinNo,
      engineNo,
      fuelType,
      isDefault: isDefault || customer.vehicles.length === 0,
    });

    await customer.save();

    res.json({
      success: true,
      message: "Vehicle added successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Add Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove vehicle from customer
exports.removeVehicle = async (req, res) => {
  try {
    const { regNo } = req.params;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const vehicleIndex = customer.vehicles.findIndex(
      (v) => v.regNo.toLowerCase() === regNo.toLowerCase()
    );

    if (vehicleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    customer.vehicles.splice(vehicleIndex, 1);
    await customer.save();

    res.json({
      success: true,
      message: "Vehicle removed successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Remove Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update credit balance
exports.updateCreditBalance = async (req, res) => {
  try {
    const { amount, type } = req.body;
    // type: 'add' | 'deduct' | 'set'

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    switch (type) {
      case "add":
        customer.currentBalance += amount;
        break;
      case "deduct":
        customer.currentBalance -= amount;
        break;
      case "set":
        customer.currentBalance = amount;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid type. Use 'add', 'deduct', or 'set'",
        });
    }

    await customer.save();

    res.json({
      success: true,
      message: "Credit balance updated",
      data: {
        customerId: customer._id,
        customerName: customer.customerName,
        currentBalance: customer.currentBalance,
        creditLimit: customer.creditLimit,
      },
    });
  } catch (error) {
    console.error("Update Credit Balance Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Blacklist/Unblacklist customer
exports.toggleBlacklist = async (req, res) => {
  try {
    const { blacklist, reason } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    customer.isBlacklisted = blacklist;
    customer.blacklistReason = blacklist ? reason : null;

    await customer.save();

    res.json({
      success: true,
      message: blacklist ? "Customer blacklisted" : "Customer removed from blacklist",
      data: customer,
    });
  } catch (error) {
    console.error("Toggle Blacklist Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete Customer Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get individual customers
exports.getIndividualCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = { customerType: "Individual", isActive: true };

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { mobileNo: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .select("customerCode customerName mobileNo email address vehicles")
      .sort({ customerName: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Individual Customers Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get corporate customers
exports.getCorporateCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = { customerType: "Corporate", isActive: true };

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { gstNo: { $regex: search, $options: "i" } },
        { mobileNo: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .select("customerCode companyName gstNo contactPerson mobileNo email address")
      .sort({ companyName: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Corporate Customers Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Search customers (for dropdowns/autocomplete)
exports.searchCustomers = async (req, res) => {
  try {
    const { query, type, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const searchQuery = {
      isActive: true,
      $or: [
        { customerName: { $regex: query, $options: "i" } },
        { companyName: { $regex: query, $options: "i" } },
        { mobileNo: { $regex: query, $options: "i" } },
        { "vehicles.regNo": { $regex: query, $options: "i" } },
      ],
    };

    if (type) {
      searchQuery.customerType = type;
    }

    const customers = await Customer.find(searchQuery)
      .select("customerCode customerName companyName customerType mobileNo email vehicles")
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error("Search Customers Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get statistics
exports.getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments({ isActive: true });
    const individualCount = await Customer.countDocuments({
      customerType: "Individual",
      isActive: true,
    });
    const corporateCount = await Customer.countDocuments({
      customerType: "Corporate",
      isActive: true,
    });
    const blacklistedCount = await Customer.countDocuments({ isBlacklisted: true });

    const recentCustomers = await Customer.find({ isActive: true })
      .select("customerCode customerName customerType mobileNo createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    const customersBySource = await Customer.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalCustomers,
        individualCount,
        corporateCount,
        blacklistedCount,
        recentCustomers,
        customersBySource,
      },
    });
  } catch (error) {
    console.error("Get Customer Stats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get customers with birthdays this month
exports.getBirthdayCustomers = async (req, res) => {
  try {
    const currentMonth = new Date().getMonth() + 1;

    const customers = await Customer.find({
      isActive: true,
      birthday: { $exists: true, $ne: null },
      $expr: { $eq: [{ $month: "$birthday" }, currentMonth] },
    })
      .select("customerName mobileNo email birthday")
      .sort({ birthday: 1 });

    res.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.error("Get Birthday Customers Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// router.patch("/:id/active", auth, customerController.toggleActiveCustomer);
// router.patch("/:id/inactive", auth, customerController.toggleInactiveCustomer);
exports.toggleActiveCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    res.json({
      success: true,
      message: "Customer activated successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Toggle Active Customer Error:", error);
    res.status(500).json({
      success: false, message: error.message,
    });
  }
};
exports.toggleInactiveCustomer = async (req,res)=> {
try {
  const customer = await Customer.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  res.json({
    success: true,
    message: "Customer deactivated successfully",
    data: customer,
  });
  } catch (error) {
    console.error("Toggle Inactive Customer Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
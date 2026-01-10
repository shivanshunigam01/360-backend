const Estimate = require("../models/Estimate");

const calculateLineTotal = (item) => {
  const qty = Number(item.qty) || 0;
  const rate = Number(item.rate) || 0;
  const labourCost = Number(item.labourCost) || 0;
  const tax = Number(item.tax) || 0;

  const partTotal = qty * rate;
  const subtotal = partTotal + labourCost;
  const taxAmount = (subtotal * tax) / 100;

  return Number((subtotal + taxAmount).toFixed(2));
};

const normalizeItems = (items = []) =>
  items.map((item) => ({
    ...item,
    lineTotal: calculateLineTotal(item),
  }));

const calculateGrandTotal = (items = []) => {
  const total = items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
  return Number(total.toFixed(2));
};

const generateNextIds = async () => {
  const count = await Estimate.countDocuments();
  const next = count + 1;
  const year = new Date().getFullYear();
  const padded = String(next).padStart(3, "0");

  return {
    estimateId: `EST-${padded}`,
    jobNo: `JC-${year}-${padded}`,
  };
};

exports.getAllEstimates = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    const estimates = await Estimate.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: estimates });
  } catch (error) {
    console.error("Error fetching estimates:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEstimateById = async (req, res) => {
  try {
    const estimate = await Estimate.findById(req.params.id);

    if (!estimate) {
      return res
        .status(404)
        .json({ success: false, message: "Estimate not found" });
    }

    res.status(200).json({ success: true, data: estimate });
  } catch (error) {
    console.error("Error fetching estimate by id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createEstimate = async (req, res) => {
  try {
    const {
      jobNo,
      customerName,
      vehicleDetails,
      registrationNo,
      date,
      status,
      items,
      notes,
    } = req.body;

    if (!customerName || !vehicleDetails) {
      return res.status(400).json({
        success: false,
        message: "Customer name and vehicle details are required",
      });
    }

    const ids = await generateNextIds();
    const normalizedItems = normalizeItems(items || []);
    const grandTotal = calculateGrandTotal(normalizedItems);

    const payload = {
      ...ids,
      jobNo: jobNo ? jobNo.trim() : ids.jobNo,
      customerName: customerName.trim(),
      vehicleDetails: vehicleDetails.trim(),
      registrationNo: registrationNo ? registrationNo.trim() : undefined,
      date: date ? new Date(date) : undefined,
      status: status || "requested",
      items: normalizedItems,
      grandTotal: grandTotal || 0,
      notes,
    };

    if (req.user && req.user.id) {
      payload.createdBy = req.user.id;
    }

    const estimate = await Estimate.create(payload);

    return res.status(201).json({
      success: true,
      message: "Estimate created successfully",
      data: estimate,
    });
  } catch (error) {
    console.error("Error creating estimate:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEstimate = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.items) {
      updates.items = normalizeItems(updates.items);
      updates.grandTotal = calculateGrandTotal(updates.items);
    }

    if (updates.customerName) {
      updates.customerName = updates.customerName.trim();
    }

    if (updates.vehicleDetails) {
      updates.vehicleDetails = updates.vehicleDetails.trim();
    }

    if (updates.registrationNo) {
      updates.registrationNo = updates.registrationNo.trim();
    }

    if (updates.date) {
      updates.date = new Date(updates.date);
    }

    updates.updatedAt = Date.now();

    const estimate = await Estimate.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!estimate) {
      return res
        .status(404)
        .json({ success: false, message: "Estimate not found" });
    }

    res.status(200).json({
      success: true,
      message: "Estimate updated successfully",
      data: estimate,
    });
  } catch (error) {
    console.error("Error updating estimate:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteEstimate = async (req, res) => {
  try {
    const estimate = await Estimate.findByIdAndDelete(req.params.id);

    if (!estimate) {
      return res
        .status(404)
        .json({ success: false, message: "Estimate not found" });
    }

    res.status(200).json({
      success: true,
      message: "Estimate deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting estimate:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEstimateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: "Status is required" });
    }

    const estimate = await Estimate.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!estimate) {
      return res
        .status(404)
        .json({ success: false, message: "Estimate not found" });
    }

    res.status(200).json({
      success: true,
      message: "Estimate status updated successfully",
      data: estimate,
    });
  } catch (error) {
    console.error("Error updating estimate status:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
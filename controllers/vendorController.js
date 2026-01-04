const vendorService = require("../services/vendorService");

/**
 * CREATE Vendor
 */
exports.createVendor = async (req, res) => {
  try {
    const vendor = await vendorService.createVendor(req.body);
    return res.status(201).json({
      success: true,
      vendor
    });
  } catch (err) {
    console.error("Create Vendor Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * GET All Vendors (with pagination & search)
 */
exports.getAllVendors = async (req, res) => {
  try {
    const { page, limit, search } = req.query;

    const result = await vendorService.getVendors({
      page,
      limit,
      search
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error("Get Vendors Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * GET Vendor by ID
 */
exports.getVendorById = async (req, res) => {
  try {
    const vendor = await vendorService.getVendorById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    return res.status(200).json({
      success: true,
      vendor
    });
  } catch (err) {
    console.error("Get Vendor Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * UPDATE Vendor (Partial update allowed)
 */
exports.updateVendor = async (req, res) => {
  try {
    const updatedVendor = await vendorService.updateVendor(
      req.params.id,
      req.body
    );

    if (!updatedVendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    return res.status(200).json({
      success: true,
      vendor: updatedVendor
    });
  } catch (err) {
    console.error("Update Vendor Error:", err);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * DELETE Vendor
 */
exports.deleteVendor = async (req, res) => {
  try {
    const deleted = await vendorService.deleteVendor(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vendor deleted successfully"
    });
  } catch (err) {
    console.error("Delete Vendor Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

const Vendor = require("../models/Vendor");

/**
 * Create a new vendor
 * @param {Object} data
 */
async function createVendor(data) {
  const vendor = new Vendor(data);
  return await vendor.save();
}

/**
 * Get vendors with pagination and optional search
 * @param {Object} options
 */
async function getVendors(options = {}) {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const query = {};
  const { search } = options;
  if (search) {
    const regex = new RegExp(search, "i");
    query.$or = [
      { name: regex },
      { contactEmail: regex },
      { region: regex },
      { gstin: regex },
    ];
  }

  const [total, vendors] = await Promise.all([
    Vendor.countDocuments(query),
    Vendor.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  return { total, page, limit, vendors };
}

async function getVendorById(id) {
  return await Vendor.findById(id);
}

async function updateVendor(id, updateData) {
  return await Vendor.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
}

async function deleteVendor(id) {
  return await Vendor.findByIdAndDelete(id);
}

module.exports = {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
};

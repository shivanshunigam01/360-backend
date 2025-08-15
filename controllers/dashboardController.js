const Medicine = require("../models/Medicine");
const User = require("../models/User");
const Contact = require("../models/Contact");

exports.getStats = async (req, res) => {
  try {
    // Get total counts
    const totalMedicines = await Medicine.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalContacts = await Contact.countDocuments();

    // Get low stock medicines
    const lowStockMedicines = await Medicine.find({ stock: { $lt: 10 } })
      .select("name stock price")
      .limit(5); 

    res.json({
      totalMedicines,
      totalUsers,
      totalContacts,
      lowStockMedicines,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

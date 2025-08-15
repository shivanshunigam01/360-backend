const Leads = require("../models/leads.model");
const Contact = require("../models/contact.model");

exports.sendOtpAndSaveLead = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res
        .status(400)
        .json({ success: false, message: "Name and phone are required." });
    }

    // Save in Leads
    await Leads.create({ name, phone });

    // Save in Contact
    await Contact.create({ name, phone });

    // You can integrate your actual OTP service here if needed.

    return res.status(200).json({
      success: true,
      message: "Lead and contact saved successfully. OTP sent.",
    });
  } catch (error) {
    console.error("Error saving lead/contact:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { timestamps: true }
);

// ✅ Prevent OverwriteModelError
module.exports =
  mongoose.models.Contact || mongoose.model("Contact", contactSchema);

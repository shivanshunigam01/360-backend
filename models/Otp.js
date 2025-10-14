const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  createdAt: { type: Date, default: Date.now, expires: 600 }, // 10 min
});

module.exports = mongoose.model("Otp", OtpSchema);

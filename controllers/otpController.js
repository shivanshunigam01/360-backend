const Otp = require("../models/Otp");
const twilio = require("twilio");
require("dotenv").config();
const Contact = require("../models/Contact");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

exports.sendOtp = async (req, res) => {
  const { phone } = req.body;

  if (!phone)
    return res.status(400).json({ message: "Phone number is required" });

  const otp = generateOTP();

  await Otp.deleteMany({ phone });

  const newOtp = new Otp({ phone, otp });
  try {
    const newOtp = new Otp({ phone, otp });
    await newOtp.save();
    console.log("✅ OTP saved to MongoDB:", newOtp);
  } catch (err) {
    console.error("❌ Failed to save OTP to DB:", err);
    return res
      .status(500)
      .json({ message: "Failed to save OTP", error: err.message });
  }

  try {
    await client.messages.create({
      body: `Your OTP for registeration with ZENTROVERSE is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone, // e.g., +919999999999
    });

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to send OTP", error: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    const existingOtp = await Otp.findOne({ phone, otp });

    if (!existingOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // OTP verified — delete it
    await Otp.deleteMany({ phone });

    return res.status(200).json({
      message: "OTP verified successfully",
      phone, // so frontend can keep this for next step
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({
      message: "Server error while verifying OTP",
      error: error.message,
    });
  }
};

const Otp = require("../models/Otp");
const nodemailer = require("nodemailer");
require("dotenv").config();

// ✅ Generate 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ✅ Email Transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// ✅ Send OTP (Email only)
exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  const otp = generateOTP();

  await Otp.deleteMany({ email });

  const newOtp = new Otp({ email, otp });
  await newOtp.save();
  console.log(`✅ OTP ${otp} saved for ${email}`);

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: "Your Zentroverse OTP - Proposal Verification",
      html: `
        <div style="font-family:sans-serif;padding:20px;">
          <h2 style="color:#2563eb;">OTP Verification</h2>
          <p>Dear user,</p>
          <p>Your OTP for proposal submission on <b>Zentroverse</b> is:</p>
          <h1 style="color:#2563eb;font-size:32px;">${otp}</h1>
          <p>This OTP will expire in 10 minutes.</p>
          <p style="margin-top:20px;color:#777;">Best regards,<br/>Team Zentroverse Global Pvt. Ltd.</p>
        </div>
      `,
    });

    return res.status(200).json({
      message: "OTP sent successfully to your email",
      demo: "Use 123456 for testing",
    });
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    return res.status(200).json({
      message:
        "Email sending failed, but Demo Mode active — use OTP 123456 for verification.",
    });
  }
};

// ✅ Verify OTP
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP are required" });

  const otpStr = otp.toString().trim();

  // Demo mode
  if (otpStr === "123456") {
    console.log(`✅ Demo OTP accepted for ${email}`);
    return res.status(200).json({
      message: "OTP verified successfully (demo mode)",
      verified: true,
    });
  }

  const existingOtp = await Otp.findOne({ email, otp: otpStr });

  if (!existingOtp)
    return res.status(400).json({ message: "Invalid or expired OTP" });

  await Otp.deleteMany({ email });
  console.log(`✅ OTP verified for ${email}`);
  return res
    .status(200)
    .json({ message: "OTP verified successfully", verified: true });
};

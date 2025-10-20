// controllers/landingLeadController.js
const LandingLead = require("../models/LandingLead");
const nodemailer = require("nodemailer");

let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

exports.createLandingLead = async (req, res) => {
  try {
    const {
      name,
      contact,
      email,
      state,
      city,
      pincode,
      vehicleModels,
      source,
      expectedMonth,
      message,
      agree,
      ctaSource,
      submittedAt,
    } = req.body || {};

    if (!name || !email || !contact) {
      return res
        .status(400)
        .json({ success: false, message: "name, email, contact are required" });
    }

    const lead = await LandingLead.create({
      name: String(name).trim(),
      contact: String(contact).trim(),
      email: String(email).trim().toLowerCase(),
      state: state || "",
      city: city || "",
      pincode: pincode || "",
      vehicleModels: Array.isArray(vehicleModels) ? vehicleModels : [],
      source: source || "",
      expectedMonth: expectedMonth || "",
      message: message || "",
      agree: !!agree,
      ctaSource: ctaSource || "Direct Submit",
      submittedAt: submittedAt ? new Date(submittedAt) : new Date(),
      ip: (
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        ""
      ).toString(),
      userAgent: req.headers["user-agent"] || "",
    });

    if (transporter && process.env.ADMIN_EMAIL) {
      transporter
        .sendMail({
          from: process.env.SMTP_USER,
          to: process.env.ADMIN_EMAIL,
          subject: "🧧 New Landing Lead (Festive)",
          html: `
          <h2>New Landing Lead</h2>
          <p><b>Name:</b> ${lead.name}</p>
          <p><b>Email:</b> ${lead.email}</p>
          <p><b>Contact:</b> ${lead.contact}</p>
          <p><b>State/City:</b> ${lead.state} / ${lead.city} (${
            lead.pincode
          })</p>
          <p><b>Models:</b> ${lead.vehicleModels.join(", ") || "-"}</p>
          <p><b>Source:</b> ${lead.source || "-"}</p>
          <p><b>Expected Month:</b> ${lead.expectedMonth || "-"}</p>
          <p><b>CTA:</b> ${lead.ctaSource}</p>
          <p><b>Message:</b> ${lead.message || "-"}</p>
          <hr/><small>IP: ${lead.ip} • UA: ${lead.userAgent}</small>
        `,
        })
        .catch(() => {});
    }

    return res.status(201).json({ success: true, message: "Lead saved", lead });
  } catch (err) {
    console.error("createLandingLead error:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to save lead",
        error: err.message,
      });
  }
};

exports.listLandingLeads = async (_req, res) => {
  try {
    const leads = await LandingLead.find({}).sort({ createdAt: -1 }).limit(500);
    res.json({ success: true, data: leads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

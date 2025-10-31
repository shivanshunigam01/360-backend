// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const morgan = require("morgan");
const fs = require("fs");

// Load env ASAP
dotenv.config();

const heroRoutes = require("./routes/heroRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const faqRoutes = require("./routes/faqRoutes");
const blogRoutes = require("./routes/blogRoutes");
dotenv.config();
const contactRoutes = require("./routes/contactRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const landingLeadRoutes = require("./routes/landingLeadRoutes");

//new things
const otpRoutes = require("./routes/otpRoutes.js");
// const contactRoutes = require("./routes/contact.routes.js");
const app = express();

// -------------------------------------
// Middleware
app.use(morgan("dev"));

// ✅ Allow-all CORS (includes preflight)
app.use(cors());           // Access-Control-Allow-Origin: *
app.options("*", cors());  // handle preflight globally

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// -------------------------------------

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ensure upload dirs exist
const uploadsDir = path.join(__dirname, "uploads");
const medicineUploadsDir = path.join(uploadsDir, "medicines");
const testimonialUploadsDir = path.join(uploadsDir, "testimonials");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(medicineUploadsDir)) {
  fs.mkdirSync(medicineUploadsDir);
}
if (!fs.existsSync(testimonialUploadsDir)) {
  fs.mkdirSync(testimonialUploadsDir);
}

// Routes
app.use("/api/hero", heroRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/upload", uploadRoutes);

app.use("/api/landing-leads", landingLeadRoutes);

//new rotues
app.use("/api/otp", otpRoutes);
app.use("/api/contact", contactRoutes);

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log(`Connected to MongoDB ${process.env.MONGODB_URI}`))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

module.exports = app;

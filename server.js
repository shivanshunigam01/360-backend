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
const jobcardRoutes = require("./routes/jobcardRoutes");

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

// Ensure logs directory exists for server error logging
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Global handlers to capture and persist unexpected crashes/rejections
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at Promise', p, 'reason:', reason);
  try {
    fs.appendFileSync(path.join(logsDir, 'server-errors.log'), `${new Date().toISOString()} - unhandledRejection: ${reason}\n`);
  } catch (e) {
    console.error('Failed to write unhandledRejection to log', e);
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception', err);
  try {
    fs.appendFileSync(path.join(logsDir, 'server-errors.log'), `${new Date().toISOString()} - uncaughtException: ${err.stack || err}\n`);
  } catch (e) {
    console.error('Failed to write uncaughtException to log', e);
  }
});

// Routes
app.use("/api/hero", heroRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/auth", authRoutes);
// Legacy mount for compatibility with older clients that hit "/auth/*"
app.use("/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/upload", uploadRoutes);

app.use("/api/landing-leads", landingLeadRoutes);

// JobCard CRUD
app.use("/api/jobcards", jobcardRoutes);

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

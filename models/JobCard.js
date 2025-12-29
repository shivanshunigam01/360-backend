const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  text: { type: String },
  author: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const jobCardSchema = new mongoose.Schema({
  jobNumber: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  customer: { type: String, trim: true },
  assignedTo: { type: String, trim: true },
  vehicleMake: { type: String, trim: true },
  vehicle: { type: String, trim: true },
  regNo: { type: String, trim: true },
  vin: { type: String, trim: true },
  odometer: { type: Number },
  mobile: { type: String, trim: true },
  email: { type: String, trim: true },
  advance: { type: Number, default: 0 },
  insurance: { type: String, trim: true },
  status: {
    type: String,
    enum: ["open", "in_progress", "completed", "closed"],
    default: "open",
  },
  notes: [noteSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

jobCardSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("JobCard", jobCardSchema);

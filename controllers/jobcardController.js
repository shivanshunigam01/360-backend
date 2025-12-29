const JobCard = require("../models/JobCard");

exports.getAllJobCards = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20, sortBy = "createdAt", order = "desc" } = req.query;
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const perPage = Math.max(parseInt(limit) || 20, 1);

    let query = {};
    if (status) query.status = status;
    if (search) {
      const re = new RegExp(search, "i");
      query.$or = [
        { jobNumber: { $regex: re } },
        { title: { $regex: re } },
        { customer: { $regex: re } },
      ];
    }

    const total = await JobCard.countDocuments(query);
    const sortOrder = order === "asc" ? 1 : -1;
    const jobcards = await JobCard.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((pageNum - 1) * perPage)
      .limit(perPage);

    res.status(200).json({ total, page: pageNum, limit: perPage, totalPages: Math.ceil(total / perPage), data: jobcards });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export job cards to an Excel (.xlsx) file. Accepts same query params as listing (search, status, sortBy, order)
exports.exportJobCards = async (req, res) => {
  try {
    const { status, search, sortBy = "createdAt", order = "desc" } = req.query;
    let query = {};
    if (status) query.status = status;
    if (search) {
      const re = new RegExp(search, "i");
      query.$or = [
        { jobNumber: { $regex: re } },
        { title: { $regex: re } },
        { customer: { $regex: re } },
        { regNo: { $regex: re } },
      ];
    }

    const sortOrder = order === "asc" ? 1 : -1;
    const rows = await JobCard.find(query).sort({ [sortBy]: sortOrder }).lean();

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Job Cards');

    sheet.columns = [
      { header: 'Job Number', key: 'jobNumber', width: 20 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Customer', key: 'customer', width: 25 },
      { header: 'Reg No', key: 'regNo', width: 15 },
      { header: 'VIN', key: 'vin', width: 30 },
      { header: 'Vehicle', key: 'vehicle', width: 20 },
      { header: 'Service Advisor', key: 'assignedTo', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Odometer', key: 'odometer', width: 12 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Advance', key: 'advance', width: 12 },
      { header: 'Insurance', key: 'insurance', width: 25 },
      { header: 'Created At', key: 'createdAt', width: 20 }
    ];

    rows.forEach(r => {
      sheet.addRow({
        jobNumber: r.jobNumber,
        title: r.title,
        customer: r.customer,
        regNo: r.regNo,
        vin: r.vin,
        vehicle: r.vehicle,
        assignedTo: r.assignedTo,
        status: r.status,
        odometer: r.odometer,
        mobile: r.mobile,
        email: r.email,
        advance: r.advance,
        insurance: r.insurance,
        createdAt: r.createdAt ? new Date(r.createdAt) : null,
      });
    });

    // Make header row bold
    sheet.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=jobcards-${new Date().toISOString().slice(0,10)}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getJobCardById = async (req, res) => {
  try {
    const jobcard = await JobCard.findById(req.params.id);
    if (!jobcard) return res.status(404).json({ message: "JobCard not found" });
    res.status(200).json(jobcard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createJobCard = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.jobNumber) data.jobNumber = `JC-${Date.now()}`;

    // Provide a sensible default title if frontend didn't send one
    if (!data.title) {
      const customersPart = data.customer ? `${data.customer}` : "Job Card";
      const vehiclePart = data.vehicle ? ` - ${data.vehicle}` : "";
      data.title = `${customersPart}${vehiclePart}`;
    }

    const exists = await JobCard.findOne({ jobNumber: data.jobNumber });
    if (exists) return res.status(400).json({ message: "Job number already exists" });
    const jobcard = new JobCard(data);
    const saved = await jobcard.save();
    res.status(201).json(saved);
  } catch (error) {
    // Better handling for Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: `Validation failed: ${errors}` });
    }
    res.status(400).json({ message: error.message });
  }
};

exports.updateJobCard = async (req, res) => {
  try {
    const updates = { ...req.body, updatedAt: Date.now() };
    const jobcard = await JobCard.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    if (!jobcard) return res.status(404).json({ message: "JobCard not found" });
    res.status(200).json(jobcard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteJobCard = async (req, res) => {
  try {
    const jobcard = await JobCard.findByIdAndDelete(req.params.id);
    if (!jobcard) return res.status(404).json({ message: "JobCard not found" });
    res.status(200).json({ message: "JobCard deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Return schema fields and types for dynamic table UI
exports.getJobCardSchema = (req, res) => {
  try {
    const paths = JobCard.schema.paths;
    const schema = {};
    Object.keys(paths).forEach((p) => {
      if (p === "__v") return;
      schema[p] = { type: paths[p].instance };
    });
    res.status(200).json(schema);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

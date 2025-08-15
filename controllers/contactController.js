const Contact = require("../models/Contact");
const { Parser } = require("json2csv");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.submitContact = async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();

    // Send email notification
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL,
      subject: "New Contact Form Submission",
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${req.body.name}</p>
        <p><strong>Email:</strong> ${req.body.email}</p>
        <p><strong>Phone:</strong> ${req.body.phone}</p>
        <p><strong>Message:</strong> ${req.body.message}</p>
      `,
    });

    res.status(201).json({
      message: "Contact form submitted successfully",
      contact,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllContacts = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) {
      query.status = status;
    }
    const contacts = await Contact.find(query).sort({ createdAt: -1 });
    res.status(200).json({ contacts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createContact = async (req, res) => {
  try {
    const contact = await Contact.create(req.body);
    res.status(201).json(contact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    res.status(200).json(contact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    res.status(200).json({ message: "Contact deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateContactStatus = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
        replyMessage: req.body.replyMessage,
        repliedAt: req.body.status === "replied" ? Date.now() : undefined,
      },
      { new: true }
    );

    if (req.body.status === "replied" && req.body.replyMessage) {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: contact.email,
        subject: "Response to your inquiry",
        html: req.body.replyMessage,
      });
    }

    res.status(200).json(contact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.exportContactsCSV = async (req, res) => {
  try {
    const contacts = await Contact.find({});
    const csvFields = ["name", "email", "budget", "phone", "message"];
    const json2csvParser = new Parser({ fields: csvFields });
    const csvData = json2csvParser.parse(contacts);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=contacts.csv");
    res.status(200).send(csvData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const FAQ = require("../models/FAQ");

exports.getAllFAQs = async (req, res) => {
  try {
    // const { category } = req.query;
    // let query = { isActive: true };

    // if (category) {
    //   query.category = category;
    // }

    // const faqs = await FAQ.find(query).sort({ displayOrder: 1 });
    const faqs = await FAQ.find({ isActive: true }).sort({ displayOrder: 1 });

    res.status(200).json(faqs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createFAQ = async (req, res) => {
  try {
    const faq = new FAQ(req.body);
    const savedFAQ = await faq.save();
    res.status(201).json(savedFAQ);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }
    res.status(200).json(faq);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }
    res.status(200).json({ message: "FAQ deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateFAQOrder = async (req, res) => {
  try {
    const updates = req.body.updates; // Array of { id, displayOrder }

    for (const update of updates) {
      await FAQ.findByIdAndUpdate(update.id, {
        displayOrder: update.displayOrder,
        updatedAt: Date.now(),
      });
    }

    res.status(200).json({ message: "Display order updated successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const Newsletter = require("../models/Newsletter");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const path = require("path");

exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    const existingSubscriber = await Newsletter.findOne({ email });

    if (existingSubscriber) {
      return res.status(400).json({ message: "Email already subscribed" });
    }

    const subscriber = await Newsletter.create({ email });
    res.status(201).json(subscriber);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const subscriber = await Newsletter.findByIdAndUpdate(
      req.params.id,
      {
        isSubscribed: false,
        unsubscribedAt: Date.now(),
      },
      { new: true }
    );

    if (!subscriber) {
      return res.status(404).json({ message: "Subscriber not found" });
    }

    res.status(200).json(subscriber);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find().sort({ subscribedAt: -1 });
    res.status(200).json({ subscribers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find({ isSubscribed: true });

    const csvWriter = createCsvWriter({
      path: path.join(__dirname, "../temp/subscribers.csv"),
      header: [
        { id: "email", title: "Email" },
        { id: "subscribedAt", title: "Subscribed Date" },
        { id: "status", title: "Status" },
      ],
    });

    const records = subscribers.map((sub) => ({
      email: sub.email,
      subscribedAt: sub.subscribedAt.toLocaleDateString(),
      status: sub.isSubscribed ? "Subscribed" : "Unsubscribed",
    }));

    await csvWriter.writeRecords(records);

    res.download(path.join(__dirname, "../temp/subscribers.csv"));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const total = await Newsletter.countDocuments();
    const active = await Newsletter.countDocuments({ isSubscribed: true });
    const unsubscribed = await Newsletter.countDocuments({
      isSubscribed: false,
    });

    const lastMonth = await Newsletter.countDocuments({
      subscribedAt: {
        $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      },
    });

    res.status(200).json({
      total,
      active,
      unsubscribed,
      lastMonth,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  metaTitle: {
    type: String,
    trim: true,
    required: true,
  },
  metaDescription: {
    type: String,
    trim: true,
    required: true,
  },
  url: {
    type: String,
    trim: true,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  type: {
    type: String,
    required: true,
    enum: ["Tablet", "Capsule", "Liquid", "Injection"],
  },
  strength: {
    type: String,
  },
  quantity: [
    {
      count: {
        type: Number,
      },
      price: {
        type: Number,
      },
    },
  ],
  description: {
    type: String,
  },
  image: {
    type: String,
  },
  imageName: {
    type: String,
  },
  stockAvailable: {
    type: Boolean,
    default: true,
  },
  faqs: [
    {
      question: {
        type: String,
        // required: true,
      },
      answer: {
        type: String,
        // required: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Medicine", medicineSchema);

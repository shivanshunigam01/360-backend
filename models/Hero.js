const mongoose = require("mongoose");

const heroSchema = new mongoose.Schema({

  heroTitle: {
    type: String,
    required: true,
  },
  heroDescription: {
    type: String,
    required: true,
  },
  checkbox1large: String,
  checkbox1small: String,
  checkbox2large: String,
  checkbox2small: String,
  checkbox3large: String,
  checkbox3small: String,
  bigbuttontext: {
    type: String,
    required: true,
  },
  exploremedicines:[{
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    buttonname: {
      type: String,
      required: true,
    },
  }],
  videourl: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Hero", heroSchema);

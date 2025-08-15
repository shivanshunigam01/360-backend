const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  content: {
    type: String,
  },
  metaDescription: {
    type: String,
  },
  metaTitle: {
    type: String,
  },
  url: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Category", categorySchema);


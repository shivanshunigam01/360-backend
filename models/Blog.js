const { MetadataDirective } = require("@aws-sdk/client-s3");
const { urlencoded } = require("express");
const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  metaTitle: {
    type: String,
    trim: true,
    required: true,
  },
  description: {
    type: String,
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
  content: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  imageName:{
    type:String,
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  author: {
    type: String,
  },
  slug: {
    type: String,
    unique: true,
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

// Generate slug before saving
blogSchema.pre("save", function (next) {
  this.slug = this.title
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, "-")
    .replace(/-+/g, "-");
  next();
});

module.exports = mongoose.model("Blog", blogSchema);

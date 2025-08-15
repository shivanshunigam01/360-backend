const Blog = require("../models/Blog");

exports.getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, tag, search } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (tag) {
      query.tags = tag;
    }

    console.log("Search query:", query);

    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * limit);

    const count = await Blog.countDocuments(query);

    res.status(200).json({
      blogs,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      total: count,
    });
  } catch (error) {
    console.error("Error in getAllBlogs:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ _id: req.params.id });
    if (!blog) {
      console.log("Blog not found");
      return res.status(404).json({ message: "Blog not found" });
    }
    console.log(blog);
    res.status(200).json(blog);
  } catch (error) {
    console.error("Error in getBlogBySlug:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.createBlog = async (req, res) => {
  console.log(req.body)
  try {
    //check if url is already in the database
    if (req.body.url) {
      const temp = await Blog.findOne({ url: req.body.url });
      if (temp && temp._id.toString() !== req.params.id) {
        return res.status(400).json({ message: "URL already exists" });
      }
    }
    const blog = new Blog({
      ...req.body,
      image: req.file ? req.file.path : req.body.image,
    });
    console.log(blog)
    const savedBlog = await blog.save();
    res.status(201).json(savedBlog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    console.log(req.body)
    //check if url is already in the database
    if (req.body.url) {
      const temp = await Blog.findOne({ url: req.body.url });
      if (temp && temp._id.toString() !== req.params.id) {
        return res.status(400).json({ message: "URL already exists" });
      }
    }
    const updateData = {
      ...req.body,
      updatedAt: Date.now(),
    };
    if (req.file) {
      updateData.image = req.file.path;
    }

    const blog = await Blog.findOneAndUpdate(
      { _id: req.params.id },
      updateData,
      { new: true }
    );

    console.log(blog)
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.status(200).json(blog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get blog by url
exports.getBlogByURL = async (req, res) => {
  try {
    const url = req.params.url;
    console.log(url)
    const blog = await Blog.findOne({
      url: url,
    });
    console.log(blog)
    if (!blog) {
      return res.status(404).json({ message: "Blog not found from getblogurl" });
    }
    res.status(200).json(blog);
  }
  catch (error) {
    res.status(500).json({ message: error.message });
  }
}

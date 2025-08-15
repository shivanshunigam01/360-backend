const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");


//all blogs section goes here 
router.get("/", blogController.getAllBlogs);
router.get("/:id", blogController.getBlogBySlug);
router.post("/", auth, upload.single("image"), blogController.createBlog);
router.put("/:id", auth, upload.single("image"), blogController.updateBlog);
router.delete("/:id", auth, blogController.deleteBlog);
router.get("/url/:url", blogController.getBlogByURL);
module.exports = router;

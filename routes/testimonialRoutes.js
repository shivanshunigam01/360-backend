const express = require("express");
const router = express.Router();
const testimonialController = require("../controllers/testimonialController");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/testimonials");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.get("/", testimonialController.getAllTestimonials);
router.post(
  "/",
  auth,
  upload.single("image"),
  testimonialController.createTestimonial
);
router.put(
  "/:id",
  auth,
  upload.single("image"),
  testimonialController.updateTestimonial
);
router.delete("/:id", auth, testimonialController.deleteTestimonial);

module.exports = router;

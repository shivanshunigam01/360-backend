const express = require("express");
const router = express.Router();
const { handleFileUpload } = require("../utils/fileUpload");

router.post(
  "/",
  handleFileUpload("file", "uploads"),
  async (req, res) => {
    try {
      if (!req.fileUrl) {
        return res.status(400).json({
          success: false,
          message: "File upload failed - no URL returned",
        });
      }

      return res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          url: req.fileUrl,
        },
      });
    } catch (error) {
      console.error("Upload route error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error during upload",
      });
    }
  }
);

module.exports = router;

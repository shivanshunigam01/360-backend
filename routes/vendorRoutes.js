const express = require("express");
const router = express.Router();
const validate = require("../middleware/validate.middleware");
const vendorController = require("../controllers/vendorController");
const vendorValidator = require("../validators/vendor.validator");

router.get("/", vendorController.getAllVendors);
router.get("/:id", vendorController.getVendorById);
router.post("/", validate(vendorValidator.createVendor) ,vendorController.createVendor);
router.put("/:id",validate(vendorValidator.updateVendor), vendorController.updateVendor);
router.delete("/:id", vendorController.deleteVendor);

module.exports = router;

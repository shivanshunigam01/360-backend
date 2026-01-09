const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const auth = require("../middleware/auth");

// // Statistics
// router.get("/stats", auth, customerController.getCustomerStats);
// router.get("/birthdays", auth, customerController.getBirthdayCustomers);

// Search and filter
router.get("/search", auth, customerController.searchCustomers);
router.get("/individual", auth, customerController.getIndividualCustomers);
router.get("/corporate", auth, customerController.getCorporateCustomers);

// Get by code, mobile, vehicle
// router.get("/code/:code", auth, customerController.getCustomerByCode);
// router.get("/mobile/:mobileNo", auth, customerController.getCustomerByMobile);
// router.get("/vehicle/:regNo", auth, customerController.getCustomerByVehicle);

// CRUD operations
router.get("/", auth, customerController.getAllCustomers);
router.get("/:id", auth, customerController.getCustomerById);
router.post("/", auth, customerController.createCustomer);
router.put("/:id", auth, customerController.updateCustomer);
router.delete("/:id", auth, customerController.deleteCustomer);

// Vehicle operations
// router.post("/:id/vehicles", auth, customerController.addVehicle);
// router.delete("/:id/vehicles/:regNo", auth, customerController.removeVehicle);

// Credit and status
// router.patch("/:id/credit", auth, customerController.updateCreditBalance);
// router.patch("/:id/blacklist", auth, customerController.toggleBlacklist);


//active or inactive customer
router.patch("/:id/active", auth, customerController.toggleActiveCustomer);
router.patch("/:id/inactive", auth, customerController.toggleInactiveCustomer);

module.exports = router;

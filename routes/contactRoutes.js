const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");
const auth = require("../middleware/auth");

router.get("/", contactController.getAllContacts);
router.post("/create", contactController.createContact); //this will create the contact on the admin panel
router.put("/:id", contactController.updateContact);
router.delete("/:id", contactController.deleteContact);
router.get("/exportCSV", contactController.exportContactsCSV);
router.get("/:id", contactController.getContactById);

module.exports = router;

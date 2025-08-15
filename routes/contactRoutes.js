const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");
const auth = require("../middleware/auth");

router.get("/", auth, contactController.getAllContacts);
router.post("/create", contactController.createContact);
router.put("/:id", auth, contactController.updateContact);
router.delete("/:id", auth, contactController.deleteContact);
router.get("/exportCSV", auth, contactController.exportContactsCSV);

module.exports = router;

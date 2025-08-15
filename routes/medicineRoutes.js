const express = require("express");
const router = express.Router();
const medicineController = require("../controllers/medicineController");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/medicines");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.get("/", medicineController.getAllMedicines);
router.get("/categories", medicineController.getMedicineCategory);  // New endpoint
router.get("/:category", medicineController.getMedicinesByCategoryId);
router.post("/medicineCategory", medicineController.addMedicineCategory);
router.get("/:id", medicineController.getMedicineById);
router.get("/url/:url", medicineController.getMedicineByURL);
router.get("/medicineCategory/url/:url", medicineController.getMedicineCategoryByURL);
router.get("/medicineCategory/id/:id", medicineController.getMedicineCategoryById);
router.post(
  "/",
  auth,
  upload.single("image"),
  medicineController.createMedicine
);
router.put(
  "/:id",
  auth,
  upload.single("image"),
  medicineController.updateMedicine
);
router.put(
  "/medicineCategory/:category",
  medicineController.updateMedicineCategory
);
router.delete(
  "/medicineCategory/:category",
  medicineController.deleteMedicineCategory
);
router.delete("/:id", auth, medicineController.deleteMedicine);

module.exports = router;

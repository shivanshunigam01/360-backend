const Medicine = require("../models/Medicine");
const Category = require("../models/Category");

exports.getAllMedicines = async (req, res) => {
  try {
    const { category, stockAvailable, type, search } = req.query;
    let query = {};

    if (category) query.category = category;
    if (stockAvailable) query.stockAvailable = stockAvailable === "true";
    if (type) query.type = type;
    if (search) query.name = { $regex: new RegExp(search, "i") };
    const medicines = await Medicine?.find()?.populate("category");
    // console.log(medicines, "medicines");
    const medicineByCategory = medicines.filter(
      (medicine) => medicine?.category?.url === category
    );
    // console.log(medicineByCategory, "medicineByCategory");
    res.status(200).json(medicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMedicinesByCategoryId= async(req,res)=>{
  try{
    const category= req.params.category;
    console.log(category);
    const medicines= await Medicine.find({category: category}).populate("category");
    if(!medicines){
      return res.status(404).json({message: "Medicines not found"});
    }
    res.status(200).json(medicines);
  }catch(error){
    res.status(500).json({message: error.message});
  }
}

exports.getMedicineCategory = async (req, res) => {
  try {
    const temp = await Category.find({});
    console.log('Categories from DB:', temp);
    
    if (!temp) {
      return res.status(404).json({ message: "No categories found" });
    }
    
    res.status(200).json(temp);
  } catch (error) {
    console.error('Error in getMedicineCategory:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMedicineCategoryById = async (req, res) => {
  try {
    const category= await Category.findOne({
      _id: req.params.id,
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMedicineCategoryByURL = async (req, res) => {
  try {
    const {url} = req.params;
    console.log(url);
    const category = await Category.findOne({
      url: url,
    });
    console.log(category);
    if (!category) {
      return res
        .status(404)
        .json({ message: "Category not found from getmedicineurl" });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addMedicineCategory = async (req, res) => {
  const { category, metaTitle , url } = req.body;
  console.log(category);
  if (!category) {
    return res
      .status(400)
      .json({ success: false, message: "Category name is required" });
  }

  try {
    const existingCategory = await Category.findOne({ name: category });
    if (existingCategory) {
      return res
        .status(400)
        .json({ success: false, message: "Category name already exists" });
    }

    const newCategory = new Category({
      name: category,
      metaTitle: metaTitle,
      url: url
    });
    await newCategory.save();

    return res
      .status(201)
      .json({ success: true, message: "Category added successfully" });
  } catch (error) {
    console.error("Error adding category:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getMedicineById = async (req, res) => {
  try {
    const medicineNameWithoutDash = req.params.id;
    console.log(medicineNameWithoutDash)
    const medicine = await Medicine.findOne({
      name: medicineNameWithoutDash,
    }).populate("category");
    console.log(medicine)
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    res.status(200).json(medicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMedicineByURL = async(req,res)=>{
  try{
    console.log(req.params.url);
    const url= req.params;
    const medicine= await Medicine.findOne({
      url: req.params.url,
    }).populate("category");
    // console.log(medicine)
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found from getmedicineurl" });
    }
    res.status(200).json(medicine);
  }catch(error){
    console.log(req.params.url);
    res.status(500).json({ message: error.message, url: req.params.url });
  }
}
exports.createMedicine = async (req, res) => {
  try {
    // Check if the URL already exists
    if (req.body.url) {
      const temp = await Medicine.findOne({ url: req.body.url });
      if (temp && temp._id.toString() !== req.params.id) {
        return res.status(400).json({ message: "URL already exists" });
      }
    }
    const medicineData = {
      ...req.body,
      image: req.file ? `/uploads/medicines/${req.file.filename}` : null,
    };

    // Parse quantity from string to array of objects
    if (req.body.quantity) {
      medicineData.quantity = JSON.parse(req.body.quantity);
    }

    // Parse faqs from string to array of objects
    if (req.body.faqs) {
      medicineData.faqs = JSON.parse(req.body.faqs);
    }

    // Convert string numbers to actual numbers
    if (req.body.price) medicineData.price = Number(req.body.price);
    if (req.body.stock) medicineData.stock = Number(req.body.stock);

    //check for category also
    console.log(medicineData.category, "medicineData.category");
    const category = await Category.findOne({ _id: medicineData.category });
    console.log(category, "category");
    if (!category) {
      return res.status(400).json({ message: "Category not found" });
    }
    medicineData.category = category._id;
    console.log(medicineData, "medicineData");
    console.log(category, "category");

    const medicine = new Medicine(medicineData);
    console.log(medicine, "medicine");
    const savedMedicine = await medicine.save();
    res.status(201).json(savedMedicine);
  } catch (error) {
    console.error("Error creating medicine:", error);
    res.status(400).json({ message: error.message });
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    // Check if the URL already exists
    if (req.body.url) {
      const temp = await Medicine.findOne({ url: req.body.url });
      console.log(temp, "temp");
      if (temp && temp._id.toString() !== req.params.id) {
        return res.status(400).json({ message: "URL already exists" });
      }
    }
    const medicineData = {
      ...req.body,
    };

    if (req.file) {
      medicineData.image = `/uploads/medicines/${req.file.filename}`;
    }

    // Parse quantity from string to array of objects
    if (req.body.quantity) {
      medicineData.quantity = JSON.parse(req.body.quantity);
    }

    // Parse faqs from string to array of objects
    if (req.body.faqs) {
      medicineData.faqs = JSON.parse(req.body.faqs);
    }

    // Convert string numbers to actual numbers
    if (req.body.price) medicineData.price = Number(req.body.price);
    if (req.body.stock) medicineData.stock = Number(req.body.stock);
    const category = await Category.findOne({ name: medicineData.category });
    if (!category) {
      return res.status(400).json({ message: "Category not found" });
    }
    medicineData.category = category._id;
    console.log(medicineData, "medicineData");
    console.log(category, "category");

    const medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.id},
      medicineData,
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    res.json(medicine);
  } catch (error) {
    console.error("Error updating medicine:", error);
    res.status(400).json({ message: error.message });
  }
};

exports.updateMedicineCategory = async (req, res) => {
  try {
    const { category } = req.params;
    console.log(req.body, "req.body");
    const { metaDescription, content, metaTitle, url, name } = req.body;
    const updatedCategory = await Category.findOneAndUpdate(
      { _id: category },
      { 
        content: content,
        metaTitle: metaTitle,
        metaDescription: metaDescription,
        url: url,
        name: name
       },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }


    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMedicineCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const deletedCategory = await Category.findOneAndDelete({ _id: category });
    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    res.status(200).json({ message: "Medicine deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a helper function to validate the medicine type
const isValidMedicineType = (type) => {
  const validTypes = ["Tablet", "Capsule", "Syrup", "Injection"];
  return validTypes.includes(type);
};

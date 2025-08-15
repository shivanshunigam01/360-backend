const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");
const Medicine = require("../models/Medicine");

async function uploadMedicines() {
  try {
    // Connect to MongoDB
    await mongoose.connect("mongodb://localhost:27017/pharmacy", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Read the all.json file
    const dataPath = path.join(__dirname, "..", "data", "all.json");
    const data = await fs.readFile(dataPath, "utf8");
    const medicines = JSON.parse(data);

    console.log(`Found ${medicines.length} medicines to upload`);

    // Prepare medicines for upload
    const preparedMedicines = medicines.map((med) => ({
      name: med.name,
      category: med.category,
      type: med.type,
      description: med.description || "",
      strength: med.strength,
      quantity: [
        {
          count: 100, // Default stock count
          price: Math.floor(Math.random() * (1000 - 50 + 1)) + 50, // Random price between 50 and 1000
        },
      ],
      stockAvailable: true,
      image: "", // Default empty image
    }));

    // Delete existing medicines
    await Medicine.deleteMany({});
    console.log("Cleared existing medicines");

    // Insert new medicines
    const result = await Medicine.insertMany(preparedMedicines);
    console.log(`Successfully uploaded ${result.length} medicines`);

    // Log some sample data
    console.log("\nSample medicines uploaded:");
    console.log(result.slice(0, 3));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Run the function
uploadMedicines();

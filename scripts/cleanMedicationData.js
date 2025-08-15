const fs = require("fs").promises;
const path = require("path");

async function cleanMedicationData() {
  try {
    // Using relative path from scripts folder to medication_data
    const dataDir = path.join(
      __dirname,
      "..",
      "medication_data",
      "medication_data"
    );

    console.log("Looking for files in:", dataDir); // Debug log

    // Get all JSON files
    const files = await fs.readdir(dataDir);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    console.log(`Found ${jsonFiles.length} JSON files`); // Debug log

    for (const file of jsonFiles) {
      console.log(`Processing ${file}...`);
      const filePath = path.join(dataDir, file);

      // Read current file content
      const data = await fs.readFile(filePath, "utf8");
      const medications = JSON.parse(data);

      // Process each medication object
      const cleanedMedications = medications.map((med) => {
        // Create new object with desired changes
        const cleanedMed = {
          name: med.name,
          category: med.category,
          type: med.form, // Rename 'form' to 'type'
          description: "", // Empty description
          strength: med.strength,
        };

        return cleanedMed;
      });

      // Write updated data back to file
      await fs.writeFile(
        filePath,
        JSON.stringify(cleanedMedications, null, 4),
        "utf8"
      );

      console.log(`Completed ${file}`);
    }

    console.log("All files processed successfully");
  } catch (error) {
    console.error("Error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      path: error.path,
    });
  }
}

// Run the function
cleanMedicationData();

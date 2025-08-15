const fs = require("fs").promises;
const path = require("path");

async function combineAllData() {
  try {
    // Path to medication data directory
    const dataDir = path.join(
      __dirname,
      "..",
      "medication_data",
      "medication_data"
    );

    console.log("Reading files from:", dataDir);

    // Get all JSON files
    const files = await fs.readdir(dataDir);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    console.log(`Found ${jsonFiles.length} JSON files`);

    // Array to store all medications
    let allMedications = [];

    // Process each file
    for (const file of jsonFiles) {
      console.log(`Processing ${file}...`);
      const filePath = path.join(dataDir, file);

      // Read and parse file
      const data = await fs.readFile(filePath, "utf8");
      const medications = JSON.parse(data);

      // Add category from filename if not present
      const category = file.replace("_medications.json", "").replace(/_/g, " ");
      medications.forEach((med) => {
        if (!med.category) {
          med.category = category;
        }
      });

      // Add to main array
      allMedications = allMedications.concat(medications);
    }

    // Sort medications by name
    allMedications.sort((a, b) => a.name.localeCompare(b.name));

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, "..", "data");
    try {
      await fs.mkdir(outputDir);
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
    }

    // Write combined data to all.json
    const outputPath = path.join(outputDir, "all.json");
    await fs.writeFile(
      outputPath,
      JSON.stringify(allMedications, null, 4),
      "utf8"
    );

    console.log(
      `Successfully combined ${allMedications.length} medications into all.json`
    );
    console.log(`Output file: ${outputPath}`);
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
combineAllData();

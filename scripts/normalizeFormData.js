const fs = require("fs").promises;
const path = require("path");
const normalizeForm = require("../utils/normalizeForm");

async function normalizeFormInFiles() {
  const dataDir = path.join(__dirname, "../medication_data");

  try {
    // Get all JSON files
    const files = await fs.readdir(dataDir);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    for (const file of jsonFiles) {
      const filePath = path.join(dataDir, file);

      // Read file content
      const data = await fs.readFile(filePath, "utf8");
      const medications = JSON.parse(data);

      // Normalize form field in each medication
      const normalizedMedications = medications.map((med) => ({
        ...med,
        form: normalizeForm(med.form),
      }));

      // Write back to file
      await fs.writeFile(
        filePath,
        JSON.stringify(normalizedMedications, null, 4),
        "utf8"
      );

      console.log(`Processed ${file}`);
    }

    console.log("All files processed successfully");
  } catch (error) {
    console.error("Error processing files:", error);
  }
}

// Run the function
normalizeFormInFiles();

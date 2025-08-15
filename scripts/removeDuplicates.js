const fs = require("fs").promises;
const path = require("path");

async function removeDuplicates() {
  try {
    // Read all.json
    const filePath = path.join(__dirname, "..", "data", "all.json");
    const data = await fs.readFile(filePath, "utf8");
    const medicines = JSON.parse(data);

    console.log(`Original count: ${medicines.length}`);

    // Use Set to track unique combinations
    const seen = new Set();
    const uniqueMedicines = medicines.filter((medicine) => {
      // Create a unique key combining name and category
      const key = `${medicine.name}|${medicine.category}`;

      // If we haven't seen this combination before, keep it
      if (!seen.has(key)) {
        seen.add(key);
        return true;
      }
      return false;
    });

    console.log(
      `Removed ${medicines.length - uniqueMedicines.length} duplicates`
    );
    console.log(`New count: ${uniqueMedicines.length}`);

    // Sort by name
    uniqueMedicines.sort((a, b) => a.name.localeCompare(b.name));

    // Write back to all.json
    await fs.writeFile(
      filePath,
      JSON.stringify(uniqueMedicines, null, 4),
      "utf8"
    );

    console.log("Successfully removed duplicates and saved to all.json");

    // Log some statistics
    console.log("\nSample unique entries:");
    console.log(uniqueMedicines.slice(0, 3));
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
removeDuplicates();

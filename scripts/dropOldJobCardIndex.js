const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

async function dropOldIndex() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        const db = mongoose.connection.db;
        const collection = db.collection("jobcards");

        // List all indexes
        const indexes = await collection.indexes();
        console.log("\n📋 Current indexes:");
        indexes.forEach((index) => {
            console.log(`  - ${index.name}:`, index.key);
        });

        // Check if the old index exists
        const oldIndexExists = indexes.some((index) => index.name === "jobNumber_1");

        if (oldIndexExists) {
            console.log("\n🗑️  Found old 'jobNumber_1' index. Dropping it...");
            await collection.dropIndex("jobNumber_1");
            console.log("✅ Successfully dropped 'jobNumber_1' index");
        } else {
            console.log("\n✅ No old 'jobNumber_1' index found. Database is clean!");
        }

        // List indexes after cleanup
        const indexesAfter = await collection.indexes();
        console.log("\n📋 Indexes after cleanup:");
        indexesAfter.forEach((index) => {
            console.log(`  - ${index.name}:`, index.key);
        });

        console.log("\n✅ Migration completed successfully!");
    } catch (error) {
        console.error("❌ Error during migration:", error);
        if (error.code === 27) {
            console.log("ℹ️  Index 'jobNumber_1' does not exist (this is fine)");
        } else {
            throw error;
        }
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log("\n🔌 MongoDB connection closed");
        process.exit(0);
    }
}

// Run the migration
dropOldIndex().catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
});


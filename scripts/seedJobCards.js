require("dotenv").config();
const mongoose = require("mongoose");
const JobCard = require("../models/JobCard");

const statuses = ["open", "in_progress", "completed", "closed"];
const assigned = ["Alice", "Bob", "Charlie", "Daisy"];

async function seed() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI not set in .env");
    await mongoose.connect(uri);
    console.log("Connected to MongoDB for seeding");

    // Clear existing
    await JobCard.deleteMany({});

    const samples = Array.from({ length: 30 }).map((_, i) => ({
      jobNumber: `JC-${Date.now()}-${i}`,
      title: `Sample job ${i + 1}`,
      description: `This is a sample job card number ${i + 1}`,
      customer: `Customer ${i % 5}`,
      assignedTo: assigned[i % assigned.length],
      status: statuses[i % statuses.length],
      notes: [
        { text: `Initial note for job ${i + 1}`, author: assigned[i % assigned.length] },
      ],
    }));

    const inserted = await JobCard.insertMany(samples);
    console.log(`Inserted ${inserted.length} jobcards`);
    await mongoose.disconnect();
    console.log("Disconnected after seeding");
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();

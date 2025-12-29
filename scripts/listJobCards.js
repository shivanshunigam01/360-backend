require('dotenv').config();
const mongoose = require('mongoose');
const JobCard = require('../models/JobCard');

async function list() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set in .env');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const docs = await JobCard.find({}).limit(20).sort({ createdAt: -1 }).lean();
    console.log(`Found ${docs.length} jobcards (showing up to 20):\n`);
    docs.forEach((d, i) => {
      console.log(`${i + 1}. ${d.jobNumber} | ${d.title || d.description || ''} | ${d.customer} | ${d.status} | ${d._id}`);
    });

    await mongoose.disconnect();
    console.log('Disconnected');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

list();

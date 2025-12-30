require('dotenv').config();
const mongoose = require('mongoose');
const JobCard = require('../models/JobCard');

async function run() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Create minimal job card
    const job = new JobCard({
      jobNumber: `JC-${Date.now()}`,
      title: 'AC Repair - Avani',
      customer: 'Avani',
      vehicle: 'Swift',
      regNo: 'MH01AV1234',
      description: 'AC not cooling',
      notes: [{ text: 'Created for Avani', author: 'Seeder' }]
    });

    const saved = await job.save();
    console.log('Created job id:', saved._id);

    // Update with more details
    const updates = {
      title: 'AC Repair - Avani (full)',
      vehicleMake: 'Maruti',
      vin: 'VIN1234567890',
      odometer: 45000,
      mobile: '9999999999',
      email: 'avani@example.com',
      description: 'AC not cooling; compressor noise',
      assignedTo: 'Amit Shah',
      status: 'in_progress',
      notes: saved.notes.concat([{ text: 'Updated with full details', author: 'Seeder' }])
    };

    const updated = await JobCard.findByIdAndUpdate(saved._id, updates, { new: true });
    console.log('Updated job:', updated._id);
    console.log(JSON.stringify(updated.toObject(), null, 2));

    await mongoose.disconnect();
    console.log('Disconnected');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
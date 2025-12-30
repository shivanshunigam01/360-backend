require('dotenv').config();
const mongoose = require('mongoose');
const JobCard = require('../models/JobCard');

async function run() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set');
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to DB');

    const rows = await JobCard.find({ customer: /Avani/i }).sort({ createdAt: -1 }).limit(10);
    console.log('Found', rows.length, 'records');
    rows.forEach(r => {
      console.log('---');
      console.log('id:', r._id.toString());
      console.log('jobNumber:', r.jobNumber);
      console.log('title:', r.title);
      console.log('customer:', r.customer);
      console.log('vehicle:', r.vehicle || r.model || '');
      console.log('regNo:', r.regNo || '');
      console.log('vin:', r.vin || '');
      console.log('odometer:', r.odometer || '');
      console.log('mobile:', r.mobile || '');
      console.log('email:', r.email || '');
      console.log('status:', r.status || '');
      console.log('createdAt:', r.createdAt);
      console.log('updatedAt:', r.updatedAt);
    });

    await mongoose.disconnect();
    console.log('Disconnected');
  } catch (e) {
    console.error('Error', e.message || e);
    process.exit(1);
  }
}

run();
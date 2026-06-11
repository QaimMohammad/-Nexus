/** CLI entry: seeds the database configured by MONGODB_URI. Usage: npm run seed */
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const seedDatabase = require('./seedData');

(async () => {
  try {
    await connectDB();
    await seedDatabase();
    await mongoose.disconnect();
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
})();

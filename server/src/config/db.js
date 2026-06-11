const mongoose = require('mongoose');

/**
 * Connects to MongoDB. When MONGODB_URI is not provided (local development
 * without a Mongo install), falls back to an in-memory MongoDB instance so
 * the API is runnable out of the box. Production deployments must set
 * MONGODB_URI (e.g. a MongoDB Atlas connection string).
 */
async function connectDB() {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI must be set in production');
    }
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mem = await MongoMemoryServer.create();
    uri = mem.getUri('business-nexus');
    console.warn('MONGODB_URI not set - using in-memory MongoDB (data is lost on restart)');
  }

  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connectDB;

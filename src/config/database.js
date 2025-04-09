const mongoose = require('mongoose');
const env = require('./env');

/**
 * Configure Mongoose
 */
mongoose.set('strictQuery', false);

/**
 * Connect to MongoDB
 * @returns {Promise} Mongoose connection
 */
const connect = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    
    // Log successful connection
    console.log('MongoDB connected successfully');
    
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

/**
 * Disconnect from MongoDB
 * @returns {Promise} Disconnect result
 */
const disconnect = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

module.exports = {
  connect,
  disconnect,
  connection: mongoose.connection
}; 
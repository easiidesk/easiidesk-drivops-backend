const { MongoClient } = require('mongodb');

let cachedDb = null;
let cachedClient = null;

class MongoDBService {
  constructor() {
    // Environment variables should be loaded from .env file
    this.uri = process.env.MONGODB_URI;
    
    if (!this.uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    this.dbName = this.uri.split('/').pop().split('?')[0] || 'easiidesk-transportation';
    console.log('MongoDB Service initialized with database:', this.dbName);
  }

  async connect() {
    if (cachedDb && cachedClient) {
      try {
        // Test the connection
        await cachedClient.db().admin().ping();
        return { db: cachedDb, client: cachedClient };
      } catch (error) {
        console.log('Cached connection failed, creating new connection');
        cachedDb = null;
        cachedClient = null;
      }
    }

    try {
      console.log('Creating new MongoDB connection');
      // Updated connection options
      const options = {
        maxPoolSize: 1,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      };

      const client = await MongoClient.connect(this.uri, options);
      const db = client.db(this.dbName);

      cachedDb = db;
      cachedClient = client;

      console.log('MongoDB connection established successfully');
      return { db, client };
    } catch (error) {
      console.error('MongoDB Connection Error:', error);
      throw new Error(`Failed to connect to database: ${error.message}`);
    }
  }
  async findOne(collection, filter, excludeFields = []) {
    try {
      console.log(`Finding document in collection ${collection}:`, filter);
      const { db } = await this.connect();
      
      // Create projection object to exclude fields
      const projection = {};
      for (const field of excludeFields) {
        projection[field] = 0;
      }

      const result = await db.collection(collection)
        .findOne(filter, { projection });
        
      console.log('FindOne result:', result ? 'Document found' : 'Document not found');
      return result;
    } catch (error) {
      console.error(`MongoDB findOne Error: ${error.message}`);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  async find(collection, filter = {}, options = {},projection = {}) {
    try {
      const { db } = await this.connect();
      if(options.limit){
        return await db.collection(collection)
        .find(filter)
        .skip(options.skip || 0)
        .limit(options.limit || 10)
        .sort(options.sort || {})
        .project(projection)
        .toArray();
      }else{
        return await db.collection(collection)
        .find(filter)
        .sort(options.sort || {})
        .project(projection)
        .toArray();
      }
    } catch (error) {
      console.error(`MongoDB find Error: ${error.message}`);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  async insertOne(collection, document) {
    try {
      const { db } = await this.connect();
      return await db.collection(collection).insertOne(document);
    } catch (error) {
      console.error(`MongoDB insertOne Error: ${error.message}`);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  async updateOne(collection, filter, update) {
    try {
      const { db } = await this.connect();
      return await db.collection(collection).updateOne(filter, update);
    } catch (error) {
      console.error(`MongoDB updateOne Error: ${error.message}`);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }
  async updateMany(collection, filter, update, options = {}) {
    try {
      const { db } = await this.connect();
      return await db.collection(collection).updateMany(filter, update, options);
    } catch (error) {
      console.error(`MongoDB updateMany Error: ${error.message}`);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }
  

  async deleteOne(collection, filter) {
    try {
      const { db } = await this.connect();
      return await db.collection(collection).deleteOne(filter);
    } catch (error) {
      console.error(`MongoDB deleteOne Error: ${error.message}`);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }
  async count(collection, filter) {
    try {
      const { db } = await this.connect();
      return await db.collection(collection).countDocuments(filter);
    } catch (error) {
      console.error(`MongoDB count Error: ${error.message}`);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }
  async aggregate(collection, pipeline) {
    try {
      const { db } = await this.connect();
      return await db.collection(collection).aggregate(pipeline).toArray();
    } catch (error) {
      console.error(`MongoDB aggregate Error: ${error.message}`);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }
  
  
}

module.exports = new MongoDBService(); 
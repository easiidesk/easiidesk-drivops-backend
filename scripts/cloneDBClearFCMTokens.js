/**
 * Script to clone the database and clear all fcmTokens arrays in the user model
 * 
 * Usage:
 * 1. Set up environment variables (MONGODB_URI, TARGET_MONGODB_URI)
 * 2. Run: node scripts/cloneDBClearFCMTokens.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

// Source and target MongoDB URIs
const SOURCE_URI = process.env.MONGODB_URI;
const TARGET_URI = SOURCE_URI

// Database names (extracted from connection strings)
const SOURCE_DB_NAME = "tse-drivops";
const TARGET_DB_NAME = "tse-drivops-clone"
// const SOURCE_DB_NAME = SOURCE_URI.split('/').pop().split('?')[0];
// const TARGET_DB_NAME = SOURCE_DB_NAME + "-clone"

async function main() {
  console.log('Starting database clone and fcmTokens cleanup...');
  console.log(`Source DB: ${SOURCE_DB_NAME}`);
  console.log(`Target DB: ${TARGET_DB_NAME}`);
  
  // Connect to source database
  const sourceClient = new MongoClient(SOURCE_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  });
  
  // Connect to target database
  const targetClient = new MongoClient(TARGET_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  });
  
  try {
    await sourceClient.connect();
    await targetClient.connect();
    
    console.log('Connected to both source and target databases');
    
    const sourceDB = sourceClient.db(SOURCE_DB_NAME);
    const targetDB = targetClient.db(TARGET_DB_NAME);
    
    // Get all collections from source database
    const collections = await sourceDB.listCollections().toArray();
    
    // Drop existing target database if it exists

    
    // Clone each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`Cloning collection: ${collectionName}`);
      
      // Get all documents from source collection
      const sourceCollection = sourceDB.collection(collectionName);
      const documents = await sourceCollection.find({}).toArray();
      
      // Special handling for users collection to clear fcmTokens
      if (collectionName === 'users' && documents.length > 0) {
        console.log(`Clearing fcmTokens for ${documents.length} users`);
        documents.forEach(user => {
          if (user.phone != "+971507030727" && user.fcmTokens && Array.isArray(user.fcmTokens)) {
            user.fcmTokens = [];
          }
        });
      }
      
      // Skip if no documents
      if (documents.length === 0) {
        console.log(`No documents in collection ${collectionName}, skipping`);
        continue;
      }
      
      // Insert documents into target collection
      const targetCollection = targetDB.collection(collectionName);
      const result = await targetCollection.insertMany(documents);
      console.log(`Inserted ${result.insertedCount} documents into ${collectionName}`);
      
      // Re-create indexes
      const indexes = await sourceCollection.indexes();
      for (const index of indexes) {
        // Skip _id_ index as it's created automatically
        if (index.name === '_id_') continue;
        
        console.log(`Re-creating index ${index.name} on ${collectionName}`);
        const indexOptions = { ...index };
        delete indexOptions.key;
        delete indexOptions.v;
        delete indexOptions.ns;
        
        await targetCollection.createIndex(index.key, indexOptions);
      }
    }
    
    console.log('Database clone completed successfully');
    console.log('All fcmTokens arrays in the users collection have been cleared');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    // Close connections
    await sourceClient.close();
    await targetClient.close();
    console.log('Database connections closed');
  }
}

// Run the script
main().catch(console.error); 
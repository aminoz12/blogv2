import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://blog:admin123@cluster0.5lryebj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = process.env.MONGO_DB_NAME || 'mad2moi_blog';

async function initCommentsCollection() {
  let client;
  try {
    console.log('🔧 Initializing comments collection in MongoDB...');
    
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      tls: true
    });
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    console.log('✅ Connected to MongoDB Atlas!');
    console.log(`🌐 Using database: ${DB_NAME}`);
    
    // Create comments collection with sample data
    const commentsCollection = db.collection('comments');
    
    // Check if collection already exists
    const collections = await db.listCollections({ name: 'comments' }).toArray();
    
    if (collections.length === 0) {
      console.log('📝 Creating comments collection...');
      
      // Create the collection by inserting a sample document
      const sampleComment = {
        _id: new (await import('mongodb')).ObjectId(),
        id: 1,
        article_slug: 'sample-article',
        article_title: 'Sample Article',
        author_name: 'System',
        author_email: 'system@example.com',
        content: 'This is a sample comment to initialize the collection.',
        status: 'approved',
        parent_id: null,
        ip_address: '127.0.0.1',
        user_agent: 'MongoDB Initialization Script',
        notify_replies: false,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await commentsCollection.insertOne(sampleComment);
      console.log('✅ Comments collection created with sample data');
      
      // Remove the sample comment
      await commentsCollection.deleteOne({ _id: sampleComment._id });
      console.log('✅ Sample comment removed');
      
    } else {
      console.log('✅ Comments collection already exists');
    }
    
    // Create indexes for better performance
    console.log('📊 Creating indexes...');
    
    try {
      await commentsCollection.createIndex({ article_slug: 1 });
      console.log('✅ Index created: article_slug');
    } catch (error) {
      console.log('ℹ️ Index article_slug may already exist');
    }
    
    try {
      await commentsCollection.createIndex({ status: 1 });
      console.log('✅ Index created: status');
    } catch (error) {
      console.log('ℹ️ Index status may already exist');
    }
    
    try {
      await commentsCollection.createIndex({ created_at: 1 });
      console.log('✅ Index created: created_at');
    } catch (error) {
      console.log('ℹ️ Index created_at may already exist');
    }
    
    try {
      await commentsCollection.createIndex({ id: 1 });
      console.log('✅ Index created: id');
    } catch (error) {
      console.log('ℹ️ Index id may already exist');
    }
    
    // Show collection stats
    const count = await commentsCollection.countDocuments();
    console.log(`📊 Comments collection now has ${count} documents`);
    
    console.log('\n🎉 Comments collection initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing comments collection:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\n✅ Connection closed');
    }
  }
}

initCommentsCollection();

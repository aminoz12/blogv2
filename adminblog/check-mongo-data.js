import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🔧 Environment variables:');
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('MONGO_DB_NAME:', process.env.MONGO_DB_NAME);

// Use connection details from .env file
const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://blog:admin123@cluster0.5lryebj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = process.env.MONGO_DB_NAME || 'mad2moi_blog';

async function checkMongoData() {
  let client;
  try {
    console.log('\n🔍 Checking MongoDB Atlas database...');
    
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
    
    // List all collections
    console.log('\n📚 Collections:');
    const collections = await db.listCollections().toArray();
    collections.forEach((collection, index) => {
      console.log(`  ${index + 1}. ${collection.name}`);
    });
    
    // Check articles
    console.log('\n📄 Articles:');
    try {
      const articlesCount = await db.collection('articles').countDocuments();
      console.log(`  Total: ${articlesCount}`);
      
      if (articlesCount > 0) {
        const articles = await db.collection('articles').find({}).limit(5).toArray();
        articles.forEach((article, index) => {
          console.log(`    ${index + 1}. "${article.title || 'Untitled'}" - Status: ${article.status || 'Unknown'}`);
        });
      }
    } catch (error) {
      console.log('  ❌ Error accessing articles:', error.message);
    }
    
    // Check categories
    console.log('\n📂 Categories:');
    try {
      const categoriesCount = await db.collection('categories').countDocuments();
      console.log(`  Total: ${categoriesCount}`);
      
      if (categoriesCount > 0) {
        const categories = await db.collection('categories').find({}).toArray();
        categories.forEach((category, index) => {
          console.log(`    ${index + 1}. "${category.name || 'Unnamed'}" - Active: ${category.is_active ? 'Yes' : 'No'}`);
        });
      }
    } catch (error) {
      console.log('  ❌ Error accessing categories:', error.message);
    }
    
  } catch (error) {
    console.error('\n❌ Connection Error:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\n✅ Connection closed');
    }
  }
}

checkMongoData();
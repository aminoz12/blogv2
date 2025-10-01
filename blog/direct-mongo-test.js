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

async function directMongoTest() {
  let client;
  try {
    console.log('\n🔍 Testing direct MongoDB connection...');
    
    // Try different connection options
    const connectionOptions = [
      { 
        name: "Basic SSL options",
        options: { 
          tls: true
        }
      },
      {
        name: "No SSL options",
        options: {}
      }
    ];
    
    for (const { name, options } of connectionOptions) {
      try {
        console.log(`\n🔄 Trying ${name}...`);
        client = new MongoClient(MONGODB_URI, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          ...options
        });
        
        await client.connect();
        console.log(`✅ ${name} - Connection successful!`);
        
        const db = client.db(DB_NAME);
        console.log(`🌐 Using database: ${DB_NAME}`);
        
        // Test with a simple ping
        await client.db('admin').command({ ping: 1 });
        console.log('✅ Ping successful');
        
        // List collections
        const collections = await db.listCollections().toArray();
        console.log('📚 Collections found:', collections.map(c => c.name));
        
        // Check articles collection
        if (collections.some(c => c.name === 'articles')) {
          const articlesCount = await db.collection('articles').countDocuments();
          console.log(`📄 Articles count: ${articlesCount}`);
          
          if (articlesCount > 0) {
            const sampleArticles = await db.collection('articles').find({}).limit(3).toArray();
            console.log('📝 Sample articles:');
            sampleArticles.forEach((article, i) => {
              console.log(`  ${i+1}. "${article.title || 'Untitled'}" - Status: ${article.status || 'Unknown'}`);
            });
          }
        }
        
        // Check categories collection
        if (collections.some(c => c.name === 'categories')) {
          const categoriesCount = await db.collection('categories').countDocuments();
          console.log(`📂 Categories count: ${categoriesCount}`);
          
          if (categoriesCount > 0) {
            const sampleCategories = await db.collection('categories').find({}).limit(3).toArray();
            console.log('🏷️ Sample categories:');
            sampleCategories.forEach((category, i) => {
              console.log(`  ${i+1}. "${category.name || 'Unnamed'}" - Active: ${category.is_active ? 'Yes' : 'No'}`);
            });
          }
        }
        
        await client.close();
        console.log('✅ Connection closed');
        return; // Success, exit the loop
        
      } catch (error) {
        console.log(`❌ ${name} - Failed:`, error.message);
        if (client) {
          await client.close();
          client = null;
        }
      }
    }
    
    console.log('\n❌ All connection attempts failed');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

directMongoTest();
// Script to check current article state and fix titles properly
import { initializeDatabaseFactory, executeQueryFactory, closeDatabaseFactory } from './src/utils/databaseFactory.js';

async function checkCurrentState() {
  try {
    console.log('🔍 Checking current article state...');
    
    // Initialize database connection
    await initializeDatabaseFactory();
    
    // Get all articles
    const articles = await executeQueryFactory('SELECT id, title, slug, content FROM articles ORDER BY id');
    
    console.log(`📄 Found ${articles.length} articles:`);
    
    articles.forEach((article, index) => {
      console.log(`\n--- Article ${index + 1} ---`);
      console.log(`ID: ${article.id}`);
      console.log(`Title: ${article.title}`);
      console.log(`Slug: ${article.slug}`);
      console.log(`Content preview: ${article.content.substring(0, 100)}...`);
    });
    
  } catch (error) {
    console.error('❌ Error checking articles:', error);
  } finally {
    await closeDatabaseFactory();
  }
}

checkCurrentState();








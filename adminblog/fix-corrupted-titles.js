// Script to fix corrupted article titles in the database
import { initializeDatabaseFactory, executeQueryFactory, closeDatabaseFactory } from './src/utils/databaseFactory.js';

async function fixCorruptedTitles() {
  try {
    console.log('🔧 Fixing corrupted article titles...');
    
    // Initialize database connection
    await initializeDatabaseFactory();
    
    // Get all articles with corrupted titles (titles that look like JSON image objects)
    const articles = await executeQueryFactory('SELECT id, title, featured_image FROM articles WHERE title LIKE \'{"url":%\'');
    
    console.log(`📄 Found ${articles.length} articles with corrupted titles`);
    
    for (const article of articles) {
      console.log(`\n🔍 Processing article ${article.id}:`);
      console.log(`   Corrupted title: ${article.title}`);
      console.log(`   Featured image: ${article.featured_image}`);
      
      // Extract the actual title from the content or create a default one
      let actualTitle = '';
      
      // Try to get the title from the content (first line or first 50 characters)
      const contentQuery = 'SELECT content FROM articles WHERE id = ?';
      const contentResult = await executeQueryFactory(contentQuery, [article.id]);
      
      if (contentResult.length > 0 && contentResult[0].content) {
        const content = contentResult[0].content;
        // Remove HTML tags and get first line
        const plainText = content.replace(/<[^>]*>/g, '').trim();
        const firstLine = plainText.split('\n')[0].trim();
        
        if (firstLine.length > 0) {
          actualTitle = firstLine.substring(0, 100); // Limit to 100 characters
          console.log(`   Extracted title from content: ${actualTitle}`);
        }
      }
      
      // If no title could be extracted, create a default one
      if (!actualTitle) {
        actualTitle = `Article ${article.id}`;
        console.log(`   Using default title: ${actualTitle}`);
      }
      
      // Update the article with the correct title
      await executeQueryFactory(
        'UPDATE articles SET title = ? WHERE id = ?',
        [actualTitle, article.id]
      );
      
      console.log(`   ✅ Updated title to: ${actualTitle}`);
    }
    
    console.log('\n✅ All corrupted titles fixed successfully');
    
  } catch (error) {
    console.error('❌ Error fixing corrupted titles:', error);
  } finally {
    await closeDatabaseFactory();
  }
}

fixCorruptedTitles();








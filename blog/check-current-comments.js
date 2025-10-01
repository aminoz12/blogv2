import { executeQueryFactory } from './src/utils/databaseFactory.js';

async function checkCurrentComments() {
  try {
    console.log('🔍 Checking current comments...');
    
    // Get all comments
    const allComments = await executeQueryFactory('SELECT * FROM comments ORDER BY created_at DESC');
    console.log(`\n📊 Found ${allComments.length} comments:`);
    
    allComments.forEach((comment, index) => {
      console.log(`\nComment ${index + 1}:`);
      console.log(`  ID: ${comment.id}`);
      console.log(`  Article slug: "${comment.article_slug}"`);
      console.log(`  Author: "${comment.author_name}"`);
      console.log(`  Content: "${comment.content.substring(0, 50)}..."`);
      console.log(`  Status: "${comment.status}"`);
      console.log(`  Created: ${comment.created_at}`);
    });
    
    // Get all articles
    const articles = await executeQueryFactory('SELECT slug, title FROM articles ORDER BY created_at DESC LIMIT 5');
    console.log(`\n📊 Found ${articles.length} articles:`);
    
    articles.forEach((article, index) => {
      console.log(`\nArticle ${index + 1}:`);
      console.log(`  Slug: "${article.slug}"`);
      console.log(`  Title: "${article.title}"`);
    });
    
    // Test comment fetching for each article
    console.log('\n🧪 Testing comment fetch for each article:');
    for (const article of articles) {
      const commentsForArticle = await executeQueryFactory(
        'SELECT * FROM comments WHERE article_slug = ? ORDER BY created_at ASC',
        [article.slug]
      );
      console.log(`  Article "${article.slug}": ${commentsForArticle.length} comments`);
    }
    
  } catch (error) {
    console.error('❌ Error checking comments:', error);
  }
}

checkCurrentComments();

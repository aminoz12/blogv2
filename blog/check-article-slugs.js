import { executeQueryFactory } from './src/utils/databaseFactory.js';

async function checkArticleSlugs() {
  try {
    console.log('🔍 Checking article slugs...');
    
    // Get all articles
    const articles = await executeQueryFactory('SELECT slug, title FROM articles ORDER BY created_at DESC LIMIT 10');
    console.log(`\n📊 Found ${articles.length} articles:`);
    articles.forEach((article, index) => {
      console.log(`  ${index + 1}. Slug: "${article.slug}", Title: "${article.title}"`);
    });
    
    // Get all comments with their slugs
    const comments = await executeQueryFactory('SELECT article_slug, author_name, content FROM comments ORDER BY created_at DESC');
    console.log(`\n📊 Found ${comments.length} comments:`);
    comments.forEach((comment, index) => {
      console.log(`  ${index + 1}. Slug: "${comment.article_slug}", Author: "${comment.author_name}", Content: "${comment.content.substring(0, 30)}..."`);
    });
    
    // Check if any comments match actual article slugs
    if (articles.length > 0 && comments.length > 0) {
      const articleSlugs = articles.map(a => a.slug);
      const commentSlugs = comments.map(c => c.article_slug);
      
      console.log('\n🔍 Matching comments to articles:');
      for (const article of articles) {
        const matchingComments = comments.filter(c => c.article_slug === article.slug);
        console.log(`  Article "${article.slug}": ${matchingComments.length} comments`);
        matchingComments.forEach(comment => {
          console.log(`    - ${comment.author_name}: ${comment.content.substring(0, 30)}...`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking article slugs:', error);
  }
}

checkArticleSlugs();

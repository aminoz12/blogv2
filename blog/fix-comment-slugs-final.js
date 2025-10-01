import { executeQueryFactory } from './src/utils/databaseFactory.js';

async function fixCommentSlugsFinal() {
  try {
    console.log('🔧 Fixing comment slugs - Final fix...');
    
    // Get all comments with wrong slugs
    const wrongSlugComments = await executeQueryFactory('SELECT * FROM comments WHERE article_slug = "{postSlug}"');
    console.log(`Found ${wrongSlugComments.length} comments with wrong slugs`);
    
    if (wrongSlugComments.length === 0) {
      console.log('✅ No comments with wrong slugs found');
      return;
    }
    
    // Get all articles to find matching slugs
    const articles = await executeQueryFactory('SELECT slug, title FROM articles ORDER BY created_at DESC LIMIT 10');
    console.log(`Found ${articles.length} articles`);
    
    if (articles.length === 0) {
      console.log('❌ No articles found to match comments');
      return;
    }
    
    // Update comments with the first article slug (most recent)
    const targetSlug = articles[0].slug;
    const targetTitle = articles[0].title;
    
    console.log(`🎯 Updating comments to match article: "${targetSlug}"`);
    
    for (const comment of wrongSlugComments) {
      console.log(`\n🔧 Updating comment ID ${comment.id}:`);
      console.log(`  Original slug: "${comment.article_slug}"`);
      console.log(`  New slug: "${targetSlug}"`);
      console.log(`  Author: "${comment.author_name}"`);
      
      const updateQuery = `
        UPDATE comments 
        SET article_slug = ?, article_title = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await executeQueryFactory(updateQuery, [targetSlug, targetTitle, comment.id]);
      console.log(`  ✅ Comment ID ${comment.id} updated`);
    }
    
    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const updatedComments = await executeQueryFactory('SELECT * FROM comments WHERE article_slug = ?', [targetSlug]);
    console.log(`Found ${updatedComments.length} comments for article "${targetSlug}"`);
    
    updatedComments.forEach((comment, index) => {
      console.log(`  ${index + 1}. ${comment.author_name}: ${comment.content.substring(0, 50)}...`);
    });
    
    console.log('\n✅ Comment slugs fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing comment slugs:', error);
  }
}

fixCommentSlugsFinal();

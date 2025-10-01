import { executeQueryFactory } from './src/utils/databaseFactory.js';

async function deleteBadCommentsSimple() {
  try {
    console.log('🗑️ Deleting comments with {postSlug} slugs...');
    
    // Delete all comments with {postSlug} slugs using MongoDB directly
    const result = await executeQueryFactory('DELETE FROM comments WHERE article_slug = "{postSlug}"');
    
    console.log('✅ Bad comments deleted!');
    console.log('📊 Result:', result);
    
    // Check remaining comments
    const remainingComments = await executeQueryFactory('SELECT * FROM comments ORDER BY created_at DESC');
    console.log(`\n📊 Remaining comments: ${remainingComments.length}`);
    
    remainingComments.forEach((comment, index) => {
      console.log(`  ${index + 1}. ${comment.author_name}: ${comment.content.substring(0, 30)}... (Slug: ${comment.article_slug})`);
    });
    
    console.log('\n✅ Cleanup completed!');
    console.log('🎉 Now try submitting a new comment - it should display properly!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

deleteBadCommentsSimple();

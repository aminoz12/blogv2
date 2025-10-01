import { executeQueryFactory } from './src/utils/databaseFactory.js';

async function deleteBadComments() {
  try {
    console.log('🗑️ Deleting comments with bad slugs...');
    
    // Delete all comments with {postSlug} slugs
    const deleteQuery = `DELETE FROM comments WHERE article_slug = "{postSlug}"`;
    const result = await executeQueryFactory(deleteQuery);
    
    console.log('✅ Bad comments deleted successfully!');
    console.log('📊 Deleted comments:', result);
    
    // Check remaining comments
    const remainingComments = await executeQueryFactory('SELECT * FROM comments ORDER BY created_at DESC');
    console.log(`\n📊 Remaining comments: ${remainingComments.length}`);
    
    remainingComments.forEach((comment, index) => {
      console.log(`  ${index + 1}. ${comment.author_name}: ${comment.content.substring(0, 30)}... (Slug: ${comment.article_slug})`);
    });
    
    console.log('\n✅ Bad comments cleanup completed!');
    console.log('🎉 Now try submitting a new comment - it should display properly!');
    
  } catch (error) {
    console.error('❌ Error deleting bad comments:', error);
  }
}

deleteBadComments();

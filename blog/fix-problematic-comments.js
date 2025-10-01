import { executeQueryFactory } from './src/utils/databaseFactory.js';

async function fixProblematicComments() {
  try {
    console.log('🔧 Fixing problematic comments...');
    
    // Get all comments
    const comments = await executeQueryFactory('SELECT * FROM comments ORDER BY created_at DESC');
    console.log(`Found ${comments.length} comments to check`);
    
    let fixedCount = 0;
    
    for (const comment of comments) {
      const authorName = comment.author_name || '';
      const content = comment.content || '';
      
      // Check if the comment has problematic characters that could cause HTML issues
      const hasProblematicChars = authorName.includes('"') || authorName.includes("'") || 
                                 authorName.includes('`') || authorName.includes('${') ||
                                 content.includes('"') || content.includes("'") || 
                                 content.includes('`') || content.includes('${');
      
      if (hasProblematicChars) {
        console.log(`\n🔧 Fixing comment ID ${comment.id}:`);
        console.log('  Original author:', authorName);
        console.log('  Original content:', content);
        
        // Escape the problematic characters
        const escapedAuthor = authorName
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/`/g, '&#96;')
          .replace(/\$/g, '&#36;');
        
        const escapedContent = content
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/`/g, '&#96;')
          .replace(/\$/g, '&#36;');
        
        console.log('  Escaped author:', escapedAuthor);
        console.log('  Escaped content:', escapedContent);
        
        // Update the comment in the database
        try {
          await executeQueryFactory(`
            UPDATE comments 
            SET author_name = ?, content = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [escapedAuthor, escapedContent, comment.id]);
          
          console.log('  ✅ Comment updated successfully');
          fixedCount++;
        } catch (error) {
          console.log('  ❌ Error updating comment:', error.message);
        }
      }
    }
    
    console.log(`\n✅ Fixed ${fixedCount} problematic comments`);
    
  } catch (error) {
    console.error('❌ Error fixing comments:', error);
  }
}

fixProblematicComments();


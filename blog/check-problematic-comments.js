import { executeQueryFactory } from './src/utils/databaseFactory.js';

async function checkProblematicComments() {
  try {
    console.log('🔍 Checking for comments with problematic characters...');
    
    // Get all comments and check for special characters
    const comments = await executeQueryFactory('SELECT * FROM comments ORDER BY created_at DESC LIMIT 10');
    
    console.log(`Found ${comments.length} recent comments:`);
    
    comments.forEach((comment, index) => {
      console.log(`\nComment ${index + 1}:`);
      console.log('ID:', comment.id);
      console.log('Author:', comment.author_name);
      console.log('Content:', comment.content);
      console.log('Article slug:', comment.article_slug);
      
      // Check for problematic characters
      const authorName = comment.author_name || '';
      const content = comment.content || '';
      
      const hasQuotes = authorName.includes('"') || content.includes('"');
      const hasApostrophes = authorName.includes("'") || content.includes("'");
      const hasBackticks = authorName.includes('`') || content.includes('`');
      const hasTemplateLiterals = authorName.includes('${') || content.includes('${');
      const hasHtml = authorName.includes('<') || content.includes('<');
      
      if (hasQuotes || hasApostrophes || hasBackticks || hasTemplateLiterals || hasHtml) {
        console.log('⚠️  PROBLEMATIC CHARACTERS DETECTED:');
        if (hasQuotes) console.log('  - Contains quotes');
        if (hasApostrophes) console.log('  - Contains apostrophes');
        if (hasBackticks) console.log('  - Contains backticks');
        if (hasTemplateLiterals) console.log('  - Contains template literals');
        if (hasHtml) console.log('  - Contains HTML');
        
        // Test JSON encoding
        try {
          const jsonAuthor = JSON.stringify(authorName);
          console.log('  JSON encoded author:', jsonAuthor);
        } catch (e) {
          console.log('  ❌ JSON encoding failed:', e.message);
        }
      } else {
        console.log('✅ No problematic characters');
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking comments:', error);
  }
}

checkProblematicComments();


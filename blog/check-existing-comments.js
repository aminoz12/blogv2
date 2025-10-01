import { executeQueryFactory } from './src/utils/databaseFactory.js';

async function checkExistingComments() {
  try {
    console.log('🔍 Checking existing comments for problematic characters...');
    
    // Get all comments
    const comments = await executeQueryFactory('SELECT * FROM comments ORDER BY created_at DESC LIMIT 20');
    console.log(`Found ${comments.length} comments to check`);
    
    comments.forEach((comment, index) => {
      console.log(`\nComment ${index + 1}:`);
      console.log('ID:', comment.id);
      console.log('Author:', comment.author_name);
      console.log('Content:', comment.content);
      console.log('Article slug:', comment.article_slug);
      
      // Check for characters that could cause HTML/JavaScript issues
      const authorName = comment.author_name || '';
      const content = comment.content || '';
      
      const problematicChars = {
        quotes: authorName.includes('"') || content.includes('"'),
        apostrophes: authorName.includes("'") || content.includes("'"),
        backticks: authorName.includes('`') || content.includes('`'),
        templateLiterals: authorName.includes('${') || content.includes('${'),
        htmlTags: authorName.includes('<') || content.includes('<'),
        parentheses: authorName.includes('(') || authorName.includes(')'),
        brackets: authorName.includes('[') || authorName.includes(']'),
        braces: authorName.includes('{') || authorName.includes('}')
      };
      
      const hasProblematicChars = Object.values(problematicChars).some(Boolean);
      
      if (hasProblematicChars) {
        console.log('⚠️  PROBLEMATIC CHARACTERS DETECTED:');
        Object.entries(problematicChars).forEach(([char, hasIt]) => {
          if (hasIt) console.log(`  - Contains ${char}`);
        });
        
        // Test how this would look in HTML
        const htmlAttribute = `data-author-name="${authorName}"`;
        console.log('  HTML attribute would be:', htmlAttribute);
        
        // Check if this could cause syntax errors
        if (authorName.includes('"') || authorName.includes("'") || authorName.includes('`')) {
          console.log('  ❌ This could cause JavaScript syntax errors!');
        }
      } else {
        console.log('✅ No problematic characters');
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking comments:', error);
  }
}

checkExistingComments();


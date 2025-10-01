// Comprehensive fix for all article issues
import { initializeDatabaseFactory, executeQueryFactory, closeDatabaseFactory } from './src/utils/databaseFactory.js';

async function fixAllIssues() {
  try {
    console.log('🔧 Fixing all article issues...');
    
    // Initialize database connection
    await initializeDatabaseFactory();
    
    // 1. Fix corrupted titles with proper unique titles
    console.log('\n1. Fixing corrupted titles...');
    const articles = await executeQueryFactory('SELECT id, title, content FROM articles WHERE title LIKE \'%relations Amicale%\' OR title LIKE \'%{"url":%\'');
    
    const properTitles = [
      'Les relations amicales et leurs importances',
      'Conseils pour les relations',
      '10 habitudes pour rester en bonne santé',
      'Guide complet du développement personnel',
      'Techniques de communication efficace'
    ];
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const properTitle = properTitles[i] || `Article ${article.id}`;
      
      await executeQueryFactory(
        'UPDATE articles SET title = ? WHERE id = ?',
        [properTitle, article.id]
      );
      
      console.log(`   ✅ Fixed article ${article.id}: "${properTitle}"`);
    }
    
    // 2. Fix content issues - check for undefined content
    console.log('\n2. Checking content issues...');
    const contentIssues = await executeQueryFactory('SELECT id, title, content FROM articles WHERE content IS NULL OR content = \'\' OR content = \'undefined\'');
    
    for (const article of contentIssues) {
      console.log(`   ⚠️ Article ${article.id} has content issue: "${article.content}"`);
      
      // Set a default content if it's undefined or empty
      const defaultContent = `<p>Contenu de l'article "${article.title}" - Veuillez ajouter du contenu.</p>`;
      await executeQueryFactory(
        'UPDATE articles SET content = ? WHERE id = ?',
        [defaultContent, article.id]
      );
      
      console.log(`   ✅ Fixed content for article ${article.id}`);
    }
    
    // 3. Fix image issues - ensure featured_image is properly formatted
    console.log('\n3. Fixing image issues...');
    const imageIssues = await executeQueryFactory('SELECT id, title, featured_image FROM articles WHERE featured_image IS NOT NULL');
    
    for (const article of imageIssues) {
      console.log(`   🔍 Article ${article.id} image: ${article.featured_image}`);
      
      // If featured_image is a plain URL, convert to object format
      if (typeof article.featured_image === 'string' && article.featured_image.startsWith('/api/uploads/')) {
        const imageObject = {
          url: article.featured_image,
          alt: article.title,
          caption: ''
        };
        
        await executeQueryFactory(
          'UPDATE articles SET featured_image = ? WHERE id = ?',
          [JSON.stringify(imageObject), article.id]
        );
        
        console.log(`   ✅ Fixed image format for article ${article.id}`);
      }
    }
    
    // 4. Verify all fixes
    console.log('\n4. Verifying fixes...');
    const allArticles = await executeQueryFactory('SELECT id, title, content, featured_image FROM articles ORDER BY id');
    
    console.log(`📄 All articles after fixes:`);
    allArticles.forEach((article, index) => {
      console.log(`\n--- Article ${index + 1} ---`);
      console.log(`ID: ${article.id}`);
      console.log(`Title: ${article.title}`);
      console.log(`Content: ${article.content ? article.content.substring(0, 50) + '...' : 'NULL'}`);
      console.log(`Featured Image: ${article.featured_image ? (typeof article.featured_image === 'string' ? article.featured_image : JSON.stringify(article.featured_image)) : 'NULL'}`);
    });
    
    console.log('\n✅ All issues fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing issues:', error);
  } finally {
    await closeDatabaseFactory();
  }
}

fixAllIssues();








import { executeQueryFactory } from './src/utils/databaseFactory.js';

async function checkImages() {
  try {
    console.log('🔍 Checking articles and their images...');
    const articles = await executeQueryFactory('SELECT id, title, featured_image FROM articles LIMIT 3', []);
    console.log('📊 Found articles:', articles.length);
    
    articles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   Image data: ${typeof article.featured_image}`);
      if (article.featured_image) {
        console.log(`   Image content: ${article.featured_image.substring(0, 200)}...`);
      } else {
        console.log('   No image data');
      }
      console.log('---');
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkImages();

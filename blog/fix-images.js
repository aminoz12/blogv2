// Script to fix malformed image data in the database
import { initializeDatabaseFactory, executeQueryFactory } from './src/utils/databaseFactory.js';

console.log('🔧 Fixing malformed image data in database...\n');

async function fixImageData() {
  try {
    // Initialize database
    const { isMongoDB, db } = await initializeDatabaseFactory();
    console.log(`✅ Database initialized: ${isMongoDB ? 'MongoDB' : 'SQLite'}`);
    
    if (isMongoDB) {
      // MongoDB approach
      const collection = db.collection('articles');
      
      // Find all articles with malformed image data
      const articles = await collection.find({
        featured_image: { $exists: true, $ne: null, $ne: '' }
      }).toArray();
      
      console.log(`📚 Found ${articles.length} articles with images to check\n`);
      
      let fixedCount = 0;
      let skippedCount = 0;
      
      for (const article of articles) {
        console.log(`🔍 Processing: ${article.title}`);
        
        try {
          const imageData = JSON.parse(article.featured_image);
          
          // Check if the url property contains a JSON string instead of a simple string
          if (imageData.url && typeof imageData.url === 'string' && imageData.url.startsWith('{')) {
            console.log('   ❌ Malformed data detected - fixing...');
            
            try {
              // Parse the nested JSON string
              const nestedData = JSON.parse(imageData.url);
              
              // Create a properly formatted image object
              const fixedImageData = {
                url: nestedData.url || imageData.url,
                filename: nestedData.filename || imageData.filename || '',
                size: nestedData.size || imageData.size || 0,
                type: nestedData.type || imageData.type || 'image/png',
                alt: nestedData.alt || imageData.alt || '',
                caption: nestedData.caption || imageData.caption || '',
                position: nestedData.position || imageData.position || 'top'
              };
              
              // Update the article
              await collection.updateOne(
                { _id: article._id },
                { $set: { featured_image: JSON.stringify(fixedImageData) } }
              );
              
              console.log('   ✅ Fixed successfully');
              console.log('   📝 New URL:', fixedImageData.url);
              fixedCount++;
              
            } catch (parseError) {
              console.log('   ⚠️ Could not parse nested JSON, skipping:', parseError.message);
              skippedCount++;
            }
            
          } else {
            console.log('   ✅ Already properly formatted');
            skippedCount++;
          }
          
        } catch (parseError) {
          console.log('   ⚠️ Could not parse featured_image JSON, skipping:', parseError.message);
          skippedCount++;
        }
        
        console.log('');
      }
      
      console.log('🎉 Image data fix completed!');
      console.log(`✅ Fixed: ${fixedCount} articles`);
      console.log(`⏭️ Skipped: ${skippedCount} articles`);
      
    } else {
      console.log('SQLite database detected - using SQL approach');
      
      // Get all articles with featured_image
      const articles = await executeQueryFactory(`
        SELECT id, title, slug, featured_image
        FROM articles
        WHERE featured_image IS NOT NULL AND featured_image != ''
      `);
      
      console.log(`📚 Found ${articles.length} articles with images to check\n`);
      
      let fixedCount = 0;
      let skippedCount = 0;
      
      for (const article of articles) {
        console.log(`🔍 Processing: ${article.title}`);
        
        try {
          const imageData = JSON.parse(article.featured_image);
          
          // Check if the url property contains a JSON string instead of a simple string
          if (imageData.url && typeof imageData.url === 'string' && imageData.url.startsWith('{')) {
            console.log('   ❌ Malformed data detected - fixing...');
            
            try {
              // Parse the nested JSON string
              const nestedData = JSON.parse(imageData.url);
              
              // Create a properly formatted image object
              const fixedImageData = {
                url: nestedData.url || imageData.url,
                filename: nestedData.filename || imageData.filename || '',
                size: nestedData.size || imageData.size || 0,
                type: nestedData.type || imageData.type || 'image/png',
                alt: nestedData.alt || imageData.alt || '',
                caption: nestedData.caption || imageData.caption || '',
                position: nestedData.position || imageData.position || 'top'
              };
              
              // Update the article
              await executeQueryFactory(
                'UPDATE articles SET featured_image = ? WHERE id = ?',
                [JSON.stringify(fixedImageData), article.id]
              );
              
              console.log('   ✅ Fixed successfully');
              console.log('   📝 New URL:', fixedImageData.url);
              fixedCount++;
              
            } catch (parseError) {
              console.log('   ⚠️ Could not parse nested JSON, skipping:', parseError.message);
              skippedCount++;
            }
            
          } else {
            console.log('   ✅ Already properly formatted');
            skippedCount++;
          }
          
        } catch (parseError) {
          console.log('   ⚠️ Could not parse featured_image JSON, skipping:', parseError.message);
          skippedCount++;
        }
        
        console.log('');
      }
      
      console.log('🎉 Image data fix completed!');
      console.log(`✅ Fixed: ${fixedCount} articles`);
      console.log(`⏭️ Skipped: ${skippedCount} articles`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing image data:', error);
  }
}

fixImageData();


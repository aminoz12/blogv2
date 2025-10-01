import { initializeDatabaseFactory, executeQueryFactory } from './src/utils/databaseFactory.js';
import { closeDatabaseFactory } from './src/utils/databaseFactory.js';

async function initSampleData() {
  try {
    console.log('🔧 Initializing sample data...');
    
    // Initialize database connection
    await initializeDatabaseFactory();
    console.log('✅ Database connected');
    
    // Check if categories exist
    console.log('\n📂 Checking categories...');
    let categories;
    try {
      categories = await executeQueryFactory('SELECT * FROM categories');
      console.log(`Found ${categories.length} existing categories`);
    } catch (error) {
      console.log('No categories table found, will create default categories');
      categories = [];
    }
    
    // Create default categories if none exist
    if (categories.length === 0) {
      console.log('\n🆕 Creating default categories...');
      
      const defaultCategories = [
        {
          name: 'Général',
          slug: 'general',
          description: 'Catégorie générale pour tous les articles',
          color: '#3B82F6',
          icon: '📁',
          sort_order: 0
        },
        {
          name: 'Technologie',
          slug: 'technologie',
          description: 'Articles sur la technologie et l\'innovation',
          color: '#10B981',
          icon: '💻',
          sort_order: 1
        },
        {
          name: 'Lifestyle',
          slug: 'lifestyle',
          description: 'Articles sur le mode de vie et le bien-être',
          color: '#F59E0B',
          icon: '🌟',
          sort_order: 2
        },
        {
          name: 'Santé',
          slug: 'sante',
          description: 'Articles sur la santé et le bien-être',
          color: '#EF4444',
          icon: '❤️',
          sort_order: 3
        },
        {
          name: 'Business',
          slug: 'business',
          description: 'Articles sur l\'entrepreneuriat et les affaires',
          color: '#8B5CF6',
          icon: '💼',
          sort_order: 4
        }
      ];
      
      for (const category of defaultCategories) {
        try {
          await executeQueryFactory(`
            INSERT INTO categories (name, slug, description, color, icon, is_active, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [category.name, category.slug, category.description, category.color, category.icon, 1, category.sort_order]);
          
          console.log(`✅ Created category: ${category.name}`);
        } catch (error) {
          console.log(`⚠️ Failed to create category ${category.name}:`, error.message);
        }
      }
    } else {
      console.log('ℹ️ Categories already exist, skipping creation');
    }
    
    // Check if articles exist
    console.log('\n📄 Checking articles...');
    let articles;
    try {
      articles = await executeQueryFactory('SELECT * FROM articles');
      console.log(`Found ${articles.length} existing articles`);
    } catch (error) {
      console.log('No articles table found');
      articles = [];
    }
    
    // Create sample articles if none exist
    if (articles.length === 0) {
      console.log('\n🆕 Creating sample articles...');
      
      // Get categories to use for articles
      const currentCategories = await executeQueryFactory('SELECT * FROM categories');
      const generalCategory = currentCategories.find(c => c.slug === 'general') || currentCategories[0];
      const techCategory = currentCategories.find(c => c.slug === 'technologie') || currentCategories[0];
      
      const sampleArticles = [
        {
          title: 'Bienvenue sur notre blog',
          slug: 'bienvenue-sur-notre-blog',
          excerpt: 'Découvrez notre nouveau blog et ce qu\'il a à offrir',
          content: `# Bienvenue sur notre blog!

Ceci est votre premier article. Vous pouvez le modifier ou le supprimer, puis commencer à écrire !

## À propos de ce blog

Ce blog a été créé pour partager des connaissances, des expériences et des idées avec notre communauté. Nous espérons que vous apprécierez le contenu que nous allons publier.

## Prochaines étapes

- Explorez les différentes catégories
- Abonnez-vous à notre newsletter
- Partagez vos commentaires et suggestions

Merci de votre visite !`,
          category_id: generalCategory?.id || 1,
          author_id: 1,
          status: 'published',
          is_featured: true,
          meta_title: 'Bienvenue sur notre blog',
          meta_description: 'Découvrez notre nouveau blog et ce qu\'il a à offrir',
          tags: JSON.stringify(['bienvenue', 'blog', 'nouveau']),
          featured_image: null
        },
        {
          title: 'Les dernières tendances technologiques',
          slug: 'les-dernieres-tendances-technologiques',
          excerpt: 'Découvrez les tendances technologiques qui vont façonner notre avenir',
          content: `# Les dernières tendances technologiques

L'innovation technologique ne cesse d'accélérer, transformant notre façon de vivre, de travailler et de communiquer.

## Intelligence Artificielle

L'IA continue de révolutionner de nombreux secteurs, de la santé à l'automobile en passant par la finance.

## Internet des Objets (IoT)

Le nombre d'appareils connectés ne cesse d'augmenter, créant des écosystèmes intelligents dans nos foyers et nos villes.

## Réalité Augmentée et Virtuelle

Ces technologies transforment l'éducation, le divertissement et la formation professionnelle.

## Cybersécurité

Avec l'augmentation des menaces numériques, la cybersécurité devient une priorité absolue pour les entreprises et les particuliers.

Restez à jour avec ces tendances pour ne pas être laissé pour compte dans le monde numérique !`,
          category_id: techCategory?.id || 1,
          author_id: 1,
          status: 'published',
          is_featured: false,
          meta_title: 'Les dernières tendances technologiques',
          meta_description: 'Découvrez les tendances technologiques qui vont façonner notre avenir',
          tags: JSON.stringify(['technologie', 'innovation', 'tendances']),
          featured_image: null
        }
      ];
      
      for (const [index, article] of sampleArticles.entries()) {
        try {
          await executeQueryFactory(`
            INSERT INTO articles 
            (title, slug, content, excerpt, category_id, author_id, status, is_featured, meta_title, meta_description, tags, published_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
          `, [
            article.title,
            article.slug,
            article.content,
            article.excerpt,
            article.category_id,
            article.author_id,
            article.status,
            article.is_featured ? 1 : 0,
            article.meta_title,
            article.meta_description,
            article.tags,
          ]);
          
          console.log(`✅ Created article: ${article.title}`);
        } catch (error) {
          console.log(`⚠️ Failed to create article "${article.title}":`, error.message);
        }
      }
    } else {
      console.log('ℹ️ Articles already exist, skipping creation');
    }
    
    console.log('\n✅ Sample data initialization completed!');
    
  } catch (error) {
    console.error('❌ Error initializing sample data:', error);
  } finally {
    try {
      await closeDatabaseFactory();
      console.log('✅ Database connection closed');
    } catch (closeError) {
      console.error('❌ Error closing database:', closeError);
    }
  }
}

initSampleData();
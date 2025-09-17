import rss from '@astrojs/rss';

export async function GET(context) {
  // Mock data for RSS feed - in production, this would come from your CMS or markdown files
  const posts = [
    {
      title: 'Discovering Relationships : Complete Guide for Beginners',
      description: 'Dive into the fascinating world of relationship exploration. Discover the basics, safety, and how to explore your desires with confidence.',
      link: 'https://mad2moi-blog.com/blog/discovering-relationships-beginners',
      pubDate: new Date('2025-01-15'),
      author: 'Dr. Wellness',
      category: 'Relationships'
    },
    {
      title: 'The Art of Modern Lifestyle : Ethics and Joy',
      description: 'Rediscover lifestyle choices as an art of living. Ethics, consent and exploration of shared pleasures.',
      link: 'https://mad2moi-blog.com/blog/art-modern-lifestyle',
      pubDate: new Date('2025-01-12'),
      author: 'Lifestyle Expert',
      category: 'Lifestyle'
    },
    {
      title: 'Advanced Creative Expression : Creating Intensity',
      description: 'Master the art of creative expression with sophisticated scenarios that stimulate imagination and intensify experience.',
      link: 'https://mad2moi-blog.com/blog/creative-expression-advanced',
      pubDate: new Date('2025-01-10'),
      author: 'Master of Imagination',
      category: 'Creative Expression'
    },
    {
      title: 'Communication in Relationships : The Secret to a Fulfilled Life',
      description: 'Learn to communicate your desires, boundaries and dreams for deeper and more satisfying intimacy.',
      link: 'https://mad2moi-blog.com/blog/communication-couples',
      pubDate: new Date('2025-01-08'),
      author: 'Dr. Wellness',
      category: 'Communication'
    },
    {
      title: 'Wellness Products : Complete Guide to Choice and Use',
      description: 'Discover the world of wellness products: how to choose, use and integrate these accessories into your personal life.',
      link: 'https://mad2moi-blog.com/blog/wellness-products-guide',
      pubDate: new Date('2025-01-05'),
      author: 'Wellness Expert',
      category: 'Wellness Products'
    },
    {
      title: 'Dreams and Boundaries : The Art of Mindful Exploration',
      description: 'Dare to explore your deepest dreams in a safe and caring environment.',
      link: 'https://mad2moi-blog.com/blog/dreams-boundaries-exploration',
      pubDate: new Date('2025-01-03'),
      author: 'Master of Imagination',
      category: 'Creative Ideas'
    }
  ];

  return rss({
    title: 'Mad2Moi Blog - Personal Development & Well-being',
    description: 'Mature and sophisticated blog about personal development and well-being. Educational and caring content for adults.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.title,
      description: post.description,
      link: post.link,
      pubDate: post.pubDate,
      author: post.author,
      category: post.category,
      // Add custom fields for better RSS readers
      customData: `
        <author>${post.author}</author>
        <category>${post.category}</category>
        <guid>${post.link}</guid>
      `
    })),
    customData: `
      <language>fr</language>
      <copyright>© 2025 Mad2Moi. Tous droits réservés.</copyright>
      <managingEditor>contact@mad2moi-blog.com</managingEditor>
      <webMaster>contact@mad2moi-blog.com</webMaster>
      <ttl>60</ttl>
      <image>
        <url>https://mad2moi-blog.com/logo.avif</url>
        <title>Mad2Moi Blog</title>
        <link>https://mad2moi-blog.com</link>
        <width>144</width>
        <height>144</height>
        <description>Logo Mad2Moi Blog</description>
      </image>
    `
  });
}

// Article management functionality with database API
console.log('🚀 articles.js file loaded!');

// Global variables for article management
let articles = [];
let filteredArticles = [];
let categoriesCache = [];
let currentFilter = 'all';
let currentSort = { field: 'created_at', direction: 'desc' };
let searchQuery = '';
let currentPage = 1;
let articlesPerPage = 15; // Increased for better performance
let totalPages = 1;
let isLoading = false; // Prevent multiple simultaneous loads

// Backup system for articles
let articleBackups = new Map(); // Store backups by article ID

// Utility function to find article by ID with robust matching
function findArticleById(articleId) {
  try {
    console.log('🔍 findArticleById: Looking for article with ID:', articleId, 'Type:', typeof articleId);
    
    if (!articles || articles.length === 0) {
      console.warn('⚠️ findArticleById: No articles loaded');
      return null;
    }
    
    // Convert articleId to string for comparison
    const searchId = String(articleId);
    
    // Find article using multiple ID matching strategies
    const article = articles.find(a => {
      // Try exact match first
      if (String(a.id) === searchId || String(a._id) === searchId) {
        return true;
      }
      
      // Try partial match for ObjectId strings
      if (String(a.id).includes(searchId) || String(a._id).includes(searchId)) {
        return true;
      }
      
      return false;
    });
    
    if (article) {
      console.log('✅ findArticleById: Found article:', { id: article.id, _id: article._id, title: article.title });
    } else {
      console.warn('⚠️ findArticleById: Article not found with ID:', articleId);
      console.log('🔍 Available article IDs:', articles.map(a => ({ id: a.id, _id: a._id, title: a.title?.substring(0, 30) + '...' })));
    }
    
    return article;
  } catch (error) {
    console.error('❌ findArticleById: Error finding article:', error);
    return null;
  }
}



// Load articles from database API
async function loadArticles() {
  // Prevent multiple simultaneous loads
  if (isLoading) {
    console.log('⏳ Load already in progress, skipping...');
    return;
  }
  
  isLoading = true;
  
  try {
    console.log('🔄 Loading articles from API...');
    
    // Show loading indicator
    const tbody = document.getElementById('articlesTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">⏳ Chargement des articles...</td></tr>';
    }
    
    const startTime = performance.now();
    const response = await fetch('/api/articles');
    const loadTime = performance.now() - startTime;
    
    console.log('📡 API Response status:', response.status);
    console.log('⚡ Load time:', Math.round(loadTime), 'ms');
    
    if (response.ok) {
      const data = await response.json();
      console.log('📦 Raw API response length:', data.length);
      
      // Ensure we have an array of articles
      if (Array.isArray(data)) {
        articles = data;
        console.log('✅ Articles loaded as array:', articles.length, 'articles');
        if (articles.length > 0) {
          console.log('📄 Sample article structure:', {
            id: articles[0].id,
            title: articles[0].title,
            type_id: typeof articles[0].id
          });
        }
      } else if (data && Array.isArray(data.articles)) {
        articles = data.articles;
        console.log('✅ Articles loaded from data.articles:', articles.length, 'articles');
      } else {
        console.warn('⚠️ Unexpected API response format:', data);
        console.warn('⚠️ Data type:', typeof data);
        console.warn('⚠️ Is array?', Array.isArray(data));
        articles = [];
      }
      
      // Sort articles by creation date (newest first) for better performance
      articles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      filteredArticles = [...articles];
      console.log('✅ Articles loaded from database:', articles.length);
      
      renderArticles();
      updateStats();
      
      if (loadTime > 2000) {
        console.warn('⚠️ Slow load detected:', Math.round(loadTime), 'ms');
        showNotification(`Articles chargés en ${Math.round(loadTime/1000)}s`, 'warning');
      }
    } else {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`Failed to fetch articles: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Error loading articles:', error);
    articles = [];
    filteredArticles = [];
    
    // Show error in table
    const tbody = document.getElementById('articlesTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-red-500">❌ Erreur lors du chargement des articles</td></tr>';
    }
    
    showNotification('Erreur lors du chargement des articles.', 'error');
  } finally {
    isLoading = false;
  }
}

// Create new article
async function createArticle(articleData) {
  try {
    const response = await fetch('/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(articleData)
    });
    
    if (response.ok) {
      const newArticle = await response.json();
      articles.unshift(newArticle);
      filteredArticles = [...articles];
      renderArticles();
      updateStats();
      showNotification(`Article "${newArticle.title}" créé avec succès !`, 'success');
      return newArticle;
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create article');
    }
  } catch (error) {
    console.error('❌ Error creating article:', error);
    showNotification('Erreur lors de la création de l\'article.', 'error');
    throw error;
  }
}

// Update existing article
async function updateArticle(id, articleData) {
  try {
    console.log('🔄 Updating article with ID:', id);
    console.log('📤 Update payload:', articleData);
    
    const response = await fetch('/api/articles', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id, ...articleData })
    });
    
    console.log('📡 Update response status:', response.status);
    
    if (response.ok) {
      const updatedArticle = await response.json();
      console.log('✅ Update response:', updatedArticle);
      
      const index = articles.findIndex(a => a.id === id);
      if (index !== -1) {
        articles[index] = updatedArticle;
        filteredArticles = [...articles];
        renderArticles();
        updateStats();
        showNotification(`Article "${updatedArticle.title}" mis à jour avec succès !`, 'success');
      }
      return updatedArticle;
    } else {
      let error;
      try {
        const errorText = await response.text();
        console.error('❌ Update API Error Response:', errorText);
        // Try to parse as JSON, but don't fail if it's not
        try {
          error = JSON.parse(errorText);
        } catch (parseError) {
          error = { error: errorText || 'Failed to update article' };
        }
      } catch (textError) {
        error = { error: 'Failed to read error response' };
      }
      throw new Error(error.error || 'Failed to update article');
    }
  } catch (error) {
    console.error('❌ Error updating article:', error);
    showNotification('Erreur lors de la mise à jour de l\'article.', 'error');
    throw error;
  }
}

// Single permanent delete function - clean and simple
window.deleteArticle = async function(articleId) {
  console.log('🗑️ Permanent delete requested for article ID:', articleId, 'Type:', typeof articleId);
  
  try {
    // Ensure articles are loaded
    if (!articles || articles.length === 0) {
      console.log('🔄 Loading articles...');
      await loadArticles();
    }
    
    console.log('🔍 Available articles:', articles.map(a => ({ 
      id: a.id, 
      _id: a._id, 
      title: a.title?.substring(0, 30) + '...' 
    })));
    
    // Find the article - check both id and _id fields
    const article = articles.find(a => 
      String(a.id) === String(articleId) || 
      String(a._id) === String(articleId) ||
      String(a.id).includes(String(articleId)) ||
      String(a._id).includes(String(articleId))
    );
    
    if (!article) {
      console.error('❌ Article not found:', articleId);
      console.log('🔍 Searched for ID that matches:', String(articleId));
      showNotification('Article not found', 'error');
      return false;
    }
    
    console.log('✅ Found article:', { id: article.id, _id: article._id, title: article.title });
    
    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to permanently delete the article "${article.title}"?\n\nThis action cannot be undone.`);
    if (!confirmed) {
      console.log('❌ Delete cancelled by user');
      return false;
    }
    
    console.log('💥 Proceeding with permanent deletion');
    
    // Use the correct ID for the API call (prefer _id for MongoDB)
    const apiId = article._id || article.id;
    console.log('📡 Making DELETE request with ID:', apiId);
    
    // Make DELETE request to API
    const response = await fetch(`/api/articles?id=${apiId}&force=true`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      console.log('✅ Article deleted successfully');
      
      // Remove from local array
      const index = articles.findIndex(a => 
        String(a.id) === String(articleId) || 
        String(a._id) === String(articleId) ||
        String(a.id) === String(apiId) ||
        String(a._id) === String(apiId)
      );
      
      if (index !== -1) {
        const deletedTitle = articles[index].title;
        articles.splice(index, 1);
        filteredArticles = [...articles];
        renderArticles();
        updateStats();
        showNotification(`Article "${deletedTitle}" deleted permanently`, 'success');
      }
      return true;
    } else {
      const errorData = await response.text();
      console.error('❌ Delete failed:', errorData);
      showNotification('Failed to delete article', 'error');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Delete error:', error);
    showNotification(`Error: ${error.message}`, 'error');
    return false;
  }
};

// View article function
window.viewArticle = async function(id) {
  console.log('👁️ viewArticle called with ID:', id);
  try {
    // Ensure articles are loaded
    if (!articles || articles.length === 0) {
      console.log('🔄 No articles loaded, fetching from API...');
      await loadArticles();
    }
    
    console.log('🔍 Looking for article with ID:', id, 'Type:', typeof id);
    console.log('🔍 Available articles:', articles.map(a => ({ id: a.id, title: a.title })));
    const article = articles.find(a => parseInt(a.id) === parseInt(id));
    if (!article) {
      showNotification('Article non trouvé.', 'error');
      return false;
    }

    // For now, show a notification or open in new tab
    // This could be expanded to show a modal or redirect to the blog
    showNotification(`Affichage de l'article: "${article.title}"`, 'info');
    
    // Open blog article in new tab if we have the slug
    if (article.slug) {
      const blogUrl = `http://localhost:4321/blog/${article.slug}`;
      window.open(blogUrl, '_blank');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error viewing article:', error);
    showNotification('Erreur lors de l\'affichage de l\'article.', 'error');
    return false;
  }
};

// Edit article function (removed - using modal-based edit below)







 
function searchArticles(query) {
  if (!query || query.trim() === '') {
    filteredArticles = [...articles];
  } else {
    const searchTerm = query.toLowerCase().trim();
    filteredArticles = articles.filter(article => 
      (article.title && article.title.toLowerCase().includes(searchTerm)) ||
      (article.content && article.content.toLowerCase().includes(searchTerm)) ||
      (article.author_name && article.author_name.toLowerCase().includes(searchTerm)) ||
      (article.category_name && article.category_name.toLowerCase().includes(searchTerm)) ||
      (article.tags && (() => {
        try {
          const tags = JSON.parse(article.tags);
          return Array.isArray(tags) && tags.some(tag => tag.toLowerCase().includes(searchTerm));
        } catch (e) {
          return false;
        }
      })())
    );
  }
  renderArticles();
  updateStats();
}

// Render articles in the table with pagination for performance
function renderArticles() {
  console.log('🎨 Rendering articles...');
  console.log('📋 Total articles to render:', filteredArticles.length);
  
  const tbody = document.getElementById('articlesTableBody');
  if (!tbody) {
    console.error('❌ articlesTableBody not found!');
    return;
  }
  
  // Calculate pagination
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  const articlesToRender = filteredArticles.slice(startIndex, endIndex);
  
  console.log('📄 Rendering page:', currentPage, 'Articles:', startIndex, '-', endIndex, 'of', filteredArticles.length);
  
  // Show loading if too many articles
  if (filteredArticles.length > 50) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">⚡ Optimisation du rendu...</td></tr>';
    
    // Use setTimeout to prevent blocking the UI
    setTimeout(() => {
      renderArticlesBatch(articlesToRender, tbody);
    }, 50);
  } else {
    renderArticlesBatch(articlesToRender, tbody);
  }
}

// Render a batch of articles
function renderArticlesBatch(articlesToRender, tbody) {
  console.log('✅ Rendering batch of', articlesToRender.length, 'articles');
  console.log('🔍 Article IDs being rendered:', articlesToRender.map(a => ({ id: a.id, type: typeof a.id, title: a.title })));

  tbody.innerHTML = articlesToRender.map(article => `
    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td class="px-6 py-4 w-80">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
            ${getArticleImage(article)}
          </div>
          <div>
            <div class="text-sm font-medium text-gray-900 dark:text-white">${article.title || 'Sans titre'}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">${article.excerpt || 'Aucun extrait'}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white w-32">
        ${article.author_name || 'Auteur inconnu'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap w-32">
        <span class="inline-flex px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg shadow-purple-500/25">
          ${article.category_name || 'Non catégorisé'}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap w-24">
        <span class="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase ${getStatusColor(article.status)} transition-all duration-200 hover:scale-105">
          ${getStatusText(article.status)}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 w-32">
        ${formatDate(article.created_at)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium w-40">
        <div class="flex items-center space-x-2">
          <button 
            data-article-id="${article.id}"
            class="view-article-btn text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            title="Voir l'article"
            type="button"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
          </button>
          <button 
            data-article-id="${article.id}"
            class="edit-article-btn text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="Modifier l'article"
            type="button"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
          <button 
            data-article-id="${article.id}"
            class="delete-article-btn text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Supprimer l'article définitivement"
            type="button"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
  
  console.log('✅ Articles rendered successfully');
  console.log('📊 Table rows created:', tbody.children.length);
  
  // Set up event handlers for the newly rendered images
  setupArticleImageHandlers();
  
  // Set up event handlers for the action buttons
  setupActionButtonHandlers();
}

// Helper function to validate image URLs - removed duplicate, using the complete one below

// Helper function to sanitize image URLs - removed duplicate, using the complete one below

// Helper function to get article image
function getArticleImage(article) {
  console.log('🖼️ getArticleImage called for article:', {
    id: article.id,
    title: article.title,
    featured_image: article.featured_image,
    featured_image_type: typeof article.featured_image
  });
  
  if (article.featured_image) {
    try {
      let imageData;
      let imageUrl = '';
      
      if (typeof article.featured_image === 'string') {
        console.log('🔍 Parsing featured_image string:', article.featured_image);
        try {
          imageData = JSON.parse(article.featured_image);
          console.log('✅ Parsed image data:', imageData);
          imageUrl = imageData?.url || imageData?.src || '';
        } catch (parseError) {
          // If it's not valid JSON, treat it as a direct URL
          console.log('⚠️ Not valid JSON, treating as direct URL:', article.featured_image);
          imageUrl = article.featured_image;
        }
      } else if (typeof article.featured_image === 'object') {
        console.log('🔍 Using featured_image object directly:', article.featured_image);
        imageData = article.featured_image;
        imageUrl = imageData?.url || imageData?.src || '';
      }
      
      console.log('🔍 Extracted image URL:', imageUrl);
      
      if (imageUrl && isValidImageUrl(imageUrl)) {
        console.log('✅ Valid image URL found:', imageUrl);
        
        // Convert relative upload URLs to absolute URLs for cross-server access
        let displayUrl = imageUrl;
        if (displayUrl.startsWith('/uploads/')) {
          // Convert relative upload URL to absolute adminblog URL
          displayUrl = `http://localhost:4322${displayUrl}`;
          console.log('🔄 Converted relative URL to absolute:', displayUrl);
        }
        
        // Create a more robust image element with better error handling
        const sanitizedUrl = sanitizeImageUrl(displayUrl);
        
        // Check if it's a data URL (GPT-generated image)
        const isDataUrl = sanitizedUrl.startsWith('data:image/');
        
        console.log('🖼️ Creating image element with URL:', sanitizedUrl);
        
        return `
          <img 
            src="${sanitizedUrl}" 
            alt="${imageData?.alt || (article.title || 'Article')}" 
            class="w-10 h-10 rounded-lg object-cover article-image" 
            data-article-id="${article.id}"
            ${isDataUrl ? 'data-gpt-generated="true"' : ''}
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            onload="this.nextElementSibling.style.display='none';"
          />
          <div class="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0 fallback-icon" style="display: none;">
            <svg class="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
            </svg>
          </div>
        `;
      } else {
        console.log('⚠️ Invalid image data:', {
          hasImageData: !!imageData,
          hasUrl: !!imageUrl,
          url: imageUrl,
          isValidUrl: imageUrl && isValidImageUrl(imageUrl)
        });
      }
    } catch (e) {
      console.error('❌ Error parsing featured_image:', e);
      console.error('❌ Raw featured_image value:', article.featured_image);
    }
  } else {
    console.log('📭 No featured_image for article:', article.id);
  }
  
  // Return fallback icon
  return `<svg class="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
  </svg>`;
}

// Helper function to get status color
function getStatusColor(status) {
  switch (status) {
    case 'published':
      return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25 border-0';
    case 'draft':
      return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 border-0';
    case 'pending':
      return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25 border-0';
    case 'deleted':
      return 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25 border-0';
    case 'archived':
      return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg shadow-gray-500/25 border-0';
    default:
      return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-400/25 border-0';
  }
}

// Helper function to get status text
function getStatusText(status) {
  switch (status) {
    case 'published':
      return 'Publié';
    case 'draft':
      return 'Brouillon';
    case 'pending':
      return 'En attente';
    case 'archived':
      return 'Archivé';
    default:
      return status;
  }
}

// Helper function to format dates
function formatDate(dateString) {
  if (!dateString) return 'Date inconnue';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Date invalide';
    }
    
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date invalide';
  }
}

// Helper function to validate image URLs
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  // Check if it's a data URL (GPT-generated image)
  if (url.startsWith('data:image/')) {
    return true;
  }
  
  // Check if it's a server-uploaded image URL (relative or absolute)
  if (url.startsWith('/uploads/') || url.startsWith('/api/uploads/') || url.includes('/uploads/') || url.includes('/api/uploads/')) {
    return true;
  }
  
  // Check if it's a valid HTTP/HTTPS URL
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// Helper function to sanitize image URLs
function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  
  // Check if url is actually a JSON string (common issue)
  if (url.startsWith('{') && url.includes('"url"')) {
    try {
      const imageObj = JSON.parse(url);
      if (imageObj.url) {
        url = imageObj.url;
        console.log('🔧 Extracted URL from JSON object:', url);
      }
    } catch (e) {
      console.error('❌ Failed to parse JSON URL:', e);
      return '';
    }
  }
  
  // If it's a data URL, return as is (GPT-generated image)
  if (url.startsWith('data:image/')) {
    return url;
  }
  
  // If it's a local uploads URL, return as is (relative or absolute)
  if (url.startsWith('/uploads/') || url.includes('/uploads/')) {
    return url;
  }
  
  // For regular URLs, sanitize and validate
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      return urlObj.toString();
    }
    return '';
  } catch (e) {
    return '';
  }
}

// Helper function to format date - removed duplicate, using the complete one above

// Update statistics
function updateStats() {
  console.log('📊 Updating statistics...');
  
  const totalArticles = articles.length;
  const publishedArticles = articles.filter(a => a.status === 'published').length;
  const draftArticles = articles.filter(a => a.status === 'draft').length;
  const pendingArticles = articles.filter(a => a.status === 'pending').length;
  const deletedArticles = articles.filter(a => a.status === 'deleted').length;

  console.log('📈 Stats calculated:', {
    total: totalArticles,
    published: publishedArticles,
    draft: draftArticles,
    pending: pendingArticles,
    deleted: deletedArticles
  });

  // Update the articles count display
  const articlesCountElement = document.getElementById('articlesCount');
  if (articlesCountElement) {
    articlesCountElement.textContent = totalArticles;
    console.log('✅ Articles count updated:', totalArticles);
  } else {
    console.warn('⚠️ articlesCount element not found');
  }

  // Update stats display if elements exist (for future statistics cards)
  const totalElement = document.querySelector('[data-stat="total"]');
  const publishedElement = document.querySelector('[data-stat="published"]');
  const pendingElement = document.querySelector('[data-stat="pending"]');
  const deletedElement = document.querySelector('[data-stat="deleted"]');
  
  if (totalElement) {
    totalElement.textContent = totalArticles;
    console.log('✅ Total articles updated:', totalArticles);
  }
  
  if (publishedElement) publishedElement.textContent = publishedArticles;
  if (pendingElement) pendingElement.textContent = pendingArticles;
  if (deletedElement) deletedElement.textContent = deletedArticles;
}

// NEW CLEAN EDIT IMPLEMENTATION
window.editArticle = async function(articleId) {
  console.log('🔧 Starting edit for article:', articleId, 'Type:', typeof articleId);
  
  try {
    // Ensure articles are loaded
    if (!articles || articles.length === 0) {
      console.log('📜 Loading articles first...');
      await loadArticles();
    }
    
    console.log('🔍 Total articles available:', articles.length);
    
    // Find the article
    const article = findArticleById(articleId);
    if (!article) {
      console.error('❌ Article not found with ID:', articleId);
      showNotification('Article introuvable', 'error');
      return;
    }
    
    console.log('✅ Found article for editing:', {
      id: article.id,
      title: article.title,
      status: article.status
    });
    
    // Load categories
    if (categoriesCache.length === 0) {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        categoriesCache = Array.isArray(data) ? data : [];
      } catch (e) { categoriesCache = []; }
    }
    
    // Populate form
    document.getElementById('editArticleId').value = article.id;
    document.getElementById('editTitle').value = article.title || '';
    document.getElementById('editExcerpt').value = article.excerpt || '';
    document.getElementById('editContent').value = article.content || '';
    
    console.log('📋 Form populated with article data:', {
      id: article.id,
      title: article.title
    });
    
    // Set category
    const categorySelect = document.getElementById('editCategory');
    if (categorySelect) {
      categorySelect.innerHTML = '<option value="">Non catégorisé</option>';
      categoriesCache.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        if (cat.id === article.category_id) option.selected = true;
        categorySelect.appendChild(option);
      });
    }
    
    // Set status and featured
    const statusSelect = document.getElementById('editStatus');
    if (statusSelect) statusSelect.value = article.status || 'draft';
    
    const featuredSelect = document.getElementById('editFeatured');
    if (featuredSelect) featuredSelect.value = article.is_featured ? 'true' : 'false';
    
    // Show modal
    const modal = document.getElementById('editArticleModal');
    if (modal) modal.classList.remove('hidden');
    
    // Setup form handler
    setupEditHandler();
    
    console.log('✅ Edit modal opened successfully for article:', article.title);
    console.log('🔧 Modal close handlers set up');
    
    // Test if modal is visible
    setTimeout(() => {
      const modal = document.getElementById('editArticleModal');
      const isVisible = modal && !modal.classList.contains('hidden');
      console.log('👁️ Modal visibility check:', isVisible);
      
      // Test if close buttons exist
      const cancelBtnHeader = document.getElementById('cancelEditArticle');
      const cancelBtnFooter = document.getElementById('cancelEditArticleBottom');
      console.log('🖘 Close buttons found:', {
        header: !!cancelBtnHeader,
        footer: !!cancelBtnFooter
      });
    }, 100);
    
  } catch (error) {
    console.error('❌ Edit error:', error);
    showNotification('Erreur: ' + error.message, 'error');
  }
};

function setupEditHandler() {
  const form = document.getElementById('editArticleForm');
  if (!form) return;
  
  // Remove old listeners
  form.removeEventListener('submit', handleEditSubmit);
  form.addEventListener('submit', handleEditSubmit);
  
  // Setup close button handlers
  setupEditModalCloseHandlers();
}

function setupEditModalCloseHandlers() {
  // Close button in header
  const cancelBtnHeader = document.getElementById('cancelEditArticle');
  const cancelBtnFooter = document.getElementById('cancelEditArticleBottom');
  const modal = document.getElementById('editArticleModal');
  
  // Remove existing listeners to prevent duplicates
  if (cancelBtnHeader) {
    cancelBtnHeader.removeEventListener('click', closeEditModal);
    cancelBtnHeader.addEventListener('click', closeEditModal);
  }
  
  if (cancelBtnFooter) {
    cancelBtnFooter.removeEventListener('click', closeEditModal);
    cancelBtnFooter.addEventListener('click', closeEditModal);
  }
  
  // Close on backdrop click
  if (modal) {
    modal.removeEventListener('click', handleModalBackdropClick);
    modal.addEventListener('click', handleModalBackdropClick);
  }
  
  // Close on ESC key
  document.removeEventListener('keydown', handleEditModalEscKey);
  document.addEventListener('keydown', handleEditModalEscKey);
}

function closeEditModal() {
  const modal = document.getElementById('editArticleModal');
  const form = document.getElementById('editArticleForm');
  
  if (modal) {
    modal.classList.add('hidden');
  }
  
  if (form) {
    form.reset();
  }
  
  console.log('✅ Edit modal closed');
}

function handleModalBackdropClick(event) {
  // Only close if clicking on the modal backdrop (not the modal content)
  if (event.target === event.currentTarget) {
    closeEditModal();
  }
}

function handleEditModalEscKey(event) {
  if (event.key === 'Escape') {
    const modal = document.getElementById('editArticleModal');
    if (modal && !modal.classList.contains('hidden')) {
      closeEditModal();
    }
  }
}

async function handleEditSubmit(event) {
  event.preventDefault();
  
  try {
    const rawId = document.getElementById('editArticleId').value;
    const formData = {
      id: rawId, // Keep ID as string
      title: document.getElementById('editTitle').value.trim(),
      excerpt: document.getElementById('editExcerpt').value.trim(),
      content: document.getElementById('editContent').value.trim(),
      category_id: document.getElementById('editCategory').value || null,
      status: document.getElementById('editStatus').value,
      is_featured: document.getElementById('editFeatured').value === 'true'
    };
    
    console.log('📤 Submitting edit for article ID:', rawId, 'Type:', typeof rawId);
    
    if (!formData.title || !formData.content) {
      showNotification('Titre et contenu requis', 'error');
      return;
    }
    
    const response = await fetch('/api/articles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Update failed');
    }
    
    const updated = await response.json();
    
    // Update local array using string comparison
    const index = articles.findIndex(a => String(a.id) === String(rawId));
    console.log('🔍 Looking for article with ID:', rawId, 'Found at index:', index);
    
    if (index !== -1) {
      articles[index] = { ...articles[index], ...updated };
      filteredArticles = [...articles];
      renderArticles();
      updateStats();
    }
    
    // Close modal
    closeEditModal();
    
    showNotification(`Article "${updated.title}" mis à jour`, 'success');
    
  } catch (error) {
    console.error('❌ Update error:', error);
    showNotification('Erreur: ' + error.message, 'error');
  }
}





// Search functionality
function setupSearch() {
  const searchInput = document.getElementById('searchArticles');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchArticles(e.target.value);
    });
  }
}



// Debug: Ensure functions are available globally
window.addEventListener('load', () => {
  console.log('🔧 Articles.js loaded. Available functions:');
  console.log('- editArticle:', typeof window.editArticle);
  console.log('- deleteArticle:', typeof window.deleteArticle);
});

// Set up event delegation for article action buttons
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔧 Setting up article button event delegation...');
  console.log('🔧 DOM Content Loaded - articles.js is running!');
  
  // Load articles on page load
  console.log('🚀 Loading articles on page load...');
  await loadArticles();
  
  // Set up event delegation for better reliability with dynamic content
  console.log('🔧 Setting up event delegation for action buttons...');
  setupEventDelegation();
  
  console.log('✅ Article button event handlers set up successfully');
  
  // Debug: Check if buttons exist
  setTimeout(() => {
    const editBtns = document.querySelectorAll('.edit-article-btn');
    const deleteBtns = document.querySelectorAll('.delete-article-btn');
    const viewBtns = document.querySelectorAll('.view-article-btn');
    
    console.log('🔍 Found buttons:', {
      edit: editBtns.length,
      delete: deleteBtns.length,
      view: viewBtns.length
    });
    
    if (editBtns.length > 0) {
      console.log('🔍 First edit button:', editBtns[0]);
      console.log('🔍 First edit button data-article-id:', editBtns[0].dataset.articleId);
    }
  }, 1000);
});

// Set up event delegation for dynamic content
function setupEventDelegation() {
  console.log('🔧 Setting up event delegation...');
  
  // Remove any existing event listeners to prevent duplicates
  document.removeEventListener('click', handleGlobalClick);
  
  // Add event delegation for all action buttons
  document.addEventListener('click', handleGlobalClick);
  
  console.log('✅ Event delegation set up successfully');
}

// Global click handler for event delegation
function handleGlobalClick(event) {
  const target = event.target.closest('button');
  if (!target) return;
  
  const articleId = target.getAttribute('data-article-id');
  if (!articleId) return;
  
  console.log('🎯 Button clicked:', {
    className: target.className,
    articleId: articleId,
    type: typeof articleId
  });
  
  // Handle different button types
  if (target.classList.contains('view-article-btn')) {
    event.preventDefault();
    console.log('👁️ View button clicked for article:', articleId);
    if (typeof window.viewArticle === 'function') {
      window.viewArticle(articleId);
    } else {
      console.error('❌ viewArticle function not available');
      showNotification('Fonction de visualisation non disponible', 'error');
    }
  } else if (target.classList.contains('edit-article-btn')) {
    event.preventDefault();
    console.log('✏️ Edit button clicked for article:', articleId);
    if (typeof window.editArticle === 'function') {
      window.editArticle(articleId);
    } else {
      console.error('❌ editArticle function not available');
      showNotification('Fonction d\'édition non disponible', 'error');
    }
  } else if (target.classList.contains('delete-article-btn')) {
    event.preventDefault();
    console.log('🗑️ Delete button clicked for article:', articleId);
    if (typeof window.deleteArticle === 'function') {
      window.deleteArticle(articleId);
    } else {
      console.error('❌ deleteArticle function not available');
      showNotification('Fonction de suppression non disponible', 'error');
    }
  }
}

// Test function for debugging - you can call this from browser console
window.testButtonFunctionality = function() {
  console.log('🧪 Testing button functionality...');
  console.log('Articles loaded:', articles.length);
  console.log('Available functions:', {
    viewArticle: typeof window.viewArticle,
    editArticle: typeof window.editArticle,
    deleteArticle: typeof window.deleteArticle
  });
  
  const buttons = {
    edit: document.querySelectorAll('.edit-article-btn').length,
    delete: document.querySelectorAll('.delete-article-btn').length,
    view: document.querySelectorAll('.view-article-btn').length
  };
  console.log('Buttons found:', buttons);
  
  // Show all article IDs
  console.log('📋 All article IDs:', articles.map(a => ({ id: a.id, type: typeof a.id, title: a.title })));
  
  // Test edit buttons data
  const editButtons = document.querySelectorAll('.edit-article-btn');
  if (editButtons.length > 0) {
    console.log('🔧 Edit button data-article-id values:');
    editButtons.forEach((btn, index) => {
      const dataId = btn.dataset.articleId;
      console.log(`  Button ${index + 1}: data-article-id="${dataId}" (type: ${typeof dataId})`);
    });
  }
  
  // Test with first article if available
  if (articles.length > 0) {
    console.log('Testing with first article ID:', articles[0].id);
    try {
      window.viewArticle(articles[0].id);
    } catch (error) {
      console.error('Error testing viewArticle:', error);
    }
  }
};

// Debug function specifically for article ID issues
window.debugArticleIds = function() {
  console.log('🔍 Article ID Debug Report:');
  console.log('📊 Total articles loaded:', articles.length);
  
  if (articles.length > 0) {
    console.log('📋 All loaded articles:');
    articles.forEach((article, index) => {
      console.log(`  ${index + 1}. ID: ${article.id} (${typeof article.id}) - Title: "${article.title}"`);
    });
  }
  
  const editButtons = document.querySelectorAll('.edit-article-btn');
  console.log('🔧 Edit buttons in DOM:', editButtons.length);
  
  editButtons.forEach((btn, index) => {
    const dataId = btn.dataset.articleId;
    const matchingArticle = findArticleById(dataId);
    console.log(`  Button ${index + 1}: data-article-id="${dataId}" - Match found: ${!!matchingArticle}`);
    if (matchingArticle) {
      console.log(`    → Matched article: ID ${matchingArticle.id}, Title: "${matchingArticle.title}"`);
    }
  });
  
  return {
    articlesCount: articles.length,
    buttonsCount: editButtons.length,
    articleIds: articles.map(a => a.id),
    buttonIds: Array.from(editButtons).map(btn => btn.dataset.articleId)
  };
};

// Force refresh articles - useful if data gets stale
window.refreshArticles = async function() {
  console.log('🔄 Force refreshing articles...');
  articles = [];
  filteredArticles = [];
  await loadArticles();
  console.log('✅ Articles refreshed, new count:', articles.length);
  return articles.length;
};

// Test edit API directly
window.testEditAPI = async function(articleId) {
  console.log('🧪 Testing edit API directly for article ID:', articleId);
  
  if (!articleId && articles.length > 0) {
    articleId = articles[0].id;
    console.log('🔍 Using first available article ID:', articleId);
  }
  
  if (!articleId) {
    console.error('❌ No article ID provided and no articles available');
    return;
  }
  
  const testPayload = {
    id: parseInt(articleId),
    title: 'Test Edit Title - ' + new Date().toISOString(),
    content: 'Test edit content',
    excerpt: 'Test edit excerpt',
    status: 'draft',
    is_featured: false,
    author_id: 1
  };
  
  console.log('📤 Test payload:', testPayload);
  
  try {
    const response = await fetch('/api/articles', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('📡 Test response status:', response.status);
    console.log('📡 Test response ok:', response.ok);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Test successful:', result);
      return result;
    } else {
      const errorText = await response.text();
      console.error('❌ Test failed:', errorText);
      return { error: errorText };
    }
  } catch (error) {
    console.error('❌ Test error:', error);
    return { error: error.message };
  }
};

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${
    type === 'success' ? 'bg-green-500 text-white' :
    type === 'error' ? 'bg-red-500 text-white' :
    'bg-blue-500 text-white'
  }`;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => {
    notification.classList.remove('translate-x-full');
  }, 100);
  
  // Hide and remove notification
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Setup event handlers for article images
function setupArticleImageHandlers() {
  console.log('🔧 Setting up article image handlers...');
  
  // Find all article images and set up error/load handlers
  const articleImages = document.querySelectorAll('.article-image');
  console.log('🔍 Found article images:', articleImages.length);
  
  articleImages.forEach((img, index) => {
    console.log(`🔧 Setting up handlers for image ${index + 1}:`, img.src);
    
    // Set up error handler
    img.onerror = function() {
      try {
        console.log('❌ Article image failed to load:', this.src);
        console.log('🔍 this element:', this);
        console.log('🔍 this type:', typeof this);
        console.log('🔍 this has style:', this && typeof this.style !== 'undefined');
        
        // Check if this element still exists and has style property
        if (this && typeof this.style !== 'undefined') {
          this.style.display = 'none';
          console.log('✅ Article image hidden successfully');
        } else {
          console.log('⚠️ Cannot hide article image - element or style property missing');
        }
        
        // Find and show fallback icon
        const fallbackIcon = this.parentElement.querySelector('.fallback-icon');
        if (fallbackIcon && typeof fallbackIcon.style !== 'undefined') {
          fallbackIcon.style.display = 'flex';
          console.log('✅ Fallback icon shown');
        } else {
          console.log('⚠️ No fallback icon found or it has no style property');
        }
      } catch (styleError) {
        console.error('❌ Error handling article image error display:', styleError);
        console.error('❌ Error details:', {
          message: styleError.message,
          stack: styleError.stack,
          element: this,
          elementType: typeof this
        });
      }
    };
    
    // Set up load handler
    img.onload = function() {
      try {
        console.log('✅ Article image loaded successfully:', this.src);
        
        // Find and hide fallback icon
        const fallbackIcon = this.parentElement.querySelector('.fallback-icon');
        if (fallbackIcon && typeof fallbackIcon.style !== 'undefined') {
          fallbackIcon.style.display = 'none';
          console.log('✅ Fallback icon hidden');
        } else {
          console.log('⚠️ No fallback icon found or it has no style property');
        }
      } catch (styleError) {
        console.error('❌ Error handling article image load display:', styleError);
        console.error('❌ Error details:', {
          message: styleError.message,
          stack: styleError.stack,
          element: this,
          elementType: typeof this
        });
      }
    };
    
    console.log(`✅ Handlers set up for image ${index + 1}`);
  });
  
  console.log('✅ Article image handlers setup completed');
}

// Simplified action button handlers (using event delegation now)
function setupActionButtonHandlers() {
  console.log('🔧 Action button handlers managed by event delegation');
  // Event delegation handles all button clicks automatically
}

// Handle view button click
function handleViewButtonClick(event) {
  event.preventDefault();
  const articleId = parseInt(this.getAttribute('data-article-id'));
  console.log('👁️ View button clicked for article ID:', articleId);
  
  if (typeof window.viewArticle === 'function') {
    window.viewArticle(articleId);
  } else {
    console.error('❌ viewArticle function not available');
    showNotification('Fonction de visualisation non disponible', 'error');
  }
}

// Handle edit button click
function handleEditButtonClick(event) {
  event.preventDefault();
  const articleId = parseInt(this.getAttribute('data-article-id'));
  console.log('✏️ Edit button clicked for article ID:', articleId);
  
  if (typeof window.editArticle === 'function') {
    window.editArticle(articleId);
  } else {
    console.error('❌ editArticle function not available');
    showNotification('Fonction d\'édition non disponible', 'error');
  }
}



// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM loaded, initializing articles...');
  console.log('🔍 Looking for articlesCount element...');
  const articlesCountElement = document.getElementById('articlesCount');
  if (articlesCountElement) {
    console.log('✅ Found articlesCount element:', articlesCountElement);
    console.log('📊 Current articles count text:', articlesCountElement.textContent);
  } else {
    console.error('❌ articlesCount element not found!');
  }
  
  // Set up event delegation for action buttons (CRITICAL FIX)
  console.log('🔧 Setting up event delegation for action buttons...');
  document.addEventListener('click', function(event) {
    // Handle delete button clicks
    if (event.target.closest('.delete-article-btn')) {
      event.preventDefault();
      const deleteBtn = event.target.closest('.delete-article-btn');
      const articleId = deleteBtn.getAttribute('data-article-id');
      console.log('🗑️ Delete button clicked via delegation, article ID:', articleId);
      
      if (typeof window.deleteArticle === 'function') {
        window.deleteArticle(articleId); // Pass as string, don't parseInt
      } else {
        console.error('❌ deleteArticle function not available');
        showNotification('Delete function not available', 'error');
      }
      return;
    }
    
    // Handle edit button clicks
    if (event.target.closest('.edit-article-btn')) {
      event.preventDefault();
      const editBtn = event.target.closest('.edit-article-btn');
      const articleId = editBtn.getAttribute('data-article-id');
      console.log('✏️ Edit button clicked via delegation, article ID:', articleId);
      
      if (typeof window.editArticle === 'function') {
        window.editArticle(articleId); // Pass as string, don't parseInt
      } else {
        console.error('❌ editArticle function not available');
        showNotification('Edit function not available', 'error');
      }
      return;
    }
    
    // Handle view button clicks
    if (event.target.closest('.view-article-btn')) {
      event.preventDefault();
      const viewBtn = event.target.closest('.view-article-btn');
      const articleId = viewBtn.getAttribute('data-article-id');
      console.log('👁️ View button clicked via delegation, article ID:', articleId);
      
      if (typeof window.viewArticle === 'function') {
        window.viewArticle(articleId); // Pass as string, don't parseInt
      } else {
        console.error('❌ viewArticle function not available');
        showNotification('View function not available', 'error');
      }
      return;
    }
  });
  console.log('✅ Event delegation set up successfully');
  
  // Also set up the edit form handler immediately
  console.log('🔧 Setting up edit form handler...');
  setupEditFormHandler();
  console.log('✅ Edit form handler set up');
  
  // Also set up save button handler
  const saveButton = document.getElementById('saveEditArticleBtn');
  if (saveButton) {
    console.log('🔍 Setting up save button click handler...');
    saveButton.removeEventListener('click', handleSaveButtonClick);
    saveButton.addEventListener('click', handleSaveButtonClick);
    console.log('✅ Save button handler set up');
  } else {
    console.log('⚠️ Save button not found during initial setup');
  }
  
  loadArticles();
  setupSearch();
  setupImageHandlers();
  setupArticleImageHandlers();
  
  // Expose functions to global scope for HTML onclick handlers
  console.log('🌐 Exposing functions to global scope...');
  
  // Make sure functions exist before exposing
  if (typeof window.deleteArticle === 'function') {
    console.log('✅ deleteArticle exposed');
  } else {
    console.error('❌ deleteArticle function not found');
  }
  
  console.log('✅ Functions exposed to global scope');
  
  // Test function availability
  console.log('🔍 Testing global functions:');
  console.log('  - window.deleteArticle:', typeof window.deleteArticle);
});

// Simple test function for the new delete function
window.testDelete = function(articleId) {
  console.log('🧪 Testing new delete function with ID:', articleId);
  
  if (typeof window.deleteArticle === 'function') {
    console.log('✅ Delete function found');
    window.deleteArticle(articleId);
    return 'Delete function called';
  } else {
    console.error('❌ Delete function not found');
    return 'Delete function not available';
  }
};





// Test function to debug article deletion issues
window.debugDeleteIssue = function() {
  console.log('🔍 Debugging article deletion issues...');
  console.log('📊 Articles loaded:', articles.length);
  console.log('📋 Available articles:', articles.map(a => ({ id: a.id, type: typeof a.id, title: a.title })));
  
  // Test API endpoints
  console.log('🧪 Testing API endpoints...');
  
  // Test GET articles
  fetch('/api/articles')
    .then(response => {
      console.log('📡 GET /api/articles status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('📦 GET /api/articles response:', data);
      if (data.length > 0) {
        console.log('✅ Articles API working, first article:', data[0]);
        return data[0].id;
      } else {
        console.log('⚠️ No articles found');
        return null;
      }
    })
    .then(articleId => {
      if (articleId) {
        console.log('🧪 Testing DELETE API with article ID:', articleId);
        // Test soft delete
        return fetch(`/api/articles?id=${articleId}`, { method: 'DELETE' });
      }
    })
    .then(response => {
      if (response) {
        console.log('📡 DELETE response status:', response.status);
        return response.text();
      }
    })
    .then(result => {
      if (result) {
        console.log('📄 DELETE response:', result);
      }
    })
    .catch(error => {
      console.error('❌ API test error:', error);
    });
  
  return 'Debug test completed';
};
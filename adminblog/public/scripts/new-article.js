// Get current user from localStorage
const currentUser = localStorage.getItem('adminUser') || 'Admin';

// Set current date as default publish date
const today = new Date().toISOString().split('T')[0];

// Check if we're editing an existing article
let isEditing = false;
let editingArticleId = null;

// Store uploaded images data for preview
let uploadedImages = {
  featured: null,
  additional: []
};

// Check URL parameters for edit mode
function checkEditMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  
  if (editId) {
    isEditing = true;
    editingArticleId = parseInt(editId);
    loadArticleForEditing(editingArticleId);
  }
}

// Load article data for editing
function loadArticleForEditing(articleId) {
  try {
    const editingArticle = JSON.parse(localStorage.getItem('editingArticle'));
    if (!editingArticle || editingArticle.id !== articleId) {
      console.error('Article à éditer non trouvé');
      return;
    }

    // Update page title and description
    const pageTitle = document.getElementById('pageTitle');
    const pageDescription = document.getElementById('pageDescription');
    const publishBtnText = document.getElementById('publishBtnText');
    
    if (pageTitle) pageTitle.textContent = 'Modifier l\'Article';
    if (pageDescription) pageDescription.textContent = 'Modifiez votre article existant';
    if (publishBtnText) publishBtnText.textContent = 'Mettre à jour l\'article';

    // Fill form fields
    document.getElementById('title').value = editingArticle.title || '';
    // Set content in rich text editor or textarea
    if (window.simpleRichTextEditor) {
      window.simpleRichTextEditor.setContent(editingArticle.content || '');
    } else {
      document.getElementById('content').value = editingArticle.content || '';
    }
    document.getElementById('excerpt').value = editingArticle.excerpt || '';
    document.getElementById('publishDate').value = editingArticle.publishDate || today;
    document.getElementById('featured').checked = editingArticle.featured || false;
    
    // Set category
    const categorySelect = document.getElementById('category');
    if (categorySelect) {
      // Wait for categories to load, then set the value
      setTimeout(() => {
        categorySelect.value = editingArticle.category || '';
      }, 100);
    }

    // Load featured image if exists
    if (editingArticle.featuredImage && editingArticle.featuredImage.src) {
      uploadedImages.featured = {
        src: editingArticle.featuredImage.src,
        name: editingArticle.featuredImage.name,
        size: editingArticle.featuredImage.size,
        type: editingArticle.featuredImage.type
      };
      
      // Show image preview
      if (previewImg) {
        previewImg.src = editingArticle.featuredImage.src;
        previewImg.alt = editingArticle.featuredImage.name;
      }
      
      if (imagePreview) {
        imagePreview.classList.remove('hidden');
      }
      
      if (imageUploadArea) {
        imageUploadArea.classList.add('hidden');
      }
      
      if (imageInfo) {
        imageInfo.textContent = `${editingArticle.featuredImage.name} (${(editingArticle.featuredImage.size / 1024 / 1024).toFixed(2)} MB)`;
      }
      
      // Set image metadata
      if (editingArticle.featuredImage.alt) {
        document.getElementById('imageAlt').value = editingArticle.featuredImage.alt;
      }
      if (editingArticle.featuredImage.caption) {
        document.getElementById('imageCaption').value = editingArticle.featuredImage.caption;
      }
      if (editingArticle.featuredImage.position) {
        document.getElementById('imagePosition').value = editingArticle.featuredImage.position;
      }
    }

    // Load additional images if exist
    if (editingArticle.additionalImages && editingArticle.additionalImages.length > 0) {
      uploadedImages.additional = editingArticle.additionalImages.filter(img => img.src).map(img => ({
        src: img.src,
        name: img.name,
        size: img.size,
        type: img.type
      }));
      
      if (additionalImagesPreview && uploadedImages.additional.length > 0) {
        additionalImagesPreview.classList.remove('hidden');
      }
      
      if (additionalImagesGrid) {
        additionalImagesGrid.innerHTML = '';
        
        uploadedImages.additional.forEach((img, index) => {
          const imgContainer = document.createElement('div');
          imgContainer.className = 'relative group';
          imgContainer.innerHTML = `
            <img src="${img.src}" alt="${img.name}" class="w-full h-24 object-cover rounded-lg">
            <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <button onclick="removeAdditionalImage(${index})" class="bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          `;
          additionalImagesGrid.appendChild(imgContainer);
        });
      }
    }

    console.log('Article chargé pour édition:', editingArticle);
    
  } catch (error) {
    console.error('Erreur lors du chargement de l\'article pour édition:', error);
  }
}

// Load user categories from database API
async function loadUserCategories() {
  try {
    console.log('🔄 Chargement des catégories depuis la base de données...');
    
    // Try to load from database API first
    try {
      const response = await fetch('/api/categories');
      console.log('📡 Categories API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📁 Categories API raw response:', result);
        
        // Handle different response formats
        let categories = [];
        if (Array.isArray(result)) {
          // Direct array response
          categories = result;
        } else if (result.success && result.categories) {
          // Wrapped response
          categories = result.categories;
        } else if (result.categories) {
          // Just categories field
          categories = result.categories;
        }
        
        console.log('✅ Catégories chargées depuis la base de données:', categories.length);
        
        if (categories.length > 0) {
          // Update localStorage with fresh data
          localStorage.setItem('userCategories', JSON.stringify(categories));
          
          // Update category select
          updateCategorySelect(categories);
          return;
        }
      } else {
        console.warn(`⚠️ API error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.warn('Error response:', errorText.substring(0, 200));
      }
    } catch (apiError) {
      console.warn('⚠️ Échec du chargement depuis l\'API:', apiError.message);
    }
    
    // Fallback to localStorage
    const userCategories = JSON.parse(localStorage.getItem('userCategories') || '[]');
    if (userCategories.length > 0) {
      console.log('📁 Catégories chargées depuis localStorage:', userCategories.length);
      updateCategorySelect(userCategories);
    } else {
      console.log('📁 Aucune catégorie trouvée - créez-en une première');
      // Show empty state message
      const categorySelect = document.getElementById('category');
      if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Aucune catégorie disponible - Créez-en une</option>';
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du chargement des catégories:', error);
  }
}

// Update category select dropdown
function updateCategorySelect(categories) {
  const categorySelect = document.getElementById('category');
  if (!categorySelect) return;
  
  // Clear existing options except the first one
  const firstOption = categorySelect.querySelector('option');
  categorySelect.innerHTML = '';
  if (firstOption) {
    categorySelect.appendChild(firstOption);
  }
  
  // Add categories
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.name;
    option.textContent = `${category.icon || '📁'} ${category.name}`;
    categorySelect.appendChild(option);
  });
  
  console.log(`✅ ${categories.length} catégories ajoutées au sélecteur`);
}

// Load categories on page load
document.addEventListener('DOMContentLoaded', () => {
  // Set current user and date
  if (document.getElementById('author')) {
    document.getElementById('author').value = currentUser;
  }
  if (document.getElementById('publishDate')) {
    document.getElementById('publishDate').value = today;
  }
  
  loadUserCategories();
  initializeCategoryModal();
  checkEditMode(); // Check if we're editing
  
  // Initialize Simple Rich Text Editor
  initializeSimpleRichTextEditor();
  
  // Add event listeners for action buttons
  const previewBtn = document.getElementById('previewBtn');
  const saveAsDraftBtn = document.getElementById('saveAsDraft');
  const publishBtn = document.getElementById('publishBtn');
  
  if (previewBtn) {
    previewBtn.addEventListener('click', handlePreview);
  }
  
  if (saveAsDraftBtn) {
    saveAsDraftBtn.addEventListener('click', () => handleSubmit('draft'));
  }
  
  if (publishBtn) {
    publishBtn.addEventListener('click', () => handleSubmit('published'));
  }
});

// Character counter for excerpt
const excerptTextarea = document.getElementById('excerpt');
const excerptCounter = document.getElementById('excerptCount');

if (excerptTextarea && excerptCounter) {
  function updateCounter(input, counter, max) {
    const count = input.value.length;
    counter.textContent = count + '/' + max;
    if (count > max * 0.9) {
      counter.classList.add('text-red-500');
      counter.classList.remove('text-gray-500');
    } else {
      counter.classList.remove('text-red-500');
      counter.classList.add('text-gray-500');
    }
  }

  excerptTextarea.addEventListener('input', () => updateCounter(excerptTextarea, excerptCounter, 200));
}

// Image upload functionality
const imageUploadArea = document.getElementById('imageUploadArea');
const featuredImageInput = document.getElementById('featuredImage');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeImageBtn = document.getElementById('removeImage');
const editImageBtn = document.getElementById('editImage');
const imageInfo = document.getElementById('imageInfo');

const additionalImagesArea = document.getElementById('additionalImagesArea');
const additionalImagesInput = document.getElementById('additionalImages');
const additionalImagesPreview = document.getElementById('additionalImagesPreview');
const additionalImagesGrid = document.getElementById('additionalImagesGrid');

// Featured image upload
if (imageUploadArea) {
  imageUploadArea.addEventListener('click', () => featuredImageInput.click());

  imageUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageUploadArea.classList.add('border-blue-400', 'dark:border-blue-500');
  });

  imageUploadArea.addEventListener('dragleave', () => {
    imageUploadArea.classList.remove('border-blue-400', 'dark:border-blue-500');
  });

  imageUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    imageUploadArea.classList.remove('border-blue-400', 'dark:border-blue-500');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      featuredImageInput.files = files;
      handleImageUpload(files[0]);
    }
  });
}

if (featuredImageInput) {
  featuredImageInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleImageUpload(e.target.files[0]);
    }
  });
}

// Handle image upload
async function handleImageUpload(file) {
  if (!file) return;
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'image/bmp', 'image/tiff', 'image/x-icon'];
  if (!validTypes.includes(file.type)) {
    alert('Type de fichier non supporté. Veuillez utiliser une image.');
    return;
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('Fichier trop volumineux. Taille maximum : 5MB');
    return;
  }
  
  try {
    console.log('📤 Uploading image to server...');
    
    // Create FormData for upload
    const formData = new FormData();
    formData.append('image', file);
    formData.append('filename', file.name);
    formData.append('source', 'manual-upload');
    
    // Upload to server
    const response = await fetch('/api/uploads', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    const uploadResult = await response.json();
    console.log('✅ Image uploaded successfully:', uploadResult);
    
    // Store image data with server URL
    uploadedImages.featured = {
      src: uploadResult.url, // Use server URL instead of data URL
      name: file.name,
      size: file.size,
      type: file.type,
      file: file, // Keep the File object for reference
      serverUrl: uploadResult.url, // Store the server URL
      filename: uploadResult.filename
    };
    
    // Update UI
    if (previewImg) {
      previewImg.src = uploadResult.url;
      previewImg.alt = file.name;
    }
    
    if (imagePreview) {
      imagePreview.classList.remove('hidden');
    }
    
    if (imageInfo) {
      imageInfo.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) - ✅ Uploadé`;
    }
    
    if (imageUploadArea) {
      imageUploadArea.classList.add('hidden');
    }
    
    console.log('🖼️ Image data stored:', uploadedImages.featured);
    
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    alert(`Erreur lors de l'upload: ${error.message}`);
    
    // Fallback: use data URL if upload fails
    console.log('🔄 Using fallback data URL...');
    const reader = new FileReader();
    reader.onload = function(e) {
      uploadedImages.featured = {
        src: e.target.result,
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
        isDataUrl: true // Mark as data URL fallback
      };
      
      if (previewImg) {
        previewImg.src = e.target.result;
        previewImg.alt = file.name;
      }
      
      if (imagePreview) {
        imagePreview.classList.remove('hidden');
      }
      
      if (imageInfo) {
        imageInfo.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) - ⚠️ Stocké localement`;
      }
      
      if (imageUploadArea) {
        imageUploadArea.classList.add('hidden');
      }
    };
    reader.readAsDataURL(file);
  }
}

// Remove image
if (removeImageBtn) {
  removeImageBtn.addEventListener('click', () => {
    if (featuredImageInput) {
      featuredImageInput.value = '';
    }
    if (imagePreview) {
      imagePreview.classList.add('hidden');
    }
    if (imageUploadArea) {
      imageUploadArea.classList.remove('hidden');
    }
    if (imageInfo) {
      imageInfo.textContent = '';
    }
    uploadedImages.featured = null;
  });
}

// Edit image
if (editImageBtn) {
  editImageBtn.addEventListener('click', () => {
    if (featuredImageInput) {
      featuredImageInput.click();
    }
  });
}

// Additional images functionality
if (additionalImagesArea) {
  additionalImagesArea.addEventListener('click', () => additionalImagesInput.click());
  
  additionalImagesArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    additionalImagesArea.classList.add('border-blue-400', 'dark:border-blue-500');
  });
  
  additionalImagesArea.addEventListener('dragleave', () => {
    additionalImagesArea.classList.remove('border-blue-400', 'dark:border-blue-500');
  });
  
  additionalImagesArea.addEventListener('drop', (e) => {
    e.preventDefault();
    additionalImagesArea.classList.remove('border-blue-400', 'dark:border-blue-500');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      additionalImagesInput.files = files;
      handleAdditionalImages(files);
    }
  });
}

if (additionalImagesInput) {
  additionalImagesInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleAdditionalImages(e.target.files);
    }
  });
}

// Handle additional images
function handleAdditionalImages(files) {
  if (!files || files.length === 0) return;
  
  uploadedImages.additional = [];
  
  if (additionalImagesPreview) {
    additionalImagesPreview.classList.remove('hidden');
  }
  
  if (additionalImagesGrid) {
    additionalImagesGrid.innerHTML = '';
    
    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        // Store image data for preview
        uploadedImages.additional.push({
          src: e.target.result,
          name: file.name,
          size: file.size,
          type: file.type
        });
        
        const imgContainer = document.createElement('div');
        imgContainer.className = 'relative group';
        imgContainer.innerHTML = `
          <img src="${e.target.result}" alt="${file.name}" class="w-full h-24 object-cover rounded-lg">
          <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <button onclick="removeAdditionalImage(${index})" class="bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        `;
        additionalImagesGrid.appendChild(imgContainer);
      };
      reader.readAsDataURL(file);
    });
  }
}

// Remove additional image
function removeAdditionalImage(index) {
  const dt = new DataTransfer();
  const input = document.getElementById('additionalImages');
  const { files } = input;
  
  for (let i = 0; i < files.length; i++) {
    if (i !== index) {
      dt.items.add(files[i]);
    }
  }
  
  input.files = dt.files;
  uploadedImages.additional.splice(index, 1);
  handleAdditionalImages(input.files);
  
  if (input.files.length === 0 && additionalImagesPreview) {
    additionalImagesPreview.classList.add('hidden');
  }
}

// Category modal functionality
function initializeCategoryModal() {
  const categoryModal = document.getElementById('categoryModal');
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  const closeCategoryModal = document.getElementById('closeCategoryModal');
  const cancelCategory = document.getElementById('cancelCategory');
  const categoryForm = document.getElementById('categoryForm');
  
  console.log('🔍 Category Modal Elements:');
  console.log('- categoryModal:', categoryModal);
  console.log('- addCategoryBtn:', addCategoryBtn);
  console.log('- closeCategoryModal:', closeCategoryModal);
  console.log('- cancelCategory:', cancelCategory);
  console.log('- categoryForm:', categoryForm);
  
  if (addCategoryBtn) {
    console.log('✅ Add Category button found and event listener added');
    addCategoryBtn.addEventListener('click', () => {
      console.log('🎯 Add Category button clicked!');
      if (categoryModal) {
        console.log('📱 Opening category modal');
        categoryModal.classList.remove('hidden');
      } else {
        console.log('❌ Category modal not found');
      }
    });
  } else {
    console.log('❌ Add Category button not found');
  }
  
  if (closeCategoryModal) {
    closeCategoryModal.addEventListener('click', () => {
      if (categoryModal) {
        categoryModal.classList.add('hidden');
      }
    });
  }
  
  if (cancelCategory) {
    cancelCategory.addEventListener('click', () => {
      if (categoryModal) {
        categoryModal.classList.add('hidden');
      }
    });
  }
  
  if (categoryForm) {
    categoryForm.addEventListener('submit', handleAddCategory);
  }
}

// Handle category creation
async function handleAddCategory(e) {
  e.preventDefault();
  
  const name = document.getElementById('newCategoryName').value.trim();
  const description = document.getElementById('newCategoryDesc').value.trim();
  
  if (!name) {
    alert('Veuillez saisir un nom pour la catégorie.');
    return;
  }
  
  let newCategory = null; // Declare outside try blocks
  
  try {
    console.log('🚀 Création de la catégorie:', { name, description });
    
    // Try to send to database API first (development only)
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Catégorie créée avec succès dans la base de données:', result);
        
        // Create new category object for local use
        newCategory = {
          id: result.categoryId,
          name: name,
          description: description,
          icon: '📁',
          createdAt: new Date().toISOString(),
          articleCount: 0
        };
        
        // Also save to localStorage as backup
        try {
          let existingCategories = JSON.parse(localStorage.getItem('userCategories') || '[]');
          existingCategories.push(newCategory);
          localStorage.setItem('userCategories', JSON.stringify(existingCategories));
          console.log('💾 Catégorie également sauvegardée dans localStorage');
        } catch (localStorageError) {
          console.warn('⚠️ Échec de la sauvegarde localStorage (non critique):', localStorageError);
        }
      } else {
        // API failed, fallback to localStorage only
        console.warn('⚠️ API échouée, création dans localStorage uniquement');
        throw new Error('API unavailable');
      }
    } catch (apiError) {
      console.warn('⚠️ Échec de l\'API, utilisation du localStorage uniquement:', apiError);
      
      // Fallback to localStorage only
      newCategory = {
        id: Date.now(),
        name: name,
        description: description,
        icon: '📁',
        createdAt: new Date().toISOString(),
        articleCount: 0
      };
      
      let existingCategories = JSON.parse(localStorage.getItem('userCategories') || '[]');
      existingCategories.push(newCategory);
      localStorage.setItem('userCategories', JSON.stringify(existingCategories));
      console.log('💾 Catégorie créée dans localStorage (mode hors ligne)');
    }
    
    // Update category select
    const categorySelect = document.getElementById('category');
    if (categorySelect && newCategory) {
      const option = document.createElement('option');
      option.value = newCategory.name;
      option.textContent = `${newCategory.icon} ${newCategory.name}`;
      categorySelect.appendChild(option);
    }
    
    // Close modal
    const categoryModal = document.getElementById('categoryModal');
    if (categoryModal) {
      categoryModal.classList.add('hidden');
    }
    
    // Reset form
    document.getElementById('newCategoryName').value = '';
    document.getElementById('newCategoryDesc').value = '';
    
    // Show success message
    const message = newCategory ? `Catégorie "${name}" créée avec succès !` : 'Catégorie créée avec succès !';
    alert(message);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la catégorie:', error);
    alert('Erreur lors de la création de la catégorie: ' + error.message);
  }
}

// Handle preview
function handlePreview() {
  console.log('🎯 Preview button clicked!');
  
  // Get preview button and show loading state
  const previewBtn = document.getElementById('previewBtn');
  const originalText = previewBtn.innerHTML;
  
  if (previewBtn) {
    previewBtn.innerHTML = 
      '<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">' +
        '<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>' +
        '<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>' +
      '</svg>' +
      '<span>Génération de l\'aperçu...</span>';
    previewBtn.disabled = true;
  }
  
  // Get all form elements
  const title = document.getElementById('title');
  const content = document.getElementById('content');
  const excerpt = document.getElementById('excerpt');
  const category = document.getElementById('category');
  const publishDate = document.getElementById('publishDate');
  const featured = document.getElementById('featured');
  const imageAlt = document.getElementById('imageAlt');
  const imageCaption = document.getElementById('imageCaption');
  
  console.log('📝 Form elements found:', { title, content, excerpt, category, publishDate, featured, imageAlt, imageCaption });
  
  if (!title || !content) {
    console.error('❌ Title or content element not found!');
    alert('Erreur: Éléments de formulaire manquants. Veuillez recharger la page.');
    resetPreviewButton(previewBtn, originalText);
    return;
  }
  
  const titleValue = title.value.trim();
  const contentValue = content.value.trim();
  const excerptValue = excerpt?.value?.trim() || '';
  const categoryValue = category?.value || 'Non catégorisé';
  const publishDateValue = publishDate?.value || today;
  const isFeatured = featured?.checked || false;
  const imageAltValue = imageAlt?.value?.trim() || '';
  const imageCaptionValue = imageCaption?.value?.trim() || '';
  
  console.log('📋 Form values:', { 
    titleValue, 
    contentValue, 
    excerptValue, 
    categoryValue, 
    publishDateValue, 
    isFeatured,
    imageAltValue,
    imageCaptionValue
  });
  
  if (!titleValue || !contentValue) {
    alert('Veuillez saisir un titre et du contenu pour prévisualiser l\'article.');
    resetPreviewButton(previewBtn, originalText);
    return;
  }
  
  console.log('🖼️ Uploaded images state:', uploadedImages);
  console.log('🚀 Calling showPreview with all data');
  
  // Call showPreview and reset button when done
  try {
    showPreview(titleValue, contentValue, excerptValue, categoryValue, publishDateValue, isFeatured, imageAltValue, imageCaptionValue);
    resetPreviewButton(previewBtn, originalText);
  } catch (error) {
    console.error('❌ Preview error:', error);
    resetPreviewButton(previewBtn, originalText);
    alert('Erreur lors de la génération de l\'aperçu: ' + error.message);
  }
}

// Reset preview button to original state
function resetPreviewButton(button, originalText) {
  if (button) {
    button.innerHTML = originalText;
    button.disabled = false;
  }
}

// Clean localStorage function to prevent corruption
function cleanLocalStorage() {
  try {
    const articles = localStorage.getItem('userArticles');
    if (articles) {
      const parsed = JSON.parse(articles);
      if (!Array.isArray(parsed)) {
        console.warn('Corruption détectée dans localStorage, nettoyage...');
        localStorage.removeItem('userArticles');
        return [];
      }
      return parsed;
    }
    return [];
  } catch (error) {
    console.error('Erreur lors du nettoyage du localStorage:', error);
    localStorage.removeItem('userArticles');
    return [];
  }
}

// Handle form submission
async function handleSubmit(status) {
  const title = document.getElementById('title').value.trim();
  // Get content from rich text editor or textarea
  let content;
  if (window.simpleRichTextEditor) {
    content = window.simpleRichTextEditor.getContent().trim();
  } else {
    content = document.getElementById('content').value.trim();
  }
  const category = document.getElementById('category').value;
  const featuredImage = document.getElementById('featuredImage').files[0];
  
  if (!title) {
    alert('Veuillez saisir un titre pour l\'article.');
    document.getElementById('title').focus();
    return;
  }
  
  if (!content) {
    alert('Veuillez saisir le contenu de l\'article.');
    document.getElementById('content').focus();
    return;
  }
  
  if (!category) {
    alert('Veuillez sélectionner une catégorie.');
    document.getElementById('category').focus();
    return;
  }
  
  // Check if we have a featured image (make it optional for now)
  if (!uploadedImages.featured || !uploadedImages.featured.src) {
    console.warn('Image à la une manquante, création d\'article sans image');
    // Don't return, allow article creation without image
  } else {
    console.log('Image à la une détectée:', uploadedImages.featured);
  }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('content', content);
  formData.append('category', category);
  formData.append('excerpt', document.getElementById('excerpt').value);
  formData.append('author', currentUser);
  formData.append('publishDate', document.getElementById('publishDate').value);
  formData.append('featured', document.getElementById('featured').checked);
  
  const imageAlt = document.getElementById('imageAlt')?.value || '';
  const imageCaption = document.getElementById('imageCaption')?.value || '';
  const imagePosition = document.getElementById('imagePosition')?.value || 'top';
  
  const additionalImages = Array.from(document.getElementById('additionalImages').files);
  
  // Clean and validate image data
  let cleanFeaturedImage = null;
  if (uploadedImages.featured && uploadedImages.featured.src) {
    console.log('🔍 Processing featured image for article:', uploadedImages.featured);
    cleanFeaturedImage = {
      name: uploadedImages.featured.name || 'image.jpg',
      size: uploadedImages.featured.size || 0,
      type: uploadedImages.featured.type || 'image/jpeg',
      src: uploadedImages.featured.src,
      alt: imageAlt || '',
      caption: imageCaption || '',
      position: imagePosition || 'top'
    };
    console.log('✅ Clean featured image created:', cleanFeaturedImage);
  } else {
    console.log('📁 No featured image to process');
  }
  
  // Clean additional images data
  const cleanAdditionalImages = [];
  if (uploadedImages.additional && uploadedImages.additional.length > 0) {
    uploadedImages.additional.forEach((img, index) => {
      if (img && img.src && img.name) {
        cleanAdditionalImages.push({
          name: img.name || '',
          size: img.size || 0,
          type: img.type || '',
          src: img.src
        });
      }
    });
  }
  
  console.log('Images supplémentaires nettoyées:', cleanAdditionalImages.length);
  
  // Validate featured image (make it optional)
  if (!cleanFeaturedImage.src) {
    console.warn('Image à la une manquante, article sera créé sans image');
    cleanFeaturedImage = null; // Set to null if no image
  } else {
    console.log('Image à la une validée:', cleanFeaturedImage);
  }
  
  const articleData = {
    id: isEditing ? editingArticleId : Date.now(),
    title: title,
    content: content,
    excerpt: document.getElementById('excerpt').value || '',
    category: category,
    author: currentUser,
    publishDate: document.getElementById('publishDate').value || new Date().toISOString().split('T')[0],
    featured: document.getElementById('featured').checked || false,
    slug: generateSlug(title),
    lastModified: new Date().toISOString().split('T')[0],
    views: isEditing ? (JSON.parse(localStorage.getItem('editingArticle') || '{}').views || 0) : 0,
    likes: isEditing ? (JSON.parse(localStorage.getItem('editingArticle') || '{}').likes || 0) : 0,
    comments: isEditing ? (JSON.parse(localStorage.getItem('editingArticle') || '{}').comments || 0) : 0,
    readTime: calculateReadTime(content),
    status: status,
    featuredImage: cleanFeaturedImage,
    additionalImages: cleanAdditionalImages
  };
  
  // Save article to database via API
  try {
    console.log('🚀 Tentative de sauvegarde de l\'article dans la base de données:', articleData);
    
    // Validate article data before saving
    if (!articleData.title || !articleData.content || !articleData.category) {
      throw new Error('Données d\'article invalides');
    }
    
    // Prepare data for API
    const apiData = {
      title: articleData.title,
      content: articleData.content,
      excerpt: articleData.excerpt,
      category: articleData.category,
      status: articleData.status,
      is_featured: articleData.featured, // Map 'featured' to 'is_featured' for backend
      featured_image: cleanFeaturedImage ? {
        url: cleanFeaturedImage.serverUrl || cleanFeaturedImage.src, // Use server URL if available, fallback to src
        filename: cleanFeaturedImage.filename || cleanFeaturedImage.name,
        size: cleanFeaturedImage.size,
        type: cleanFeaturedImage.type,
        alt: cleanFeaturedImage.alt || '',
        caption: cleanFeaturedImage.caption || '',
        position: cleanFeaturedImage.position || 'top'
      } : null,
      authorId: 1, // Default admin user ID
      categoryId: null // Will be resolved by category name
    };
    
    console.log('📤 Données envoyées à l\'API:', apiData);
    console.log('🖼️ Featured image data being sent:', apiData.featured_image);
    
    // Try to send to database API first (development only)
    try {
      // Send as JSON since images are already uploaded
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Article sauvegardé avec succès dans la base de données:', result);
        
        // Also save to localStorage as backup
        try {
          let existingArticles = cleanLocalStorage();
          if (isEditing) {
            const articleIndex = existingArticles.findIndex(a => a.id === editingArticleId);
            if (articleIndex !== -1) {
              existingArticles[articleIndex] = { ...articleData, dbId: result.articleId };
            } else {
              existingArticles.push({ ...articleData, dbId: result.articleId });
            }
          } else {
            existingArticles.push({ ...articleData, dbId: result.articleId });
          }
          
          localStorage.setItem('userArticles', JSON.stringify(existingArticles));
          console.log('💾 Article également sauvegardé dans localStorage comme sauvegarde');
        } catch (localStorageError) {
          console.warn('⚠️ Échec de la sauvegarde localStorage (non critique):', localStorageError);
        }
      } else {
        // API failed, fallback to localStorage only
        console.warn('⚠️ API échouée, sauvegarde dans localStorage uniquement');
        throw new Error('API unavailable');
      }
    } catch (apiError) {
      console.warn('⚠️ Échec de l\'API, utilisation du localStorage uniquement:', apiError);
      
      // Fallback to localStorage only
      let existingArticles = cleanLocalStorage();
      if (isEditing) {
        const articleIndex = existingArticles.findIndex(a => a.id === editingArticleId);
        if (articleIndex !== -1) {
          existingArticles[articleIndex] = articleData;
        } else {
          existingArticles.push(articleData);
        }
      } else {
        existingArticles.push(articleData);
      }
      
      localStorage.setItem('userArticles', JSON.stringify(existingArticles));
      console.log('💾 Article sauvegardé dans localStorage (mode hors ligne)');
    }
    
    const submitBtn = document.getElementById('publishBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = 
      '<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">' +
        '<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>' +
        '<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>' +
      '</svg>' +
      'Sauvegarde en cours...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      
      const actionText = isEditing ? 'modifié' : (status === 'draft' ? 'sauvegardé comme brouillon' : 'publié');
      showSuccessMessage(articleData.title, actionText);
      
      // Clear editing data
      if (isEditing) {
        localStorage.removeItem('editingArticle');
      }
      
      setTimeout(() => {
        window.location.href = '/admin/articles';
      }, 2000);
    }, 1500);
    
  } catch (error) {
    console.error('Erreur détaillée lors de la sauvegarde:', error);
    console.error('Stack trace:', error.stack);
    console.error('Article data:', articleData);
    
    // Show more specific error message
    let errorMessage = 'Erreur lors de la sauvegarde de l\'article. ';
    if (error.message.includes('QuotaExceededError')) {
      errorMessage += 'Espace de stockage insuffisant. Veuillez libérer de l\'espace.';
    } else if (error.message.includes('SecurityError')) {
      errorMessage += 'Erreur de sécurité. Vérifiez vos paramètres de navigateur.';
    } else {
      errorMessage += 'Veuillez réessayer. Détails dans la console.';
    }
    
    alert(errorMessage);
    
    // Re-enable submit button
    const submitBtn = document.getElementById('publishBtn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Publier';
    }
  }
}

// Initialize Simple Rich Text Editor
function initializeSimpleRichTextEditor() {
  try {
    const container = document.getElementById('rich-text-editor');
    if (!container) {
      console.error('Rich text editor container not found');
      return;
    }
    
    // Create toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'rich-text-toolbar';
    toolbar.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      padding: 12px 16px;
      background-color: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      gap: 8px;
      min-height: 60px;
    `;
    
    // Apply dark mode to toolbar
    const applyToolbarDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark') ||
                        document.body.classList.contains('dark') ||
                        document.documentElement.getAttribute('data-theme') === 'dark' ||
                        document.body.getAttribute('data-theme') === 'dark';
      
      if (isDarkMode) {
        toolbar.style.backgroundColor = '#1f2937';
        toolbar.style.borderBottom = '1px solid #374151';
      } else {
        toolbar.style.backgroundColor = '#f9fafb';
        toolbar.style.borderBottom = '1px solid #e5e7eb';
      }
    };
    
    // Apply initial toolbar dark mode
    applyToolbarDarkMode();
    
    // Watch for dark mode changes on toolbar
    const toolbarObserver = new MutationObserver(() => {
      applyToolbarDarkMode();
    });
    toolbarObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    toolbarObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    
    // Format buttons
    const buttons = [
      { command: 'bold', icon: 'B', title: 'Gras' },
      { command: 'italic', icon: 'I', title: 'Italique' },
      { command: 'underline', icon: 'U', title: 'Souligné' },
      { command: 'strikeThrough', icon: 'S', title: 'Barré' },
      { command: 'superscript', icon: 'x²', title: 'Exposant' },
      { command: 'subscript', icon: 'x₂', title: 'Indice' },
      { command: 'justifyLeft', icon: '⬅', title: 'Gauche' },
      { command: 'justifyCenter', icon: '↔', title: 'Centre' },
      { command: 'justifyRight', icon: '➡', title: 'Droite' },
      { command: 'justifyFull', icon: '⬌', title: 'Justifier' },
      { command: 'insertUnorderedList', icon: '•', title: 'Liste' },
      { command: 'insertOrderedList', icon: '1.', title: 'Numérotée' },
      { command: 'outdent', icon: '⬅', title: 'Diminuer l\'indentation' },
      { command: 'indent', icon: '➡', title: 'Augmenter l\'indentation' },
      { command: 'createLink', icon: '🔗', title: 'Insérer un lien' },
      { command: 'insertHorizontalRule', icon: '—', title: 'Ligne horizontale' }
    ];
    
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'rich-text-btn';
      button.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        background: transparent;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s ease;
        color: #374151;
      `;
      button.innerHTML = btn.icon;
      button.title = btn.title;
      button.onclick = () => executeCommand(btn.command);
      toolbar.appendChild(button);
    });
    
    // Add separator
    const separator1 = document.createElement('div');
    separator1.style.cssText = `
      width: 1px;
      height: 24px;
      background-color: #d1d5db;
      margin: 0 8px;
    `;
    toolbar.appendChild(separator1);
    
    // Font family dropdown
    const fontSelect = document.createElement('select');
    fontSelect.className = 'rich-text-select';
    fontSelect.style.cssText = `
      padding: 6px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      font-size: 13px;
      cursor: pointer;
      color: #374151;
      min-width: 120px;
    `;
    fontSelect.innerHTML = `
      <option value="">Police par défaut</option>
      <option value="Arial">Arial</option>
      <option value="Helvetica">Helvetica</option>
      <option value="Times New Roman">Times New Roman</option>
      <option value="Georgia">Georgia</option>
      <option value="Verdana">Verdana</option>
      <option value="Courier New">Courier New</option>
    `;
    fontSelect.onchange = () => executeCommand('fontName', fontSelect.value);
    toolbar.appendChild(fontSelect);
    
    // Font size dropdown
    const sizeSelect = document.createElement('select');
    sizeSelect.className = 'rich-text-select';
    sizeSelect.style.cssText = `
      padding: 6px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      font-size: 13px;
      cursor: pointer;
      color: #374151;
      min-width: 80px;
    `;
    sizeSelect.innerHTML = `
      <option value="">Taille</option>
      <option value="8px">8px</option>
      <option value="9px">9px</option>
      <option value="10px">10px</option>
      <option value="11px">11px</option>
      <option value="12px">12px</option>
      <option value="14px">14px</option>
      <option value="16px">16px</option>
      <option value="18px">18px</option>
      <option value="20px">20px</option>
      <option value="24px">24px</option>
      <option value="28px">28px</option>
      <option value="32px">32px</option>
      <option value="36px">36px</option>
      <option value="48px">48px</option>
    `;
    sizeSelect.onchange = () => executeCommand('fontSize', sizeSelect.value);
    toolbar.appendChild(sizeSelect);
    
    // Add separator
    const separator2 = document.createElement('div');
    separator2.style.cssText = `
      width: 1px;
      height: 24px;
      background-color: #d1d5db;
      margin: 0 8px;
    `;
    toolbar.appendChild(separator2);
    
    // Color picker
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.style.cssText = `
      width: 36px;
      height: 36px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      cursor: pointer;
      background: #000000;
    `;
    colorInput.title = 'Couleur du texte';
    colorInput.value = '#000000';
    colorInput.onchange = () => executeCommand('foreColor', colorInput.value);
    toolbar.appendChild(colorInput);
    
    // Background color picker
    const bgColorInput = document.createElement('input');
    bgColorInput.type = 'color';
    bgColorInput.style.cssText = `
      width: 36px;
      height: 36px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      cursor: pointer;
      background: #ffffff;
    `;
    bgColorInput.title = 'Couleur de fond';
    bgColorInput.value = '#ffffff';
    bgColorInput.onchange = () => executeCommand('backColor', bgColorInput.value);
    toolbar.appendChild(bgColorInput);
    
    // Add separator
    const separator3 = document.createElement('div');
    separator3.style.cssText = `
      width: 1px;
      height: 24px;
      background-color: #d1d5db;
      margin: 0 8px;
    `;
    toolbar.appendChild(separator3);
    
    // Headers dropdown
    const headerSelect = document.createElement('select');
    headerSelect.className = 'rich-text-select';
    headerSelect.style.cssText = `
      padding: 6px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      font-size: 13px;
      cursor: pointer;
      color: #374151;
      min-width: 100px;
    `;
    headerSelect.innerHTML = `
      <option value="">Format</option>
      <option value="h1">Titre 1</option>
      <option value="h2">Titre 2</option>
      <option value="h3">Titre 3</option>
      <option value="h4">Titre 4</option>
      <option value="h5">Titre 5</option>
      <option value="h6">Titre 6</option>
      <option value="p">Paragraphe</option>
      <option value="blockquote">Citation</option>
      <option value="pre">Code</option>
    `;
    headerSelect.onchange = () => executeCommand('formatBlock', headerSelect.value);
    toolbar.appendChild(headerSelect);
    
    // Table and layout buttons
    const tableButtons = [
      { command: 'insertTable', icon: '⊞', title: 'Insérer un tableau' },
      { command: 'insertTableRow', icon: '⤴', title: 'Ajouter une ligne' },
      { command: 'insertTableColumn', icon: '⤵', title: 'Ajouter une colonne' },
      { command: 'deleteTableRow', icon: '🗑️', title: 'Supprimer la ligne' },
      { command: 'deleteTableColumn', icon: '🗑️', title: 'Supprimer la colonne' },
      { command: 'insertDiv', icon: '▦', title: 'Insérer un conteneur' },
      { command: 'insertSpan', icon: '📦', title: 'Insérer un span' }
    ];
    
    tableButtons.forEach(btn => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'rich-text-btn';
      button.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        background: transparent;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s ease;
        color: #374151;
      `;
      button.innerHTML = btn.icon;
      button.title = btn.title;
      button.onclick = () => executeCustomCommand(btn.command);
      toolbar.appendChild(button);
    });
    
    // Add separator
    const separator4 = document.createElement('div');
    separator4.style.cssText = `
      width: 1px;
      height: 24px;
      background-color: #d1d5db;
      margin: 0 8px;
    `;
    toolbar.appendChild(separator4);
    
    // Numbering styles dropdown
    const numberingSelect = document.createElement('select');
    numberingSelect.className = 'rich-text-select';
    numberingSelect.style.cssText = `
      padding: 6px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      font-size: 13px;
      cursor: pointer;
      color: #374151;
      min-width: 120px;
    `;
    numberingSelect.innerHTML = `
      <option value="">Numérotation</option>
      <option value="decimal">1. 2. 3. (Décimal)</option>
      <option value="lower-alpha">a. b. c. (Alphabétique)</option>
      <option value="upper-alpha">A. B. C. (Majuscules)</option>
      <option value="lower-roman">i. ii. iii. (Romain minuscule)</option>
      <option value="upper-roman">I. II. III. (Romain majuscule)</option>
      <option value="disc">• (Puces)</option>
      <option value="circle">○ (Cercles)</option>
      <option value="square">■ (Carrés)</option>
    `;
    numberingSelect.onchange = () => applyNumberingStyle(numberingSelect.value);
    toolbar.appendChild(numberingSelect);
    
    // Special formatting buttons
    const specialButtons = [
      { command: 'removeFormat', icon: '🧹', title: 'Effacer le formatage' },
      { command: 'undo', icon: '↶', title: 'Annuler' },
      { command: 'redo', icon: '↷', title: 'Refaire' },
      { command: 'selectAll', icon: '☰', title: 'Tout sélectionner' },
      { command: 'copy', icon: '📋', title: 'Copier' },
      { command: 'cut', icon: '✂️', title: 'Couper' },
      { command: 'paste', icon: '📄', title: 'Coller' }
    ];
    
    specialButtons.forEach(btn => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'rich-text-btn';
      button.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        background: transparent;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s ease;
        color: #374151;
      `;
      button.innerHTML = btn.icon;
      button.title = btn.title;
      button.onclick = () => executeCommand(btn.command);
      toolbar.appendChild(button);
    });
    
    // Create content area
    const contentArea = document.createElement('div');
    contentArea.className = 'rich-text-content';
    contentArea.contentEditable = true;
    contentArea.style.cssText = `
      min-height: 500px;
      padding: 20px;
      outline: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #374151;
      overflow-y: auto;
      background-color: #ffffff;
    `;
    contentArea.innerHTML = '<p style="color: #9ca3af; font-style: italic; margin: 0;">Commencez à taper votre article ici... Vous pouvez utiliser tous les outils de formatage disponibles dans la barre d\'outils ci-dessus.</p>';
    
    // Apply dark mode styling
    const applyDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark') ||
                        document.body.classList.contains('dark') ||
                        document.documentElement.getAttribute('data-theme') === 'dark' ||
                        document.body.getAttribute('data-theme') === 'dark';
      
      if (isDarkMode) {
        contentArea.style.backgroundColor = '#1f2937';
        contentArea.style.color = '#ffffff';
        contentArea.innerHTML = '<p style="color: #9ca3af; font-style: italic; margin: 0;">Commencez à taper votre article ici... Vous pouvez utiliser tous les outils de formatage disponibles dans la barre d\'outils ci-dessus.</p>';
      } else {
        contentArea.style.backgroundColor = '#ffffff';
        contentArea.style.color = '#374151';
        contentArea.innerHTML = '<p style="color: #9ca3af; font-style: italic; margin: 0;">Commencez à taper votre article ici... Vous pouvez utiliser tous les outils de formatage disponibles dans la barre d\'outils ci-dessus.</p>';
      }
    };
    
    // Apply initial dark mode styling
    applyDarkMode();
    
    // Watch for dark mode changes
    const observer = new MutationObserver(() => {
      applyDarkMode();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    
    // Add event listeners
    contentArea.addEventListener('input', () => {
      const hiddenTextarea = document.getElementById('content');
      if (hiddenTextarea) {
        hiddenTextarea.value = contentArea.innerHTML;
      }
    });
    
    contentArea.addEventListener('focus', () => {
      if (contentArea.innerHTML.includes('Commencez à taper votre article ici')) {
        contentArea.innerHTML = '';
      }
    });
    
    // Assemble editor
    container.appendChild(toolbar);
    container.appendChild(contentArea);
    
    // Store reference
    window.simpleRichTextEditor = {
      contentArea: contentArea,
      getContent: () => contentArea.innerHTML,
      setContent: (html) => { contentArea.innerHTML = html; }
    };
    
    console.log('Simple Rich Text Editor initialized successfully');
  } catch (error) {
    console.error('Error initializing Simple Rich Text Editor:', error);
  }
}

// Execute formatting commands
function executeCommand(command, value = null) {
  try {
    if (command === 'createLink') {
      const url = prompt('Entrez l\'URL du lien:');
      if (url) {
        document.execCommand(command, false, url);
      }
    } else if (command === 'formatBlock' && value) {
      document.execCommand(command, false, value);
    } else {
      document.execCommand(command, false, value);
    }
  } catch (error) {
    console.error('Error executing command:', command, error);
  }
}

// Execute custom commands for tables and layouts
function executeCustomCommand(command) {
  try {
    const contentArea = window.simpleRichTextEditor?.contentArea;
    if (!contentArea) return;
    
    switch (command) {
      case 'insertTable':
        insertTable();
        break;
      case 'insertTableRow':
        insertTableRow();
        break;
      case 'insertTableColumn':
        insertTableColumn();
        break;
      case 'deleteTableRow':
        deleteTableRow();
        break;
      case 'deleteTableColumn':
        deleteTableColumn();
        break;
      case 'insertDiv':
        insertDiv();
        break;
      case 'insertSpan':
        insertSpan();
        break;
      default:
        console.warn('Unknown custom command:', command);
    }
  } catch (error) {
    console.error('Error executing custom command:', command, error);
  }
}

// Insert table
function insertTable() {
  const rows = prompt('Nombre de lignes:', '3');
  const cols = prompt('Nombre de colonnes:', '3');
  
  if (rows && cols && !isNaN(rows) && !isNaN(cols)) {
    const table = document.createElement('table');
    table.style.cssText = `
      border-collapse: collapse;
      width: 100%;
      margin: 10px 0;
      border: 1px solid #d1d5db;
    `;
    
    for (let i = 0; i < parseInt(rows); i++) {
      const row = document.createElement('tr');
      for (let j = 0; j < parseInt(cols); j++) {
        const cell = document.createElement(i === 0 ? 'th' : 'td');
        cell.textContent = i === 0 ? `En-tête ${j + 1}` : `Cellule ${i}-${j + 1}`;
        cell.style.cssText = `
          border: 1px solid #d1d5db;
          padding: 8px;
          text-align: left;
        `;
        if (i === 0) {
          cell.style.backgroundColor = '#f3f4f6';
          cell.style.fontWeight = 'bold';
        }
        row.appendChild(cell);
      }
      table.appendChild(row);
    }
    
    insertHTML(table.outerHTML);
  }
}

// Insert table row
function insertTableRow() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const table = range.commonAncestorContainer.closest('table');
    if (table) {
      const newRow = document.createElement('tr');
      const colCount = table.rows[0].cells.length;
      for (let i = 0; i < colCount; i++) {
        const cell = document.createElement('td');
        cell.textContent = 'Nouvelle cellule';
        cell.style.cssText = 'border: 1px solid #d1d5db; padding: 8px;';
        newRow.appendChild(cell);
      }
      table.appendChild(newRow);
    } else {
      alert('Veuillez placer le curseur dans un tableau');
    }
  }
}

// Insert table column
function insertTableColumn() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const table = range.commonAncestorContainer.closest('table');
    if (table) {
      for (let i = 0; i < table.rows.length; i++) {
        const cell = document.createElement(i === 0 ? 'th' : 'td');
        cell.textContent = i === 0 ? 'Nouvel en-tête' : 'Nouvelle cellule';
        cell.style.cssText = 'border: 1px solid #d1d5db; padding: 8px;';
        if (i === 0) {
          cell.style.backgroundColor = '#f3f4f6';
          cell.style.fontWeight = 'bold';
        }
        table.rows[i].appendChild(cell);
      }
    } else {
      alert('Veuillez placer le curseur dans un tableau');
    }
  }
}

// Delete table row
function deleteTableRow() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const table = range.commonAncestorContainer.closest('table');
    const row = range.commonAncestorContainer.closest('tr');
    if (table && row && table.rows.length > 1) {
      row.remove();
    } else {
      alert('Impossible de supprimer la dernière ligne du tableau');
    }
  }
}

// Delete table column
function deleteTableColumn() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const table = range.commonAncestorContainer.closest('table');
    const cell = range.commonAncestorContainer.closest('td, th');
    if (table && cell && table.rows[0].cells.length > 1) {
      const colIndex = Array.from(table.rows[0].cells).indexOf(cell);
      for (let i = 0; i < table.rows.length; i++) {
        if (table.rows[i].cells[colIndex]) {
          table.rows[i].cells[colIndex].remove();
        }
      }
    } else {
      alert('Impossible de supprimer la dernière colonne du tableau');
    }
  }
}

// Insert div container
function insertDiv() {
  const div = document.createElement('div');
  div.style.cssText = `
    margin: 10px 0;
    padding: 15px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background-color: #f9fafb;
    min-height: 50px;
  `;
  div.innerHTML = '<p>Contenu du conteneur...</p>';
  insertHTML(div.outerHTML);
}

// Insert span
function insertSpan() {
  const span = document.createElement('span');
  span.style.cssText = `
    background-color: #fef3c7;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #f59e0b;
  `;
  span.textContent = 'Texte en surbrillance';
  insertHTML(span.outerHTML);
}

// Apply numbering style
function applyNumberingStyle(style) {
  if (!style) return;
  
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const list = document.createElement('ol');
    
    if (style === 'disc' || style === 'circle' || style === 'square') {
      list = document.createElement('ul');
      list.style.listStyleType = style;
    } else {
      list.style.listStyleType = style;
    }
    
    const items = ['Premier élément', 'Deuxième élément', 'Troisième élément'];
    items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      li.style.cssText = 'margin: 5px 0; padding: 5px;';
      list.appendChild(li);
    });
    
    range.deleteContents();
    range.insertNode(list);
  }
}

// Insert HTML helper
function insertHTML(html) {
  const contentArea = window.simpleRichTextEditor?.contentArea;
  if (contentArea) {
    contentArea.focus();
    document.execCommand('insertHTML', false, html);
  }
}

// Utility functions
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}

function calculateReadTime(content) {
  const wordsPerMinute = 300; // Increased from 200 to 300
  const wordCount = content.split(/\s+/).length;
  return Math.min(Math.ceil(wordCount / wordsPerMinute), 5); // Cap at 5 minutes max
}

// Show preview function - Enhanced version!
function showPreview(title, content, excerpt = '', category = 'Non catégorisé', publishDate = '', isFeatured = false, imageAlt = '', imageCaption = '') {
  console.log('🎨 showPreview called with:', { title, content, excerpt, category, publishDate, isFeatured, imageAlt, imageCaption });
  
  // Ensure uploadedImages is properly initialized
  if (typeof uploadedImages === 'undefined') {
    console.warn('⚠️ uploadedImages is undefined, initializing...');
    uploadedImages = {
      featured: null,
      additional: []
    };
  }
  
  console.log('🖼️ Current uploadedImages state:', uploadedImages);
  
  const previewWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  console.log('🪟 Preview window opened:', previewWindow);
  
  if (!previewWindow) {
    console.error('❌ Failed to open preview window - popup blocked?');
    alert('Impossible d\'ouvrir la fenêtre d\'aperçu. Vérifiez que les popups ne sont pas bloqués.');
    return;
  }
  
  // Use provided parameters or fallback to form values
  const finalCategory = category || document.getElementById('category')?.value || 'Non catégorisé';
  const finalExcerpt = excerpt || document.getElementById('excerpt')?.value || content.substring(0, 200) + '...';
  const finalPublishDate = publishDate || document.getElementById('publishDate')?.value || new Date().toISOString().split('T')[0];
  const finalIsFeatured = isFeatured || document.getElementById('featured')?.checked || false;
  const finalImageAlt = imageAlt || document.getElementById('imageAlt')?.value || '';
  const finalImageCaption = imageCaption || document.getElementById('imageCaption')?.value || '';
  
  console.log('📊 Final preview data:', { 
    finalCategory, 
    finalExcerpt, 
    finalPublishDate, 
    finalIsFeatured,
    finalImageAlt,
    finalImageCaption 
  });
  
  let previewContent = 
    '<!DOCTYPE html>' +
    '<html lang="fr">' +
    '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>Aperçu - ' + title + '</title>' +
      '<script src="https://cdn.tailwindcss.com"></script>' +
      '<script>' +
        '// Fallback if Tailwind CDN fails' +
        'setTimeout(() => {' +
          'if (typeof tailwind === "undefined") {' +
            'console.warn("Tailwind CDN failed, using basic CSS");' +
            'const style = document.createElement("style");' +
            'style.textContent = "' +
              '.bg-white { background-color: white; }' +
              '.dark\\:bg-gray-900 { background-color: #111827; }' +
              '.text-gray-900 { color: #111827; }' +
              '.dark\\:text-white { color: white; }' +
              '.max-w-4xl { max-width: 56rem; }' +
              '.mx-auto { margin-left: auto; margin-right: auto; }' +
              '.p-8 { padding: 2rem; }' +
              '.mb-8 { margin-bottom: 2rem; }' +
              '.pb-8 { padding-bottom: 2rem; }' +
              '.border-b { border-bottom-width: 1px; }' +
              '.border-gray-200 { border-color: #e5e7eb; }' +
              '.dark\\:border-gray-700 { border-color: #374151; }' +
              '.text-3xl { font-size: 1.875rem; }' +
              '.font-bold { font-weight: 700; }' +
              '.mb-4 { margin-bottom: 1rem; }' +
              '.text-lg { font-size: 1.125rem; }' +
              '.text-gray-600 { color: #4b5563; }' +
              '.dark\\:text-gray-400 { color: #9ca3af; }' +
              '.italic { font-style: italic; }' +
              '.w-full { width: 100%; }' +
              '.max-h-96 { max-height: 24rem; }' +
              '.object-cover { object-fit: cover; }' +
              '.rounded-lg { border-radius: 0.5rem; }' +
              '.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }' +
              '.text-center { text-align: center; }' +
              '.text-sm { font-size: 0.875rem; }' +
              '.mt-2 { margin-top: 0.5rem; }' +
              '.mt-1 { margin-top: 0.25rem; }' +
              '.text-xs { font-size: 0.75rem; }' +
              '.text-gray-500 { color: #6b7280; }' +
              '.dark\\:text-gray-400 { color: #9ca3af; }' +
              '.whitespace-pre-wrap { white-space: pre-wrap; }' +
              '.leading-relaxed { line-height: 1.625; }' +
              '.text-base { font-size: 1rem; }' +
              '.leading-7 { line-height: 1.75; }' +
              '.mt-8 { margin-top: 2rem; }' +
              '.pt-8 { padding-top: 2rem; }' +
              '.border-t { border-top-width: 1px; }' +
              '.border-gray-200 { border-color: #e5e7eb; }' +
              '.dark\\:border-gray-700 { border-color: #374151; }' +
              '.text-xl { font-size: 1.25rem; }' +
              '.font-semibold { font-weight: 600; }' +
              '.grid { display: grid; }' +
              '.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }' +
              '.md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }' +
              '.gap-4 { gap: 1rem; }' +
              '.h-32 { height: 8rem; }' +
              '.shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }' +
              '.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }' +
              '.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }' +
              '.rounded-full { border-radius: 9999px; }' +
              '.bg-blue-100 { background-color: #dbeafe; }' +
              '.text-blue-800 { color: #1e40af; }' +
              '.bg-yellow-100 { background-color: #fef3c7; }' +
              '.text-yellow-800 { color: #92400e; }' +
              '.bg-gray-100 { background-color: #f3f4f6; }' +
              '.text-gray-800 { color: #1f2937; }' +
            '";' +
            'document.head.appendChild(style);' +
          '}' +
        '}, 1000);' +
      '</script>' +
    '</head>' +
    '<body class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">' +
      '<div class="max-w-4xl mx-auto p-8">' +
        '<header class="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">' +
          '<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">' + title + '</h1>' +
          '<div class="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400 mb-4">' +
            '<span>Par ' + currentUser + '</span>' +
            '<span>' + new Date(finalPublishDate).toLocaleDateString('fr-FR') + '</span>' +
            '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">' + finalCategory + '</span>' +
            (finalIsFeatured ? '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">⭐ En vedette</span>' : '') +
            '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">Aperçu</span>' +
          '</div>' +
          (finalExcerpt ? '<p class="text-lg text-gray-600 dark:text-gray-400 italic">' + finalExcerpt + '</p>' : '') +
        '</header>';
  
  // Add featured image if exists - with safety checks
  if (uploadedImages && uploadedImages.featured && uploadedImages.featured.src) {
    console.log('🖼️ Adding featured image to preview:', uploadedImages.featured);
    previewContent += 
      '<div class="mb-8">' +
        '<img src="' + uploadedImages.featured.src + '" alt="' + (finalImageAlt || uploadedImages.featured.name || title) + '" class="w-full max-h-96 object-cover rounded-lg shadow-lg">';
    
    if (finalImageCaption) {
      previewContent += '<p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-2 italic">' + finalImageCaption + '</p>';
    }
    
    if (finalImageAlt) {
      previewContent += '<p class="text-center text-xs text-gray-500 dark:text-gray-400 mt-1">Alt: ' + finalImageAlt + '</p>';
    }
    
    previewContent += '</div>';
  } else {
    console.log('📷 No featured image to add to preview. uploadedImages state:', uploadedImages);
    // Add a placeholder for better preview experience
    previewContent += 
      '<div class="mb-8 p-8 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">' +
        '<svg class="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>' +
        '</svg>' +
        '<p class="text-gray-500 dark:text-gray-400">Aucune image à la une</p>' +
        '<p class="text-sm text-gray-400 dark:text-gray-500">Ajoutez une image pour améliorer votre article</p>' +
      '</div>';
  }
  
  previewContent +=
        '<article class="prose prose-lg dark:prose-invert max-w-none">' +
          '<div class="whitespace-pre-wrap leading-relaxed text-base leading-7 text-gray-800 dark:text-gray-200">' + content + '</div>' +
        '</article>';
  
  // Add additional images if exist - with safety checks
  if (uploadedImages && uploadedImages.additional && uploadedImages.additional.length > 0) {
    console.log('Adding additional images to preview:', uploadedImages.additional.length);
    previewContent += 
      '<div class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">' +
        '<h3 class="text-xl font-semibold mb-4">Images supplémentaires</h3>' +
        '<div class="grid grid-cols-2 md:grid-cols-3 gap-4">';
    
    uploadedImages.additional.forEach(img => {
      if (img && img.src) {
        previewContent += 
          '<img src="' + img.src + '" alt="' + (img.name || 'Image') + '" class="w-full h-32 object-cover rounded-lg shadow-md">';
      }
    });
    
    previewContent += '</div></div>';
  }
  
  previewContent +=
        '<footer class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">' +
          '<p>Ceci est un aperçu de votre article. Les modifications ne sont pas encore sauvegardées.</p>' +
          '<p class="mt-2">Temps de lecture estimé: ' + Math.ceil(content.split(' ').length / 200) + ' min</p>' +
        '</footer>' +
      '</div>' +
    '</body>' +
    '</html>';
  
  console.log('📏 Preview content length:', previewContent.length);
  console.log('✍️ Writing content to preview window...');
  
  try {
    previewWindow.document.write(previewContent);
    previewWindow.document.close();
    console.log('✅ Preview content written successfully!');
    
    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300';
    successMsg.innerHTML = 
      '<div class="flex items-center space-x-2">' +
        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>' +
        '</svg>' +
        '<span>Aperçu ouvert dans une nouvelle fenêtre</span>' +
      '</div>';
    
    document.body.appendChild(successMsg);
    
    // Remove success message after 3 seconds
    setTimeout(() => {
      successMsg.remove();
    }, 3000);
    
  } catch (error) {
    console.error('❌ Error writing preview content:', error);
    alert('Erreur lors de la création de l\'aperçu: ' + error.message);
  }
}

function showSuccessMessage(title, action) {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
  notification.innerHTML = 
    '<div class="flex items-center space-x-3">' +
      '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>' +
      '</svg>' +
      '<div>' +
        '<h4 class="font-semibold">Article ' + action + ' avec succès !</h4>' +
        '<p class="text-sm opacity-90">"' + title + '" a été ' + action + '</p>' +
      '</div>' +
    '</div>';
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.classList.remove('translate-x-full');
  }, 100);
  
  // Animate out and remove
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

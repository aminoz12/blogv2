// Rich Text Editor for Article Content
class RichTextEditor {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      placeholder: 'Rédigez le contenu complet de votre article...',
      height: '400px',
      ...options
    };
    
    this.editor = null;
    this.toolbar = null;
    this.contentArea = null;
    this.isInitialized = false;
    
    // Undo/Redo system
    this.history = [];
    this.historyIndex = -1;
    this.maxHistorySize = 50;
    
    this.init();
  }
  
  init() {
    if (!this.container) {
      console.error('RichTextEditor: Container not found');
      return;
    }
    
    this.createEditor();
    this.setupEventListeners();
    this.isInitialized = true;
  }
  
  createEditor() {
    // Create editor wrapper
    const editorWrapper = document.createElement('div');
    editorWrapper.className = 'rich-text-editor-wrapper';
    editorWrapper.style.border = '1px solid #d1d5db';
    editorWrapper.style.borderRadius = '0.5rem';
    editorWrapper.style.overflow = 'hidden';
    editorWrapper.style.backgroundColor = '#ffffff';
    
    // Create toolbar
    this.toolbar = this.createToolbar();
    editorWrapper.appendChild(this.toolbar);
    
    // Create content area
    this.contentArea = this.createContentArea();
    editorWrapper.appendChild(this.contentArea);
    
    // Replace the original textarea
    this.container.parentNode.replaceChild(editorWrapper, this.container);
    
    // Store reference to the editor
    this.editor = editorWrapper;
  }
  
  createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'rich-text-toolbar';
    toolbar.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      padding: 8px 12px;
      background-color: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      gap: 4px;
    `;
    
    // Apply dark mode styling if needed
    this.applyDarkModeStyling(toolbar);
    
    // Format buttons
    const formatButtons = [
      { command: 'bold', icon: 'B', title: 'Gras' },
      { command: 'italic', icon: 'I', title: 'Italique' },
      { command: 'underline', icon: 'U', title: 'Souligné' },
      { command: 'strikeThrough', icon: 'S', title: 'Barré' },
      { command: 'superscript', icon: 'x²', title: 'Exposant' },
      { command: 'subscript', icon: 'x₂', title: 'Indice' }
    ];
    
    // Add format buttons
    formatButtons.forEach(btn => {
      toolbar.appendChild(this.createButton(btn.command, btn.icon, btn.title));
    });
    
    // Separator
    toolbar.appendChild(this.createSeparator());
    
    // Font family dropdown
    toolbar.appendChild(this.createFontFamilyDropdown());
    
    // Font size dropdown
    toolbar.appendChild(this.createFontSizeDropdown());
    
    // Separator
    toolbar.appendChild(this.createSeparator());
    
    // Text color picker
    toolbar.appendChild(this.createColorPicker('foreColor', 'Couleur du texte', '#000000'));
    
    // Background color picker
    toolbar.appendChild(this.createColorPicker('backColor', 'Couleur de fond', '#ffffff'));
    
    // Separator
    toolbar.appendChild(this.createSeparator());
    
    // Alignment buttons
    const alignButtons = [
      { command: 'justifyLeft', icon: '⬅', title: 'Aligner à gauche' },
      { command: 'justifyCenter', icon: '↔', title: 'Centrer' },
      { command: 'justifyRight', icon: '➡', title: 'Aligner à droite' },
      { command: 'justifyFull', icon: '⬌', title: 'Justifier' }
    ];
    
    alignButtons.forEach(btn => {
      toolbar.appendChild(this.createButton(btn.command, btn.icon, btn.title));
    });
    
    // Separator
    toolbar.appendChild(this.createSeparator());
    
    // List buttons - Enhanced with more Word-like options
    const listButtons = [
      { command: 'insertUnorderedList', icon: '•', title: 'Liste à puces' },
      { command: 'insertOrderedList', icon: '1.', title: 'Liste numérotée' },
      { command: 'insertUnorderedList', icon: '◦', title: 'Liste à puces vides', customAction: 'insertEmptyBulletList' },
      { command: 'insertOrderedList', icon: 'a.', title: 'Liste alphabétique', customAction: 'insertAlphaList' },
      { command: 'insertOrderedList', icon: 'i.', title: 'Liste romaine', customAction: 'insertRomanList' },
      { command: 'outdent', icon: '⬅', title: 'Diminuer l\'indentation' },
      { command: 'indent', icon: '➡', title: 'Augmenter l\'indentation' }
    ];
    
    listButtons.forEach(btn => {
      if (btn.customAction) {
        toolbar.appendChild(this.createCustomButton(btn.customAction, btn.icon, btn.title));
      } else {
        toolbar.appendChild(this.createButton(btn.command, btn.icon, btn.title));
      }
    });
    
    // Separator
    toolbar.appendChild(this.createSeparator());
    
    // Link and media buttons (removed image button)
    const mediaButtons = [
      { command: 'createLink', icon: '🔗', title: 'Insérer un lien' },
      { command: 'insertHorizontalRule', icon: '—', title: 'Ligne horizontale' }
    ];
    
    mediaButtons.forEach(btn => {
      toolbar.appendChild(this.createButton(btn.command, btn.icon, btn.title));
    });
    
    // Separator
    toolbar.appendChild(this.createSeparator());
    
    // Special formatting
    const specialButtons = [
      { command: 'formatBlock', value: 'h1', icon: 'H1', title: 'Titre 1' },
      { command: 'formatBlock', value: 'h2', icon: 'H2', title: 'Titre 2' },
      { command: 'formatBlock', value: 'h3', icon: 'H3', title: 'Titre 3' },
      { command: 'formatBlock', value: 'h4', icon: 'H4', title: 'Titre 4' },
      { command: 'formatBlock', value: 'h5', icon: 'H5', title: 'Titre 5' },
      { command: 'formatBlock', value: 'h6', icon: 'H6', title: 'Titre 6' },
      { command: 'formatBlock', value: 'p', icon: 'P', title: 'Paragraphe' },
      { command: 'formatBlock', value: 'blockquote', icon: '❝', title: 'Citation' }
    ];
    
    specialButtons.forEach(btn => {
      toolbar.appendChild(this.createButton(btn.command, btn.icon, btn.title, btn.value));
    });
    
    // Separator
    toolbar.appendChild(this.createSeparator());
    
    // Advanced formatting buttons (Word-like features)
    const advancedButtons = [
      { command: 'formatBlock', value: 'pre', icon: '{}', title: 'Code', customAction: 'insertCodeBlock' },
      { customAction: 'insertAddress', icon: '📍', title: 'Adresse' },
      { customAction: 'insertContainer', icon: '▦', title: 'Conteneur' },
      { customAction: 'insertTable', icon: '⊞', title: 'Insérer un tableau' },
      { customAction: 'insertLineBreak', icon: '↵', title: 'Saut de ligne' },
      { customAction: 'insertNonBreakingSpace', icon: '␣', title: 'Espace insécable' }
    ];
    
    advancedButtons.forEach(btn => {
      if (btn.customAction) {
        toolbar.appendChild(this.createCustomButton(btn.customAction, btn.icon, btn.title));
      } else {
        toolbar.appendChild(this.createButton(btn.command, btn.icon, btn.title, btn.value));
      }
    });
    
    // Separator
    toolbar.appendChild(this.createSeparator());
    
    // Text effects and styles
    const textEffectButtons = [
      { customAction: 'insertHighlight', icon: '🖍️', title: 'Surligner le texte' },
      { customAction: 'insertSmallCaps', icon: 'Aa', title: 'Petites capitales' },
      { customAction: 'insertAllCaps', icon: 'AA', title: 'MAJUSCULES' },
      { customAction: 'insertToggleCase', icon: 'Aa', title: 'Inverser la casse' },
      { customAction: 'insertWordCount', icon: '📊', title: 'Compteur de mots' }
    ];
    
    textEffectButtons.forEach(btn => {
      toolbar.appendChild(this.createCustomButton(btn.customAction, btn.icon, btn.title));
    });
    
    // Separator
    toolbar.appendChild(this.createSeparator());
    
    // Clear formatting
    toolbar.appendChild(this.createCustomButton('clearFormatting', '🧹', 'Effacer le formatage'));
    
    // Undo/Redo
    toolbar.appendChild(this.createCustomButton('undo', '↶', 'Annuler'));
    toolbar.appendChild(this.createCustomButton('redo', '↷', 'Refaire'));
    
    return toolbar;
  }
  
  createContentArea() {
    const contentArea = document.createElement('div');
    contentArea.className = 'rich-text-content';
    contentArea.contentEditable = true;
    contentArea.style.cssText = `
      min-height: ${this.options.height};
      padding: 16px;
      outline: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #374151;
      overflow-y: auto;
    `;
    
    // Set placeholder
    if (this.options.placeholder) {
      contentArea.setAttribute('data-placeholder', this.options.placeholder);
      this.setupPlaceholder(contentArea);
    }
    
    return contentArea;
  }
  
  createButton(command, icon, title, value = null) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rich-text-btn';
    button.innerHTML = icon;
    button.title = title;
    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#e5e7eb';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'transparent';
    });
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.executeCommand(command, value);
    });
    
    return button;
  }
  
  createCustomButton(action, icon, title) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rich-text-btn';
    button.innerHTML = icon;
    button.title = title;
    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#e5e7eb';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'transparent';
    });
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.executeCustomAction(action);
    });
    
    return button;
  }
  
  createSeparator() {
    const separator = document.createElement('div');
    separator.style.cssText = `
      width: 1px;
      height: 24px;
      background-color: #d1d5db;
      margin: 0 4px;
    `;
    return separator;
  }
  
  createFontFamilyDropdown() {
    const container = document.createElement('div');
    container.style.cssText = 'position: relative; display: inline-block;';
    
    const select = document.createElement('select');
    select.className = 'rich-text-select';
    select.style.cssText = `
      padding: 4px 8px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: white;
      font-size: 12px;
      cursor: pointer;
    `;
    
    const fonts = [
      { value: '', text: 'Police par défaut' },
      { value: 'Arial, sans-serif', text: 'Arial' },
      { value: 'Helvetica, sans-serif', text: 'Helvetica' },
      { value: 'Times New Roman, serif', text: 'Times New Roman' },
      { value: 'Georgia, serif', text: 'Georgia' },
      { value: 'Verdana, sans-serif', text: 'Verdana' },
      { value: 'Courier New, monospace', text: 'Courier New' },
      { value: 'Trebuchet MS, sans-serif', text: 'Trebuchet MS' },
      { value: 'Impact, sans-serif', text: 'Impact' },
      { value: 'Comic Sans MS, cursive', text: 'Comic Sans MS' }
    ];
    
    fonts.forEach(font => {
      const option = document.createElement('option');
      option.value = font.value;
      option.textContent = font.text;
      select.appendChild(option);
    });
    
    select.addEventListener('change', () => {
      this.executeCommand('fontName', select.value);
    });
    
    container.appendChild(select);
    return container;
  }
  
  createFontSizeDropdown() {
    const container = document.createElement('div');
    container.style.cssText = 'position: relative; display: inline-block;';
    
    const select = document.createElement('select');
    select.className = 'rich-text-select';
    select.style.cssText = `
      padding: 4px 8px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: white;
      font-size: 12px;
      cursor: pointer;
    `;
    
    const sizes = [
      { value: '', text: 'Taille par défaut' },
      { value: '8px', text: '8px' },
      { value: '9px', text: '9px' },
      { value: '10px', text: '10px' },
      { value: '11px', text: '11px' },
      { value: '12px', text: '12px' },
      { value: '14px', text: '14px' },
      { value: '16px', text: '16px' },
      { value: '18px', text: '18px' },
      { value: '20px', text: '20px' },
      { value: '24px', text: '24px' },
      { value: '28px', text: '28px' },
      { value: '32px', text: '32px' },
      { value: '36px', text: '36px' },
      { value: '48px', text: '48px' },
      { value: '72px', text: '72px' }
    ];
    
    sizes.forEach(size => {
      const option = document.createElement('option');
      option.value = size.value;
      option.textContent = size.text;
      select.appendChild(option);
    });
    
    select.addEventListener('change', () => {
      this.executeCommand('fontSize', select.value);
    });
    
    container.appendChild(select);
    return container;
  }
  
  createColorPicker(command, title, defaultColor) {
    const container = document.createElement('div');
    container.style.cssText = 'position: relative; display: inline-block;';
    
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rich-text-btn';
    button.title = title;
    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 1px solid #d1d5db;
      background: ${defaultColor};
      border-radius: 4px;
      cursor: pointer;
      position: relative;
    `;
    
    const input = document.createElement('input');
    input.type = 'color';
    input.value = defaultColor;
    input.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    `;
    
    input.addEventListener('change', () => {
      button.style.backgroundColor = input.value;
      this.executeCommand(command, input.value);
    });
    
    container.appendChild(button);
    container.appendChild(input);
    return container;
  }
  
  setupPlaceholder(element) {
    const placeholder = element.getAttribute('data-placeholder');
    
    const updatePlaceholder = () => {
      if (element.textContent.trim() === '') {
        element.innerHTML = `<span style="color: #9ca3af; font-style: italic;">${placeholder}</span>`;
      }
    };
    
    const clearPlaceholder = () => {
      if (element.innerHTML.includes(placeholder)) {
        element.innerHTML = '';
      }
    };
    
    element.addEventListener('focus', clearPlaceholder);
    element.addEventListener('blur', updatePlaceholder);
    element.addEventListener('input', () => {
      if (element.innerHTML.includes(placeholder)) {
        element.innerHTML = '';
      }
    });
    
    updatePlaceholder();
  }
  
  setupEventListeners() {
    // Update button states based on selection
    this.contentArea.addEventListener('selectionchange', () => {
      this.updateButtonStates();
    });
    
    // Handle keyboard shortcuts
    this.contentArea.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
    
    // Handle paste events
    this.contentArea.addEventListener('paste', (e) => {
      this.handlePaste(e);
    });
    
    // Handle input events for undo/redo and content cleaning
    this.contentArea.addEventListener('input', () => {
      this.saveToHistory();
      // Clean any pasted content
      this.cleanCurrentContent();
    });
    
    // Initial history save
    this.saveToHistory();
    
    // Listen for dark mode changes
    this.setupDarkModeListener();
  }
  
  applyDarkModeStyling(toolbar) {
    // Check if dark mode is active
    const isDarkMode = document.documentElement.classList.contains('dark') ||
                      document.body.classList.contains('dark') ||
                      document.documentElement.getAttribute('data-theme') === 'dark' ||
                      document.body.getAttribute('data-theme') === 'dark';
    
    if (isDarkMode) {
      toolbar.style.backgroundColor = 'rgb(0 23 46 / 95%)';
      toolbar.style.borderBottom = '1px solid rgb(229, 231, 235)';
      
      // Apply dark mode styling to select elements
      const selectElements = toolbar.querySelectorAll('.rich-text-select');
      selectElements.forEach(select => {
        select.style.backgroundColor = '#374151';
        select.style.borderColor = '#4b5563';
        select.style.color = '#ffffff';
      });
      
      // Apply dark mode styling to content area
      if (this.contentArea) {
        this.contentArea.style.color = '#ffffff';
        this.contentArea.style.backgroundColor = '#1f2937';
      }
    }
  }
  
  setupDarkModeListener() {
    // Create a MutationObserver to watch for dark mode class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme')) {
          this.updateDarkModeStyling();
        }
      });
    });
    
    // Observe the document element and body for class/theme changes
    observer.observe(document.documentElement, { attributes: true });
    observer.observe(document.body, { attributes: true });
  }
  
  updateDarkModeStyling() {
    if (this.toolbar) {
      this.applyDarkModeStyling(this.toolbar);
    }
    
    // Also update any select elements that might be created later
    const allSelects = document.querySelectorAll('.rich-text-select');
    const isDarkMode = document.documentElement.classList.contains('dark') ||
                      document.body.classList.contains('dark') ||
                      document.documentElement.getAttribute('data-theme') === 'dark' ||
                      document.body.getAttribute('data-theme') === 'dark';
    
    allSelects.forEach(select => {
      if (isDarkMode) {
        select.style.backgroundColor = '#374151';
        select.style.borderColor = '#4b5563';
        select.style.color = '#ffffff';
      } else {
        select.style.backgroundColor = '';
        select.style.borderColor = '';
        select.style.color = '';
      }
    });
    
    // Update content area styling
    if (this.contentArea) {
      if (isDarkMode) {
        this.contentArea.style.color = '#ffffff';
        this.contentArea.style.backgroundColor = '#1f2937';
      } else {
        this.contentArea.style.color = '';
        this.contentArea.style.backgroundColor = '';
      }
    }
  }
  
  handleKeyboardShortcuts(e) {
    // Ctrl+B for bold
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      this.executeCommand('bold');
    }
    // Ctrl+I for italic
    else if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      this.executeCommand('italic');
    }
    // Ctrl+U for underline
    else if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      this.executeCommand('underline');
    }
    // Ctrl+Z for undo
    else if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      this.executeCommand('undo');
    }
    // Ctrl+Y or Ctrl+Shift+Z for redo
    else if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
      e.preventDefault();
      this.executeCommand('redo');
    }
  }
  
  handlePaste(e) {
    // Don't prevent default paste behavior - let it work normally
    // The content will be cleaned by the input event handler
  }
  
  cleanCurrentContent() {
    if (!this.contentArea) return;
    
    const currentContent = this.contentArea.innerHTML;
    const cleanData = this.cleanPastedContent(currentContent);
    
    // Only update if the content was actually changed by cleaning
    if (cleanData !== currentContent) {
      // Store cursor position
      const selection = window.getSelection();
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      const cursorOffset = range ? range.startOffset : 0;
      
      // Update content
      this.contentArea.innerHTML = cleanData;
      
      // Restore cursor position if possible
      if (range && this.contentArea.firstChild) {
        try {
          const newRange = document.createRange();
          newRange.setStart(this.contentArea.firstChild, Math.min(cursorOffset, this.contentArea.firstChild.textContent.length));
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } catch (e) {
          // If cursor restoration fails, just place at the end
          const newRange = document.createRange();
          newRange.selectNodeContents(this.contentArea);
          newRange.collapse(false);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    }
  }
  
  cleanPastedContent(html) {
    // Create a temporary div to parse the HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove unwanted attributes and tags
    const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'sup', 'sub', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'hr'];
    const allowedAttributes = ['href', 'src', 'alt', 'title', 'style'];
    
    const cleanNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node;
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (!allowedTags.includes(node.tagName.toLowerCase())) {
          return document.createTextNode(node.textContent);
        }
        
        const cleanElement = document.createElement(node.tagName.toLowerCase());
        
        // Copy allowed attributes
        allowedAttributes.forEach(attr => {
          if (node.hasAttribute(attr)) {
            cleanElement.setAttribute(attr, node.getAttribute(attr));
          }
        });
        
        // Clean child nodes
        Array.from(node.childNodes).forEach(child => {
          const cleanChild = cleanNode(child);
          if (cleanChild) {
            cleanElement.appendChild(cleanChild);
          }
        });
        
        return cleanElement;
      }
      
      return null;
    };
    
    const cleanElement = cleanNode(temp);
    return cleanElement ? cleanElement.innerHTML : temp.textContent;
  }
  
  executeCommand(command, value = null) {
    if (!this.contentArea) return;
    
    this.contentArea.focus();
    
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
      
      this.updateButtonStates();
    } catch (error) {
      console.error('Error executing command:', command, error);
    }
  }
  
  executeCustomAction(action) {
    if (!this.contentArea) return;
    
    this.contentArea.focus();
    
    try {
      switch (action) {
        case 'insertEmptyBulletList':
          this.insertCustomList('ul', 'list-style-type: none;');
          break;
        case 'insertAlphaList':
          this.insertCustomList('ol', 'list-style-type: lower-alpha;');
          break;
        case 'insertRomanList':
          this.insertCustomList('ol', 'list-style-type: lower-roman;');
          break;
        case 'insertCodeBlock':
          this.insertCodeBlock();
          break;
        case 'insertAddress':
          this.insertAddress();
          break;
        case 'insertContainer':
          this.insertContainer();
          break;
        case 'insertTable':
          this.insertTable();
          break;
        case 'insertLineBreak':
          this.insertLineBreak();
          break;
        case 'insertNonBreakingSpace':
          this.insertNonBreakingSpace();
          break;
        case 'insertHighlight':
          this.insertHighlight();
          break;
        case 'insertSmallCaps':
          this.insertSmallCaps();
          break;
        case 'insertAllCaps':
          this.insertAllCaps();
          break;
        case 'insertToggleCase':
          this.insertToggleCase();
          break;
        case 'insertWordCount':
          this.insertWordCount();
          break;
        case 'undo':
          this.undo();
          break;
        case 'redo':
          this.redo();
          break;
        case 'clearFormatting':
          this.clearFormatting();
          break;
        default:
          console.warn('Unknown custom action:', action);
      }
      
      this.updateButtonStates();
    } catch (error) {
      console.error('Error executing custom action:', action, error);
    }
  }
  
  updateButtonStates() {
    if (!this.toolbar) return;
    
    const buttons = this.toolbar.querySelectorAll('.rich-text-btn');
    buttons.forEach(button => {
      const command = button.getAttribute('data-command') || button.onclick?.toString().match(/executeCommand\('([^']+)'/)?.[1];
      if (command) {
        const isActive = document.queryCommandState(command);
        button.style.backgroundColor = isActive ? '#dbeafe' : 'transparent';
        button.style.color = isActive ? '#1e40af' : 'inherit';
      }
    });
  }
  
  // Custom action implementations
  insertCustomList(tagName, style) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const list = document.createElement(tagName);
      list.style.cssText = style;
      
      const listItem = document.createElement('li');
      listItem.textContent = 'Nouvel élément';
      list.appendChild(listItem);
      
      range.deleteContents();
      range.insertNode(list);
      
      // Position cursor in the list item
      const newRange = document.createRange();
      newRange.setStart(listItem, 0);
      newRange.setEnd(listItem, 0);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }
  
  insertCodeBlock() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.textContent = 'Code ici...';
      pre.appendChild(code);
      
      range.deleteContents();
      range.insertNode(pre);
      
      // Position cursor in the code element
      const newRange = document.createRange();
      newRange.setStart(code, 0);
      newRange.setEnd(code, 0);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }
  
  insertAddress() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const address = document.createElement('address');
      address.textContent = 'Adresse ici...';
      address.style.cssText = 'font-style: italic; margin: 1rem 0; padding: 0.5rem; border-left: 3px solid #3b82f6; background-color: #f8fafc;';
      
      range.deleteContents();
      range.insertNode(address);
      
      // Position cursor in the address element
      const newRange = document.createRange();
      newRange.setStart(address, 0);
      newRange.setEnd(address, 0);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }
  
  insertContainer() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const div = document.createElement('div');
      div.textContent = 'Contenu du conteneur...';
      div.style.cssText = 'margin: 1rem 0; padding: 1rem; border: 1px solid #d1d5db; border-radius: 0.5rem; background-color: #f9fafb;';
      
      range.deleteContents();
      range.insertNode(div);
      
      // Position cursor in the div element
      const newRange = document.createRange();
      newRange.setStart(div, 0);
      newRange.setEnd(div, 0);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }
  
  insertTable() {
    const rows = prompt('Nombre de lignes:', '3');
    const cols = prompt('Nombre de colonnes:', '3');
    
    if (rows && cols && !isNaN(rows) && !isNaN(cols)) {
      const table = document.createElement('table');
      table.className = 'rich-text-table';
      
      for (let i = 0; i < parseInt(rows); i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < parseInt(cols); j++) {
          const cell = document.createElement(i === 0 ? 'th' : 'td');
          cell.textContent = i === 0 ? `En-tête ${j + 1}` : `Cellule ${i}-${j + 1}`;
          row.appendChild(cell);
        }
        table.appendChild(row);
      }
      
      this.insertHTML(table.outerHTML);
    }
  }
  
  insertLineBreak() {
    this.insertHTML('<br>');
  }
  
  insertNonBreakingSpace() {
    this.insertHTML('&nbsp;');
  }
  
  insertHighlight() {
    const selection = window.getSelection();
    if (selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.backgroundColor = '#ffff00';
      span.textContent = selection.toString();
      range.deleteContents();
      range.insertNode(span);
    } else {
      alert('Veuillez sélectionner du texte à surligner');
    }
  }
  
  insertSmallCaps() {
    const selection = window.getSelection();
    if (selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.cssText = 'font-variant: small-caps;';
      span.textContent = selection.toString();
      range.deleteContents();
      range.insertNode(span);
    } else {
      alert('Veuillez sélectionner du texte à transformer en petites capitales');
    }
  }
  
  insertAllCaps() {
    const selection = window.getSelection();
    if (selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.cssText = 'text-transform: uppercase;';
      span.textContent = selection.toString();
      range.deleteContents();
      range.insertNode(span);
    } else {
      alert('Veuillez sélectionner du texte à transformer en majuscules');
    }
  }
  
  insertToggleCase() {
    const selection = window.getSelection();
    if (selection.toString().trim()) {
      const text = selection.toString();
      const toggledText = text.split('').map(char => {
        return char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase();
      }).join('');
      
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(toggledText));
    } else {
      alert('Veuillez sélectionner du texte à inverser');
    }
  }
  
  insertWordCount() {
    const text = this.contentArea.textContent || this.contentArea.innerText || '';
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const charCount = text.length;
    const charCountNoSpaces = text.replace(/\s/g, '').length;
    
    const countInfo = `Mots: ${wordCount} | Caractères: ${charCount} | Caractères (sans espaces): ${charCountNoSpaces}`;
    alert(countInfo);
  }
  
  // Undo/Redo system
  saveToHistory() {
    if (!this.contentArea) return;
    
    const content = this.contentArea.innerHTML;
    const currentContent = this.history[this.historyIndex];
    
    // Don't save if content hasn't changed
    if (currentContent === content) return;
    
    // Remove any history after current index
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    // Add new content to history
    this.history.push(content);
    this.historyIndex++;
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.historyIndex--;
    }
  }
  
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreFromHistory();
    }
  }
  
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.restoreFromHistory();
    }
  }
  
  restoreFromHistory() {
    if (this.historyIndex >= 0 && this.historyIndex < this.history.length) {
      const content = this.history[this.historyIndex];
      this.contentArea.innerHTML = content;
      
      // Trigger input event to sync with hidden textarea
      const event = new Event('input', { bubbles: true });
      this.contentArea.dispatchEvent(event);
    }
  }
  
  clearFormatting() {
    const selection = window.getSelection();
    if (selection.toString().trim()) {
      // Clear formatting for selected text
      const range = selection.getRangeAt(0);
      const text = selection.toString();
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
    } else {
      // Clear all formatting in the editor
      const text = this.contentArea.textContent || this.contentArea.innerText || '';
      this.contentArea.innerHTML = text;
    }
  }
  
  insertHTML(html) {
    if (!this.contentArea) return;
    
    this.contentArea.focus();
    document.execCommand('insertHTML', false, html);
  }
  
  getContent() {
    if (!this.contentArea) return '';
    
    // Clean up the content
    let content = this.contentArea.innerHTML;
    
    // Remove placeholder if present
    const placeholder = this.contentArea.getAttribute('data-placeholder');
    if (placeholder && content.includes(placeholder)) {
      content = '';
    }
    
    return content;
  }
  
  setContent(html) {
    if (!this.contentArea) return;
    
    this.contentArea.innerHTML = html || '';
  }
  
  getTextContent() {
    if (!this.contentArea) return '';
    return this.contentArea.textContent || this.contentArea.innerText || '';
  }
  
  focus() {
    if (this.contentArea) {
      this.contentArea.focus();
    }
  }
  
  destroy() {
    if (this.editor && this.editor.parentNode) {
      this.editor.parentNode.removeChild(this.editor);
    }
    this.isInitialized = false;
  }
}

// Export for use in other scripts
window.RichTextEditor = RichTextEditor;

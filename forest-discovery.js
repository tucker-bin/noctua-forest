// Firebase imports will be handled by the HTML page
// This file expects db, getAuth, onAuthStateChanged, collection, query, where, orderBy, limit, startAfter, getDocs, doc, getDoc, app to be available globally

// Helper function to truncate text with fade effect
function truncateText(text, maxLength = 200) {
  if (text.length <= maxLength) {
    return text;
  }
  
  // Find the last space before maxLength to avoid cutting words
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return text.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

// Semantic search patterns for emotional and situational matching
const semanticPatterns = {
  // Emotional states
  emotions: {
    'uplifting': ['uplifting', 'inspiring', 'motivating', 'hopeful', 'positive', 'encouraging'],
    'melancholic': ['sad', 'melancholic', 'nostalgic', 'bittersweet', 'emotional', 'touching'],
    'thrilling': ['thrilling', 'exciting', 'adrenaline', 'suspenseful', 'gripping', 'intense'],
    'peaceful': ['peaceful', 'calm', 'serene', 'tranquil', 'meditative', 'zen'],
    'romantic': ['romantic', 'love', 'passionate', 'intimate', 'heartwarming', 'sweet'],
    'dark': ['dark', 'gritty', 'disturbing', 'unsettling', 'bleak', 'harsh']
  },
  
  // Life situations
  situations: {
    'breakup': ['breakup', 'divorce', 'heartbreak', 'relationship', 'love', 'dating'],
    'career': ['career', 'job', 'work', 'professional', 'business', 'success'],
    'family': ['family', 'parent', 'child', 'mother', 'father', 'sibling'],
    'travel': ['travel', 'journey', 'adventure', 'explore', 'vacation', 'trip'],
    'health': ['health', 'illness', 'recovery', 'medical', 'wellness', 'fitness'],
    'education': ['school', 'college', 'university', 'learning', 'student', 'education']
  },
  
  // Reading preferences
  preferences: {
    'quick': ['quick', 'fast', 'short', 'breezy', 'light', 'easy'],
    'deep': ['deep', 'complex', 'thoughtful', 'philosophical', 'intellectual'],
    'escapist': ['escape', 'fantasy', 'adventure', 'magical', 'otherworldly'],
    'realistic': ['realistic', 'contemporary', 'modern', 'real-life', 'authentic']
  }
};

// Extract semantic tags from text
function extractSemanticTags(text) {
  const tags = [];
  const lowerText = text.toLowerCase();
  
  Object.entries(semanticPatterns).forEach(([category, patterns]) => {
    Object.entries(patterns).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        tags.push(tag);
      }
    });
  });
  
  return tags;
}

// Forest Discovery System - Infinite Scroll & Filtering
class ForestDiscovery {
  constructor() {
    console.log('ForestDiscovery: Constructor called');
    this.filters = {
      search: '',
      language: '',
      region: '',
      sort: 'recent'
    };
    this.preferences = { excludedKeywords: [], genres: [] };
    this.books = [];
    this.currentPage = 1;
    this.hasMoreBooks = true;
    this.isLoading = false;
    this.lastDoc = null;
    
    this.init();
    this.loadUserPreferences();
    console.log('ForestDiscovery: Constructor completed');
  }

  init() {
    this.setupEventListeners();
    this.loadInitialBooks();
    this.setupInfiniteScroll();
  }

  async loadUserPreferences() {
    try {
      const auth = getAuth(window.app);
      onAuthStateChanged(auth, async (user) => {
        if (!user) return;
        
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            this.preferences = {
              excludedKeywords: data.excludedKeywords || [],
              genres: data.preferredGenres || []
            };
          }
        } catch (error) {
          console.error('Error loading user preferences:', error);
        }
      });
    } catch (error) {
      console.error('Error setting up user preferences:', error);
    }
  }

  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.filters.search = e.target.value;
          this.loadInitialBooks();
        }, 300);
      });
    }

    // Language filter
    const languageFilter = document.getElementById('languageFilter');
    if (languageFilter) {
      languageFilter.addEventListener('change', (e) => {
        this.filters.language = e.target.value;
        this.loadInitialBooks();
      });
    }

    // Region filter
    const regionFilter = document.getElementById('regionFilter');
    if (regionFilter) {
      regionFilter.addEventListener('change', (e) => {
        this.filters.region = e.target.value;
        this.loadInitialBooks();
      });
    }

    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.filters.sort = e.target.value;
        this.loadInitialBooks();
      });
    }

    // Load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        this.loadMoreBooks();
      });
    }
  }

  setupInfiniteScroll() {
    let isLoading = false;
    
    window.addEventListener('scroll', () => {
      if (isLoading) return;
      
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const threshold = 100;
      
      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        isLoading = true;
        this.loadMoreBooks().finally(() => {
          isLoading = false;
        });
      }
    });
  }

  async loadInitialBooks() {
    console.log('ForestDiscovery: Loading initial books...');
    this.currentPage = 1;
    this.books = [];
    await this.loadMoreBooks();
    console.log('ForestDiscovery: Initial books loaded, count:', this.books.length);
  }

  async loadMoreBooks() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoading(true);
    
    try {
      const newBooks = await this.fetchBooks(this.currentPage, this.filters);
      
      if (newBooks.length > 0) {
        this.books = [...this.books, ...newBooks];
        this.currentPage++;
        this.renderBooks();
        this.updateLoadMoreButton();
      } else {
        this.hasMoreBooks = false;
        this.updateLoadMoreButton();
      }
      
      this.updateEmptyState();
    } catch (error) {
      console.error('Error loading books:', error);
      this.showError('Failed to load books. Please try again.');
    } finally {
      this.isLoading = false;
      this.showLoading(false);
    }
  }

  async fetchBooks(page, filters) {
    if (this.isLoading) return [];
    
    console.log('ForestDiscovery: Fetching books, page:', page, 'filters:', filters);
    
    try {
      // Build Firestore query
      let booksQuery = collection(db, 'books');
      console.log('ForestDiscovery: Created books collection query');
      
      // Apply filters (align with books schema)
      if (filters.language && filters.language !== '') {
        booksQuery = query(booksQuery, where('primaryLanguage', '==', filters.language));
      }
      
      if (filters.region && filters.region !== '') {
        booksQuery = query(booksQuery, where('authorRegion', '==', filters.region));
      }
      
      // Apply sorting
      let sortField = 'createdAt';
      let sortOrder = 'desc';
      
      switch (filters.sort) {
        case 'recent':
          sortField = 'publishedAt';
          sortOrder = 'desc';
          break;
        case 'popular':
          sortField = 'reviewCount';
          sortOrder = 'desc';
          break;
        case 'title':
          sortField = 'title';
          sortOrder = 'asc';
          break;
      }
      
      booksQuery = query(booksQuery, orderBy(sortField, sortOrder));
      
      // Apply pagination
      const pageSize = 12;
      booksQuery = query(booksQuery, limit(pageSize));
      
      if (this.lastDoc && page > 1) {
        booksQuery = query(booksQuery, startAfter(this.lastDoc));
      }
      
      console.log('ForestDiscovery: Executing Firestore query...');
      const booksSnap = await getDocs(booksQuery);
      console.log('ForestDiscovery: Query executed, got', booksSnap.docs.length, 'documents');
      
      // Update lastDoc for pagination
      if (booksSnap.docs.length > 0) {
        this.lastDoc = booksSnap.docs[booksSnap.docs.length - 1];
      }
      
      // Map documents to book objects
      const books = booksSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || 'Untitled',
          author: data.author || 'Unknown Author',
          coverUrl: data.coverUrl || '/images/placeholder-book.jpg',
          reviewCount: data.reviewCount || 0,
          primaryLanguage: data.primaryLanguage || 'en',
          authorRegion: data.authorRegion || 'unknown',
          publicationYear: data.publicationYear || null,
          authorTags: data.authorTags || [],
          blurb: data.blurb || '',
          rating: data.averageRating || 0,
          createdAt: data.publishedAt || data.createdAt || new Date()
        };
      });
      
      // Apply semantic search if search query exists
      if (filters.search && filters.search.trim()) {
        console.log('ForestDiscovery: Applying semantic search for:', filters.search);
        return this.semanticSearch(books, filters.search.trim());
      }
      
      console.log('ForestDiscovery: Returning', books.length, 'books');
      return books;
      
    } catch (error) {
      console.error('ForestDiscovery: Firestore query failed:', error);
      
      // Fallback: fetch limited books and filter client-side
      console.log('ForestDiscovery: Using fallback client-side filtering');
      try {
        const fallbackQuery = query(collection(db, 'books'), limit(50));
        const fallbackSnap = await getDocs(fallbackQuery);
        
        let fallbackBooks = fallbackSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || 'Untitled',
            author: data.author || 'Unknown Author',
            coverUrl: data.coverUrl || '/images/placeholder-book.jpg',
            averageRating: data.averageRating || 0,
            reviewCount: data.reviewCount || 0,
            primaryLanguage: data.primaryLanguage || 'en',
            authorRegion: data.authorRegion || 'unknown',
            publicationYear: data.publicationYear || null,
            authorTags: data.authorTags || [],
            blurb: data.blurb || '',
            rating: data.averageRating || 0,
            createdAt: data.publishedAt || data.createdAt || new Date()
          };
        });
        
        // Client-side filtering
        if (filters.language) {
          fallbackBooks = fallbackBooks.filter(book => book.primaryLanguage === filters.language);
        }
        
        if (filters.region) {
          fallbackBooks = fallbackBooks.filter(book => book.authorRegion === filters.region);
        }
        
        // Client-side sorting
        switch (filters.sort) {
          case 'recent':
            fallbackBooks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
          case 'popular':
            fallbackBooks.sort((a, b) => b.reviewCount - a.reviewCount);
            break;
          case 'rating':
            fallbackBooks.sort((a, b) => b.rating - a.rating);
            break;
          case 'title':
            fallbackBooks.sort((a, b) => a.title.localeCompare(b.title));
            break;
        }
        
        // Apply pagination
        const pageSize = 12;
        const start = Math.max(0, (page - 1) * pageSize);
        const end = start + pageSize;
        
        return fallbackBooks.slice(start, end);
        
      } catch (fallbackError) {
        console.error('ForestDiscovery: Fallback also failed:', fallbackError);
        return [];
      }
    }
  }

  semanticSearch(books, query) {
    console.log('ForestDiscovery: Starting semantic search for:', query);
    
    const queryTags = extractSemanticTags(query);
    console.log('ForestDiscovery: Extracted query tags:', queryTags);
    
    const scoredBooks = books.map(book => {
      const score = this.calculateSemanticScore(book, query, queryTags);
      return { ...book, semanticScore: score };
    });
    
    // Sort by semantic score (highest first)
    scoredBooks.sort((a, b) => b.semanticScore - a.semanticScore);
    
    console.log('ForestDiscovery: Semantic search completed, returning', scoredBooks.length, 'books');
    return scoredBooks;
  }

  calculateSemanticScore(book, query, queryTags) {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    
    // Direct text matches (highest priority)
    if (book.title.toLowerCase().includes(lowerQuery)) {
      score += 100;
    }
    if (book.author.toLowerCase().includes(lowerQuery)) {
      score += 80;
    }
    
    // Semantic tag matching
    const bookContent = [book.title, book.author, book.blurb, ...(book.authorTags || [])].join(' ').toLowerCase();
    const bookTags = extractSemanticTags(bookContent);
    
    queryTags.forEach(queryTag => {
      if (bookTags.includes(queryTag)) {
        score += 50;
      }
    });
    
    // Keyword matching in book content
    const queryWords = lowerQuery.split(' ').filter(word => word.length > 2);
    queryWords.forEach(word => {
      if (bookContent.includes(word)) {
        score += 10;
      }
    });
    
    // Boost score for books with more reviews (community validation)
    score += Math.min(book.reviewCount * 2, 20);
    
    return score;
  }

  renderBooks() {
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) return;
    
    // Clear existing books
    booksGrid.innerHTML = '';
    
    // Render each book
    this.books.forEach(book => {
      const bookCard = this.createBookCard(book);
      booksGrid.appendChild(bookCard);
    });
  }

  createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer';
    card.onclick = () => viewBook(book.id);
    
    const wordCloud = this.generateWordCloud(book);
    
    card.innerHTML = `
      <div class="aspect-[3/4] bg-gray-200 overflow-hidden">
        <img src="${book.coverUrl}" alt="${book.title}" class="w-full h-full object-cover">
      </div>
      <div class="p-4">
        <h3 class="font-semibold text-lg text-forest-text mb-2 line-clamp-2">${book.title}</h3>
        <p class="text-forest-text-muted mb-3">by ${book.author}</p>
        
        <!-- Word Cloud instead of description -->
        <div class="mb-3 text-sm">
          ${wordCloud}
        </div>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <span class="text-sm text-forest-text-muted">${book.reviewCount} reviews</span>
          </div>
          <div class="text-xs text-forest-text-muted">
            ${this.formatRegion(book.authorRegion)}
          </div>
        </div>
      </div>
    `;
    
    return card;
  }

  generateWordCloud(book) {
    // Generate word cloud from book data
    const words = [];
    
    // Add semantic tags from book content
    const bookContent = [
      book.title,
      book.author,
      book.blurb || '',
      ...(book.tags || [])
    ].join(' ').toLowerCase();
    
    const semanticTags = extractSemanticTags(bookContent);
    
    // Add common book themes
    const themes = ['story', 'character', 'plot', 'writing', 'ending', 'beginning', 'journey', 'discovery'];
    themes.forEach(theme => {
      if (bookContent.includes(theme)) {
        words.push(theme);
      }
    });
    
    // Add semantic tags
    semanticTags.forEach(tag => {
      if (!words.includes(tag)) {
        words.push(tag);
      }
    });
    
    // Add author tags
    if (book.authorTags && book.authorTags.length > 0) {
      book.authorTags.slice(0, 3).forEach(tag => {
        if (!words.includes(tag)) {
          words.push(tag);
        }
      });
    }
    
    // Limit to 8 words max
    const selectedWords = words.slice(0, 8);
    
    if (selectedWords.length === 0) {
      return '<span class="text-forest-text-muted">No themes available</span>';
    }
    
    // Generate word cloud HTML with varying sizes and colors
    const wordCloud = selectedWords.map((word, index) => {
      const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg'];
      const colors = ['text-forest-text-muted', 'text-forest-text', 'text-forest-accent'];
      
      const size = sizes[index % sizes.length];
      const color = colors[index % colors.length];
      
      return `<span class="${size} ${color} mr-2">${word}</span>`;
    }).join('');
    
    return wordCloud;
  }


  formatRegion(region) {
    const regionMap = {
      'north-america': 'North America',
      'europe': 'Europe',
      'asia': 'Asia',
      'africa': 'Africa',
      'south-america': 'South America',
      'oceania': 'Oceania',
      'middle-east': 'Middle East'
    };
    return regionMap[region] || region;
  }

  updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!loadMoreBtn) return;
    
    if (this.hasMoreBooks && this.books.length > 0) {
      loadMoreBtn.classList.remove('hidden');
    } else {
      loadMoreBtn.classList.add('hidden');
    }
  }

  updateEmptyState() {
    const emptyState = document.getElementById('emptyState');
    if (!emptyState) return;
    
    if (this.books.length === 0) {
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
    }
  }

  showLoading(show) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (!loadingIndicator) return;
    
    if (show) {
      loadingIndicator.classList.remove('hidden');
    } else {
      loadingIndicator.classList.add('hidden');
    }
  }

  showError(message) {
    console.error('ForestDiscovery Error:', message);
    // You could show a toast notification here
  }
}

// Global function for book navigation
function viewBook(bookId) {
  window.location.href = `book.html?id=${bookId}`;
}

// Make ForestDiscovery available globally
window.ForestDiscovery = ForestDiscovery;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Forest Discovery: DOM loaded, initializing...');
  console.log('Available Firebase functions:', {
    app: !!window.app,
    db: !!window.db,
    collection: !!window.collection,
    query: !!window.query,
    getDocs: !!window.getDocs
  });
  
  if (!window.db) {
    console.error('Forest Discovery: Firebase db not available!');
    return;
  }
  
  if (!window.app) {
    console.error('Forest Discovery: Firebase app not available!');
    return;
  }
  
  window.forestDiscovery = new ForestDiscovery();
  console.log('Forest Discovery: Initialized successfully');
});

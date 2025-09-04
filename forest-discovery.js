import { app, db } from './firebase-config.js';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs,
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';

// Helper function to truncate text with fade effect
function truncateText(text, maxLength = 200) {
  if (text.length <= maxLength) {
    return text;
  }
  
  // Find the last space before maxLength to avoid cutting words
  let truncateAt = maxLength;
  for (let i = maxLength; i >= maxLength - 20; i--) {
    if (text[i] === ' ') {
      truncateAt = i;
      break;
    }
  }
  
  return text.substring(0, truncateAt) + '...';
}

// Forest Discovery System - Infinite Scroll & Filtering
class ForestDiscovery {
  constructor() {
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
  }

  init() {
    this.setupEventListeners();
    this.loadInitialBooks();
    this.setupInfiniteScroll();
  }

  async loadUserPreferences() {
    try {
      const auth = getAuth();
      onAuthStateChanged(auth, async (user) => {
        if (!user) return;
        
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            this.preferences = data.preferences || { excludedKeywords: [], genres: [] };
            
            // Apply default filters from preferences
            if (this.preferences.language) {
              this.filters.language = this.preferences.language;
              const langSelect = document.getElementById('language');
              if (langSelect) langSelect.value = this.preferences.language;
            }
            
            // Apply excluded keywords filtering
            if (this.preferences.excludedKeywords && this.preferences.excludedKeywords.length > 0) {
              this.updateActiveFilters();
              this.resetAndReload();
            }
          }
        } catch (error) {
          console.warn('Could not load user preferences:', error);
        }
      });
    } catch (error) {
      console.warn('Could not initialize preferences loading:', error);
    }
  }

  setupEventListeners() {
    // Search input with debouncing
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.filters.search = e.target.value;
        this.resetAndReload();
      }, 300);
    });

    // Filter selects
    // Map UI IDs to internal filter keys for robustness
    const idToFilterKey = { languageFilter: 'language', regionFilter: 'region', sortSelect: 'sort' };
    Object.entries(idToFilterKey).forEach(([id, key]) => {
      const select = document.getElementById(id);
      select?.addEventListener('change', (e) => {
        this.filters[key] = e.target.value;
        this.updateActiveFilters();
        this.resetAndReload();
      });
    });
  }

  setupInfiniteScroll() {
    // Safari compatibility: Check for IntersectionObserver support
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported, using scroll fallback');
      this.setupScrollFallback();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.isLoading && this.hasMoreBooks) {
          this.loadMoreBooks();
        }
      });
    }, {
      rootMargin: '200px'
    });

    // Observe the loading indicator
    const loadingIndicator = document.getElementById('loadingState');
    if (loadingIndicator) {
      observer.observe(loadingIndicator);
    }
  }

  // Fallback for browsers without IntersectionObserver
  setupScrollFallback() {
    window.addEventListener('scroll', () => {
      if (!this.isLoading && this.hasMoreBooks) {
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = document.documentElement.scrollTop;
        const clientHeight = document.documentElement.clientHeight;
        
        if (scrollTop + clientHeight >= scrollHeight - 1000) {
          this.loadMoreBooks();
        }
      }
    });
  }

  async loadInitialBooks() {
    this.currentPage = 0;
    this.books = [];
    await this.loadMoreBooks();
  }

  async loadMoreBooks() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoading(true);

    try {
      // Simulate API call with sample data for now
      const newBooks = await this.fetchBooks(this.currentPage, this.filters);
      
      if (newBooks.length === 0) {
        this.hasMoreBooks = false;
        this.showNoResults(this.books.length === 0);
      } else {
        this.books.push(...newBooks);
        this.renderBooks(newBooks);
        this.currentPage++;
      }
    } catch (error) {
      console.error('Error loading books:', error);
      this.showError();
    } finally {
      this.isLoading = false;
      this.showLoading(false);
    }
  }

  async fetchBooks(page, filters) {
    if (this.isLoading) return [];
    
    try {
      // Build Firestore query
      let booksQuery = collection(db, 'books');
      
      // Apply filters (align with books schema)
      if (filters.language && filters.language !== '') {
        booksQuery = query(booksQuery, where('primaryLanguage', '==', filters.language));
      }
      
      if (filters.region && filters.region !== '') {
        booksQuery = query(booksQuery, where('authorRegion', '==', filters.region));
      }
      
      // Apply sorting — use publishedAt for recency
      let sortField = 'publishedAt';
      let sortDirection = 'desc';
      
      switch (filters.sort) {
        case 'popular':
          sortField = 'popularity';
          sortDirection = 'desc';
          break;
        case 'recent': // 'Newest' in UI
          sortField = 'publishedAt';
          sortDirection = 'desc';
          break;
        // No ratings in product — remove/ignore legacy option
        case 'random':
          // For random, we'll shuffle client-side after fetching
          sortField = 'publishedAt';
          sortDirection = 'desc';
          break;
      }
      
      // Apply pagination
      const pageSize = 12;
      let paginatedQuery = query(
        booksQuery,
        orderBy(sortField, sortDirection),
        limit(pageSize)
      );
      
      // If not first page, use cursor pagination
      if (page > 1 && this.lastDoc) {
        paginatedQuery = query(
          booksQuery,
          orderBy(sortField, sortDirection),
          startAfter(this.lastDoc),
          limit(pageSize)
        );
      }
      
      const snapshot = await getDocs(paginatedQuery);
      
      if (snapshot.empty) {
        return [];
      }
      
      // Store last document for next page
      this.lastDoc = snapshot.docs[snapshot.docs.length - 1];
      
      // Convert to book objects
      const books = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          author: data.author || '',
          coverUrl: data.coverUrl || '',
          language: data.primaryLanguage || data.language || 'en',
          region: data.authorRegion || data.region || '',
          year: typeof data.publicationYear === 'number' ? data.publicationYear : null,
          tags: Array.isArray(data.categories) ? data.categories : (typeof data.authorTags === 'string' && data.authorTags.trim() ? data.authorTags.split(',').map(t => t.trim()).filter(Boolean) : []),
          popularity: data.popularity || 0,
          rating: data.averageRating || 0,
          averageRating: data.averageRating || 0,
          reviewCount: data.reviewCount || 0,
          createdAt: data.publishedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date(),
          blurb: data.blurb || ''
        };
      });
      
      // Apply search filter client-side for now
      if (filters.search && filters.search.trim() !== '') {
        const searchTerm = filters.search.toLowerCase().trim();
        return books.filter(book => {
          const inTitle = book.title.toLowerCase().includes(searchTerm);
          const inAuthor = book.author.toLowerCase().includes(searchTerm);
          const inTags = book.tags.some(tag => tag.toLowerCase().includes(searchTerm));
          return inTitle || inAuthor || inTags;
        });
      }
      
      // Apply excluded keywords filtering from user preferences
      if (this.preferences && Array.isArray(this.preferences.excludedKeywords) && this.preferences.excludedKeywords.length > 0) {
        const excludedTerms = this.preferences.excludedKeywords.map(term => term.toLowerCase().trim()).filter(Boolean);
        return books.filter(book => {
          const bookText = `${book.title} ${book.author} ${book.tags.join(' ')}`.toLowerCase();
          return !excludedTerms.some(term => bookText.includes(term));
        });
      }
      
      // Apply random sorting if requested
      if (filters.sort === 'random') {
        return this.shuffleArray([...books]);
      }
      
      return books;
      
    } catch (error) {
      console.error('Error fetching books from Firestore:', error);
      return [];
    }
  }

  renderBooks(books) {
    const feed = document.getElementById('booksGrid');
    if (!feed) return;

    books.forEach(book => {
      const bookCard = this.createBookCard(book);
      feed.appendChild(bookCard);
    });
    
    // Update screen reader status
    this.updateSearchStatus(books.length);
  }
  
  updateSearchStatus(count) {
    const searchStatus = document.getElementById('searchStatus');
    const resultsInfo = document.getElementById('resultsInfo');
    
    if (searchStatus) {
      if (count === 0) {
        searchStatus.textContent = 'No books found matching your criteria.';
      } else {
        searchStatus.textContent = `Found ${count} book${count === 1 ? '' : 's'} matching your search.`;
      }
    }
    
    if (resultsInfo) {
      if (count > 0) {
        resultsInfo.textContent = `Showing ${count} book${count === 1 ? '' : 's'}`;
        resultsInfo.classList.remove('hidden');
      } else {
        resultsInfo.classList.add('hidden');
      }
    }
  }
  
  updateLoadingStatus(isLoading) {
    const loadingStatus = document.getElementById('loadingStatus');
    if (loadingStatus) {
      loadingStatus.textContent = isLoading ? 'Loading more books...' : '';
    }
  }

  createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'bg-forest-card rounded-2xl overflow-hidden shadow-lg group transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-offset-2 focus:ring-offset-[#3A4F3C]';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View details for ${book.title} by ${book.author}. Rating: ${book.rating} stars.`);
    
    const coverUrl = (window.coverFor ? window.coverFor(book) : (book.coverUrl || ''));
    const truncatedBlurb = truncateText(book.blurb, 200);
    
    card.innerHTML = `
        <div class="w-full bg-forest-secondary/30 flex items-center justify-center" style="aspect-ratio:3/4;">
            <img src="${coverUrl}" alt="Cover image for ${book.title}" class="max-h-[85%] max-w-[85%] object-contain rounded shadow-sm" loading="lazy">
        </div>
        <div class="p-6">
            <h3 class="text-2xl font-bold text-white mb-2" style="font-family: 'Poppins', sans-serif;">${book.title}</h3>
            <p class="text-md text-gray-300 mb-4" aria-label="Author">By ${book.author}</p>
            <div class="relative mb-4">
                <p class="text-forest-light leading-relaxed" aria-label="Book description">${truncatedBlurb}</p>
                ${truncatedBlurb.endsWith('...') ? '<div class="absolute bottom-0 right-0 bg-gradient-to-l from-[#3A4F3C] to-transparent w-8 h-6" aria-hidden="true"></div>' : ''}
            </div>
            <div class="flex flex-wrap gap-2 mb-4" role="list" aria-label="Book genres">
                ${book.tags.slice(0, 2).map(tag => `
                    <span class="bg-forest-secondary text-forest-light px-2 py-1 rounded-full text-xs" role="listitem">${tag}</span>
                `).join('')}
            </div>
            <div class="flex items-center justify-between text-sm text-gray-400 mb-4">
                <span class="text-forest-accent font-semibold" aria-label="Rating: ${book.rating} out of 5 stars">⭐ ${book.rating}</span>
                <span aria-label="Publication year">${book.year}</span>
                <span aria-label="Author region">${this.formatRegion(book.region)}</span>
            </div>
            <div class="flex flex-col gap-2">
                <div class="flex gap-2">
                    <a href="book.html?id=${book.id}" class="flex-1 text-center bg-forest-accent bg-forest-accent-hover text-white font-bold py-2 px-4 rounded-full transition-all duration-300 transform hover:scale-105" aria-label="View details for ${book.title}">
                        View Details
                    </a>
                    <button onclick="addToReadingList('${book.id}', '${book.title.replace(/'/g, "\\'")}', '${book.author.replace(/'/g, "\\'")}', this)" class="bg-[#F58220] hover:bg-[#E0751C] text-white p-2 rounded-full transition-all duration-300 group" title="Add to Reading List" aria-label="Add ${book.title} to reading list">
                        <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </button>
                </div>
                
            </div>
        </div>
    `;
    
    // Add keyboard navigation support
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = `book.html?id=${book.id}`;
      }
    });
    
    // Add click handler for mouse users
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking on the View Details link
      if (e.target.tagName === 'A') return;
      window.location.href = `book.html?id=${book.id}`;
    });
    
    return card;
  }

  formatRegion(region) {
    const regionMap = {
      'north-america': 'North America',
      'south-america': 'South America',
      'europe': 'Europe',
      'africa': 'Africa',
      'asia': 'Asia',
      'oceania': 'Oceania',
      'middle-east': 'Middle East'
    };
    return regionMap[region] || region;
  }

  updateActiveFilters() {
    const activeFiltersContainer = document.getElementById('activeFilters');
    const filterTags = activeFiltersContainer?.querySelector('.filter-tags');
    
    if (!activeFiltersContainer || !filterTags) return;

    filterTags.innerHTML = '';
    let hasActiveFilters = false;

    Object.entries(this.filters).forEach(([key, value]) => {
      if (value && key !== 'sort') {
        hasActiveFilters = true;
        const tag = document.createElement('span');
        tag.className = 'bg-forest-accent text-white px-3 py-1 rounded-full text-xs flex items-center gap-2';
        tag.innerHTML = `
          ${key}: ${value}
          <button onclick="forestDiscovery.removeFilter('${key}')" class="hover:bg-white hover:bg-opacity-20 rounded-full w-4 h-4 flex items-center justify-center text-xs">×</button>
        `;
        filterTags.appendChild(tag);
      }
    });

    if (hasActiveFilters) {
      activeFiltersContainer.classList.remove('hidden');
      activeFiltersContainer.classList.add('flex');
    } else {
      activeFiltersContainer.classList.add('hidden');
      activeFiltersContainer.classList.remove('flex');
    }
  }

  removeFilter(filterKey) {
    this.filters[filterKey] = '';
    
    // Update the UI select
    const select = document.getElementById(filterKey);
    if (select) select.value = '';
    
    // Update search input
    if (filterKey === 'search') {
      const searchInput = document.getElementById('search');
      if (searchInput) searchInput.value = '';
    }

    this.updateActiveFilters();
    this.resetAndReload();
  }

  clearAllFilters() {
    this.filters = {
      search: '',
      language: '',
      region: '',
      sort: 'recent'
    };

    // Reset UI elements
    const searchEl = document.getElementById('search');
    if (searchEl) searchEl.value = '';
    const langEl = document.getElementById('language');
    if (langEl) langEl.value = '';
    const regionEl = document.getElementById('region');
    if (regionEl) regionEl.value = '';
    const sortEl = document.getElementById('sortSelect') || document.getElementById('sort');
    if (sortEl) sortEl.value = 'recent';

    this.updateActiveFilters();
    this.resetAndReload();
  }

  resetAndReload() {
    this.currentPage = 0;
    this.hasMoreBooks = true;
    this.books = [];
    
    const feed = document.getElementById('booksGrid');
    if (feed) feed.innerHTML = '';
    
    this.loadMoreBooks();
  }

  showLoading(show) {
    const indicator = document.getElementById('loadingState');
    if (indicator) {
      if (show) {
        indicator.classList.remove('hidden');
      } else {
        indicator.classList.add('hidden');
      }
    }
  }

  showNoResults(show) {
    const noResults = document.getElementById('noResults');
    if (noResults) {
      if (show) {
        noResults.classList.remove('hidden');
      } else {
        noResults.classList.add('hidden');
      }
    }
  }

  showError() {
    // Could implement error state UI here
    console.log('Error loading books');
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Affiliate link generation methods
  getAmazonAffiliateLink(book) {
    // Your Amazon Associates ID
    const affiliateId = "noctuaforest-20";
    
    // If book has Amazon URL from Firestore/submission, use it with your affiliate tag
    if (book.amazonUrl) {
        const url = new URL(book.amazonUrl);
        url.searchParams.set('tag', affiliateId);
        const ref = (typeof sessionStorage !== 'undefined') ? sessionStorage.getItem('nf_ref') : '';
        if (ref) url.searchParams.set('ref', ref);
        return url.toString();
    }
    
    // If book has purchase link that's Amazon, add affiliate tag
    if (book.purchaseLink && book.purchaseLink.includes('amazon.com')) {
        const url = new URL(book.purchaseLink);
        url.searchParams.set('tag', affiliateId);
        const ref = (typeof sessionStorage !== 'undefined') ? sessionStorage.getItem('nf_ref') : '';
        if (ref) url.searchParams.set('ref', ref);
        return url.toString();
    }
    
    // Otherwise, create search link with affiliate tag
    const searchQuery = encodeURIComponent(`${book.title} ${book.author}`);
    const ref = (typeof sessionStorage !== 'undefined') ? sessionStorage.getItem('nf_ref') : '';
    return `https://amazon.com/s?k=${searchQuery}&tag=${affiliateId}${ref?`&ref=${encodeURIComponent(ref)}`:''}`;
  }

  // Bookshop affiliate links removed by product decision
}

// Global functions
function clearAllFilters() {
  if (window.forestDiscovery) {
    window.forestDiscovery.clearAllFilters();
  }
}

function viewBook(bookId) {
  window.location.href = `book.html?id=${bookId}`;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.forestDiscovery = new ForestDiscovery();
});

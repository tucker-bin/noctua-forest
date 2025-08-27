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
    this.currentPage = 0;
    this.isLoading = false;
    this.hasMoreBooks = true;
    this.filters = {
      search: '',
      language: '',
      region: '',
      sort: 'recent'
    };
    this.books = [];
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadInitialBooks();
    this.setupInfiniteScroll();
  }

  setupEventListeners() {
    // Search input with debouncing
    const searchInput = document.getElementById('search');
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.filters.search = e.target.value;
        this.resetAndReload();
      }, 300);
    });

    // Filter selects
    ['language', 'region', 'sort'].forEach(filterId => {
      const select = document.getElementById(filterId);
      select?.addEventListener('change', (e) => {
        this.filters[filterId] = e.target.value;
        this.updateActiveFilters();
        this.resetAndReload();
      });
    });
  }

  setupInfiniteScroll() {
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
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
      observer.observe(loadingIndicator);
    }
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Shared sample data
    const sampleBooks = (window.SAMPLE_BOOKS || []);

    // Apply filters
    let filteredBooks = [...sampleBooks];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredBooks = filteredBooks.filter(book => 
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        book.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (filters.language) {
      filteredBooks = filteredBooks.filter(book => book.language === filters.language);
    }

    if (filters.region) {
      filteredBooks = filteredBooks.filter(book => book.region === filters.region);
    }

    // Apply sorting
    switch (filters.sort) {
      case 'popular':
        filteredBooks.sort((a, b) => b.rating - a.rating);
        break;
      case 'rating':
        filteredBooks.sort((a, b) => b.rating - a.rating);
        break;
      case 'recent':
        filteredBooks.sort((a, b) => b.year - a.year);
        break;
      case 'random':
        filteredBooks = this.shuffleArray([...filteredBooks]);
        break;
    }

    // Simulate pagination
    const perPage = 6;
    const start = page * perPage;
    const end = start + perPage;
    
    return filteredBooks.slice(start, end);
  }

  renderBooks(books) {
    const feed = document.getElementById('forestFeed');
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
            <a href="book.html?id=${book.id}" class="block text-center w-full bg-forest-accent bg-forest-accent-hover text-white font-bold py-2 px-4 rounded-full transition-all duration-300 transform hover:scale-105" aria-label="View details for ${book.title}">
                View Details
            </a>
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
    document.getElementById('search').value = '';
    document.getElementById('language').value = '';
    document.getElementById('region').value = '';
    document.getElementById('sort').value = 'recent';

    this.updateActiveFilters();
    this.resetAndReload();
  }

  resetAndReload() {
    this.currentPage = 0;
    this.hasMoreBooks = true;
    this.books = [];
    
    const feed = document.getElementById('forestFeed');
    if (feed) feed.innerHTML = '';
    
    this.loadMoreBooks();
  }

  showLoading(show) {
    const indicator = document.getElementById('loadingIndicator');
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

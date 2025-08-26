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

    // Sample book data - using examples from template with extended blurbs
    const sampleBooks = [
      {
        id: 1,
        title: "Klara and the Sun",
        author: "Kazuo Ishiguro",
        language: "en",
        region: "europe",
        blurb: "An artificial friend observes the world with profound questions about what it means to love. From the Nobel Prize-winning author of Never Let Me Go and The Remains of the Day comes a luminous meditation on love, loss, and what it means to be human. Klara, an Artificial Friend with outstanding observational qualities, watches from the store window hoping a child will choose her. When fourteen-year-old Josie arrives, Klara is chosen to be her companion. But beneath the surface, nothing is quite as it seems in this haunting story of artificial intelligence and the human heart.",
        tags: ["science fiction", "nobel prize", "philosophical"],
        rating: 4.1,
        year: 2021
      },
      {
        id: 2,
        title: "The Midnight Library",
        author: "Matt Haig",
        language: "en",
        region: "europe",
        blurb: "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived. To see how things would be different if you had made other choices. Would you have done anything different, if you had the chance to undo your regrets? A dazzling novel about all the choices that go into a life well lived, from the internationally bestselling author of Reasons to Stay Alive and How To Stop Time. This is a story about possibility, about living without regret.",
        tags: ["philosophical fiction", "contemporary", "british literature"],
        rating: 4.2,
        year: 2020
      },
      {
        id: 3,
        title: "Circe",
        author: "Madeline Miller",
        language: "en",
        region: "north-america",
        blurb: "The story of the Greek goddess who transforms from an awkward nymph into a formidable witch. In this stunning feminist retelling of Greek mythology, Circe discovers her powers of witchcraft when she turns to the world of mortals for companionship. From the author of The Song of Achilles comes this breathtaking novel of gods and heroes, magic and monsters, survival and transformation. A bold and subversive retelling of the goddess's story, this epic tale of family rivalry, palace intrigue, love and loss turns the page on the tales we think we know.",
        tags: ["mythology", "fantasy", "feminist retelling"],
        rating: 4.3,
        year: 2018
      },
      {
        id: 4,
        title: "Project Hail Mary",
        author: "Andy Weir",
        language: "en",
        region: "north-america",
        blurb: "A lone astronaut must save the earth from disaster with the help of an unexpected ally. Ryland Grace wakes up on a spaceship with no memory of why he's there. His crewmates are dead. His memories are slowly returning. And he realizes that an impossible task now confronts him. Ever since he was a kid, Ryland dreamed of being a teacher. Now he must use all his knowledge and skills to save humanity itself. From the author of The Martian comes an irresistible new near-future thriller about one man's quest to save humanity, featuring his trademark mix of rigorous science, humor, and heart.",
        tags: ["science fiction", "space adventure", "humor"],
        rating: 4.5,
        year: 2021
      },
      {
        id: 5,
        title: "Pachinko",
        author: "Min Jin Lee",
        language: "en",
        region: "asia",
        blurb: "A sweeping saga of a Korean family through four generations, navigating love, war, and survival. In the early 1900s, teenage Sunja becomes pregnant by a married yakuza and accepts an offer of marriage from a gentle minister passing through town. Following her family through the decades that span the Japanese occupation, World War II, the Korean War, and beyond, this epic novel chronicles the hopes and dreams of four generations of one family. It's a story of love, sacrifice, ambition, and loyalty that asks what we owe our families and what we owe ourselves.",
        tags: ["historical fiction", "family saga", "korean-american"],
        rating: 4.5,
        year: 2017
      },
      {
        id: 6,
        title: "The Seven Husbands of Evelyn Hugo",
        author: "Taylor Jenkins Reid",
        language: "en",
        region: "north-america",
        blurb: "Reclusive Hollywood icon Evelyn Hugo finally tells her life story to an unknown journalist. When reclusive Hollywood icon Evelyn Hugo finally decides to tell her life story, she selects unknown magazine reporter Monique Grant for the job. Nobody understands why. Evelyn's story spans decades of ruthless ambition, unexpected friendship, and a great forbidden love. But as the two women grow closer, it becomes clear that Evelyn's life intersects with Monique's own in tragic and irreversible ways. This is a mesmerizing journey through the splendor of old Hollywood into the harsh realities of the present day.",
        tags: ["contemporary fiction", "lgbtq", "hollywood"],
        rating: 4.6,
        year: 2017
      },
      {
        id: 7,
        title: "Educated",
        author: "Tara Westover",
        language: "en",
        region: "north-america",
        blurb: "A memoir about a woman who, kept out of school, leaves her survivalist family and goes on to earn a PhD from Cambridge University. Born to survivalists in the mountains of Idaho, Tara Westover was seventeen the first time she set foot in a classroom. Her family was so isolated from mainstream society that there was no one to ensure the children received an education, and no one to intervene when one of Tara's older brothers became violent. When another brother got himself into college, Tara decided to try a new kind of life. Her quest for knowledge transformed her, taking her over oceans and across continents to Harvard and Cambridge University.",
        tags: ["memoir", "education", "family"],
        rating: 4.4,
        year: 2018
      },
      {
        id: 8,
        title: "The Song of Achilles",
        author: "Madeline Miller",
        language: "en",
        region: "north-america",
        blurb: "A tale of gods, kings, immortal fame and the human heart, this is a dazzling literary feat that brilliantly reimagines Homer's enduring masterwork, The Iliad. An action-packed adventure, an epic love story, a marvelously conceived and executed page-turner, Miller's monumental debut novel has already earned her a place among the greatest contemporary writers of historical fiction. At once a scholar's homage to The Iliad and startlingly original work of art by an incredibly talented new novelist, this is destined to become a classic. Patroclus, an awkward young prince, follows Achilles into war, little knowing that the years that follow will test everything they hold dear.",
        tags: ["mythology", "historical fiction", "lgbtq"],
        rating: 4.4,
        year: 2011
      }
    ];

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
  }

  createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'bg-forest-card rounded-2xl overflow-hidden shadow-lg group transform hover:-translate-y-2 transition-transform duration-300';
    
    // Create generic book cover placeholder
    const placeholderUrl = `https://placehold.co/480x640/4A5450/E0E2DB?text=Book%20Cover`;
    
    card.innerHTML = `
        <div class="w-full bg-forest-secondary/30 flex items-center justify-center" style="aspect-ratio:3/4;">
            <img src="${placeholderUrl}" alt="${book.title} cover" class="max-h-[85%] max-w-[85%] object-contain rounded shadow-sm" loading="lazy">
        </div>
        <div class="p-6">
            <h3 class="text-2xl font-bold text-white mb-2" style="font-family: 'Poppins', sans-serif;">${book.title}</h3>
            <p class="text-md text-gray-300 mb-4">By ${book.author}</p>
            <p class="text-forest-light leading-relaxed mb-4">${book.blurb}</p>
            <div class="flex flex-wrap gap-2 mb-4">
                ${book.tags.slice(0, 2).map(tag => `
                    <span class="bg-forest-secondary text-forest-light px-2 py-1 rounded-full text-xs">${tag}</span>
                `).join('')}
            </div>
            <div class="flex items-center justify-between text-sm text-gray-400 mb-4">
                <span class="text-forest-accent font-semibold">⭐ ${book.rating}</span>
                <span>${book.year}</span>
                <span>${this.formatRegion(book.region)}</span>
            </div>
            <a href="book.html?id=${book.id}" class="block text-center w-full bg-forest-accent bg-forest-accent-hover text-white font-bold py-2 px-4 rounded-full transition-all duration-300 transform hover:scale-105">
                View Details
            </a>
        </div>
    `;
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

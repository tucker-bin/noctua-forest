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

// Configurable weights for hybrid scoring (can be overridden via window.FOREST_WEIGHTS)
const DEFAULT_WEIGHTS = { cosine: 0.6, tagOverlap: 0.2, popularity: 0.2 };

function getWeights() {
  try {
    if (window && window.FOREST_WEIGHTS) {
      return { ...DEFAULT_WEIGHTS, ...window.FOREST_WEIGHTS };
    }
  } catch (_) {}
  return DEFAULT_WEIGHTS;
}

// Minimal hierarchical tag dictionaries for intent parsing
const INTENT_DICTIONARY = {
  audience: ['kids', 'children', 'teens', 'students', 'beginners', 'founders', 'developers', 'physicians', 'doctors', 'nurses', 'teachers', 'parents'],
  tone: ['technical', 'academic', 'practical', 'hands-on', 'light-hearted', 'humorous', 'serious', 'inspirational'],
  pace: ['fast', 'quick', 'short', 'breezy', 'deep', 'comprehensive', 'in-depth', 'slow'],
  domain: ['health', 'medicine', 'nutrition', 'finance', 'investing', 'history', 'tech', 'software', 'design', 'psychology', 'productivity', 'business', 'leadership'],
  goal: ['learn', 'study', 'revise', 'relax', 'entertain', 'diet', 'lose weight', 'build', 'ship', 'launch']
};

function normalize(text) {
  return (text || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

// Lightweight rule-based intent parser → facets
function parseIntent(query) {
  const q = normalize(query);
  const facets = { audience: [], tone: [], pace: [], domain: [], goal: [], tokens: [] };
  if (!q) return facets;
  Object.entries(INTENT_DICTIONARY).forEach(([key, list]) => {
    list.forEach(word => {
      const pattern = new RegExp(`(^|\\s)${word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}(\\s|$)`);
      if (pattern.test(q)) facets[key].push(word);
    });
  });
  facets.tokens = q.split(' ').filter(Boolean);
  return facets;
}

// Build semanticText per book
function buildSemanticText(book) {
  const parts = [
    book.title,
    book.author,
    (book.blurb || ''),
    (book.tags || []).join(' '),
    (book.authorTags || []).join(' '),
    (book.primaryLanguage || ''),
    (book.authorRegion || '')
  ];
  return normalize(parts.join(' '));
}

// Resolve a cover URL from multiple possible fields - Firebase Storage URLs only
function resolveCoverUrl(data) {
  // Try direct cover URL fields first (should be Firebase Storage URLs from review submission)
  const directUrl = String(
    data.coverUrl || 
    data.imageUrl || 
    data.image || 
    data.thumbnail || 
    data.cover || 
    ''
  ).trim();
  
  if (directUrl && directUrl !== 'undefined' && directUrl !== 'null') {
    // Normalize http to https for security
    return directUrl.replace(/^http:\/\//, 'https://');
  }
  
  // No external fallbacks - return empty string for text cover fallback
  return '';
}

// Simple client-side cache for covers
const coverCache = new Map();

// No API fetching - we use only what's in the book document
function getCachedCoverUrl(book) {
  // Check cache first
  const cacheKey = `${book.title}|${book.author}|${book.isbn}`;
  if (coverCache.has(cacheKey)) {
    return coverCache.get(cacheKey);
  }
  return null;
}

// Lazy-load USE model; fallback gracefully
let __useModel = null;
async function ensureUSELoaded() {
  if (__useModel) return __useModel;
  try {
    // Load TFJS first
    await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.16.0/dist/tf.min.js');
    // Load Universal Sentence Encoder (ESM build)
    const use = await import('https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder@1.3.3/dist/universal-sentence-encoder.esm.js');
    __useModel = await use.load();
    return __useModel;
  } catch (err) {
    console.warn('USE failed to load, will fallback to rule-based scoring', err);
    return null;
  }
}

const embeddingCache = new Map();
async function embedText(text) {
  const key = text;
  if (embeddingCache.has(key)) return embeddingCache.get(key);
  const model = await ensureUSELoaded();
  if (!model) return null;
  const emb = await model.embed([text]);
  const arr = await emb.array();
  emb.dispose();
  const vec = arr[0];
  embeddingCache.set(key, vec);
  return vec;
}

function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function computeTagOverlapScore(book, facets) {
  const tags = new Set([...(book.tags || []), ...(book.authorTags || [])].map(normalize));
  const sought = new Set([...facets.audience, ...facets.tone, ...facets.pace, ...facets.domain, ...facets.goal].map(normalize));
  if (tags.size === 0 || sought.size === 0) return 0;
  let hit = 0;
  sought.forEach(t => { if (tags.has(t)) hit++; });
  const denom = Math.max(1, Math.min(tags.size, sought.size));
  return Math.min(1, hit / denom);
}

function popularityScore(book) {
  const rc = Number(book.reviewCount || 0);
  // Smooth log scale 0..1
  return Math.max(0, Math.min(1, Math.log10(1 + rc) / 2));
}

async function hybridRerank(books, query) {
  const weights = getWeights();
  const facets = parseIntent(query);
  const qText = normalize(query);
  let qEmb = null;
  try {
    qEmb = await embedText(qText);
  } catch (_) {}
  
  const scored = [];
  for (const book of books) {
    const semanticText = book.semanticText || buildSemanticText(book);
    let cos = 0;
    if (qEmb) {
      try {
        const bEmb = await embedText(semanticText);
        cos = cosine(qEmb, bEmb);
      } catch (_) { cos = 0; }
    }
    const overlap = computeTagOverlapScore(book, facets);
    const pop = popularityScore(book);
    const score = (weights.cosine * cos) + (weights.tagOverlap * overlap) + (weights.popularity * pop);
    scored.push({ book, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.book);
}

// Lightweight rule-based reranker for small catalogs or no embeddings
const SIMPLE_WEIGHTS = { phrase: 0.45, tokens: 0.25, overlap: 0.15, popularity: 0.1, recency: 0.05 };
function daysAgo(date) {
  const d = (date instanceof Date) ? date : new Date(date);
  const ms = Date.now() - (d?.getTime?.() || Date.now());
  return Math.max(0, ms / (1000 * 60 * 60 * 24));
}
function recencyScore(createdAt) {
  const da = daysAgo(createdAt || new Date());
  // 0..1, decays after ~90 days
  return Math.max(0, Math.min(1, 1 - (da / 90)));
}
function simpleRerank(books, query) {
  const q = normalize(query);
  if (!q) return books;
  const tokens = q.split(' ').filter(Boolean);
  const scored = books.map(book => {
    const st = book.semanticText || buildSemanticText(book);
    const title = normalize(book.title || '');
    const blurb = normalize(book.blurb || '');
    // phrase match boost
    let phrase = 0;
    if (title.includes(q)) phrase += 1;
    if (blurb.includes(q)) phrase += 0.5;
    if (st.includes(q)) phrase += 0.25;
    phrase = Math.min(1, phrase);
    // token overlap
    let tokenHits = 0;
    tokens.forEach(t => { if (st.includes(t)) tokenHits++; });
    const tokenScore = tokens.length ? (tokenHits / tokens.length) : 0;
    // tag overlap via intent facets
    const overlap = computeTagOverlapScore(book, parseIntent(q));
    const pop = popularityScore(book);
    const rec = recencyScore(book.createdAt);
    const score =
      SIMPLE_WEIGHTS.phrase * phrase +
      SIMPLE_WEIGHTS.tokens * tokenScore +
      SIMPLE_WEIGHTS.overlap * overlap +
      SIMPLE_WEIGHTS.popularity * pop +
      SIMPLE_WEIGHTS.recency * rec;
    return { book, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.book);
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
    this.lastSearchQuery = '';
    // Cache for top tags per book to avoid repeated reads
    this.topTagsCache = new Map();
    
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
    this.currentPage = 1;
    this.books = [];
    this.lastDoc = null;
    this.hasMoreBooks = true;
    await this.loadMoreBooks();
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
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      if (error.code === 'failed-precondition') {
        this.showError('Database index required. Please contact support.');
      } else {
        this.showError('Failed to load books. Please try again.');
      }
    } finally {
      this.isLoading = false;
      this.showLoading(false);
    }
  }

  async fetchBooks(page, filters) {
    // Allow fetchBooks to run even when outer loader is active. Concurrency is
    // controlled by loadMoreBooks(); guarding here prevents any results.
    this.lastSearchQuery = (filters && filters.search) ? String(filters.search) : '';
    
    try {
      let booksQuery = collection(db, 'books');
      const pageSize = 12;
      
      const hasLanguage = !!(filters.language && filters.language !== '');
      const hasRegion = !!(filters.region && filters.region !== '');
      if (hasLanguage) {
        booksQuery = query(booksQuery, where('primaryLanguage', '==', filters.language));
      }
      if (hasRegion) {
        booksQuery = query(booksQuery, where('authorRegion', '==', filters.region));
      }
      
      let sortField = 'publishedAt';
      let sortOrder = 'desc';
      switch (filters.sort) {
        case 'popular':
          sortField = 'reviewCount';
          sortOrder = 'desc';
          break;
        case 'title':
          sortField = 'title';
          sortOrder = 'asc';
          break;
        case 'recent':
        default:
          sortField = 'publishedAt';
          sortOrder = 'desc';
      }
      if ((hasLanguage || hasRegion) && sortField === 'publishedAt') {
          sortField = 'createdAt';
        sortOrder = 'desc';
      }
      
      // Build pagination constraints in a single query to preserve ordering/limit
      const constraints = [orderBy(sortField, sortOrder)];
      if (this.lastDoc && page > 1) {
        constraints.push(startAfter(this.lastDoc));
      }
      constraints.push(limit(pageSize));
      booksQuery = query(booksQuery, ...constraints);
      
      const booksSnap = await getDocs(booksQuery);
      
      if (booksSnap.docs.length === 0 && page === 1) {
        this.showEmptyState();
        return [];
      }
      if (booksSnap.docs.length > 0) {
        this.lastDoc = booksSnap.docs[booksSnap.docs.length - 1];
        this.hasMoreBooks = booksSnap.docs.length === pageSize;
      } else {
        this.hasMoreBooks = false;
      }
      
      const books = booksSnap.docs.map(doc => {
        const data = doc.data();
        // Ensure required fields for data hygiene
        if (!doc.id || !data.title || !data.author) {
          console.warn('Book missing required fields:', { id: doc.id, title: data.title, author: data.author });
        }
        // Normalize Firestore Timestamp/Date for createdAt
        const createdAtRaw = data.publishedAt || data.createdAt;
        let createdAt = new Date();
        try {
          if (createdAtRaw && typeof createdAtRaw.toDate === 'function') {
            createdAt = createdAtRaw.toDate();
          } else if (createdAtRaw instanceof Date) {
            createdAt = createdAtRaw;
          } else if (typeof createdAtRaw === 'number') {
            createdAt = new Date(createdAtRaw);
          }
        } catch (_) {}
        const coverUrl = resolveCoverUrl(data);
        const book = {
          id: doc.id,
          title: data.title || 'Untitled',
          author: data.author || 'Unknown Author',
          coverUrl,
          reviewCount: data.reviewCount || 0,
          primaryLanguage: data.primaryLanguage || 'en',
          authorRegion: data.authorRegion || 'unknown',
          publicationYear: data.publicationYear || null,
          authorTags: data.authorTags || [],
          topTags: Array.isArray(data.topTags) ? data.topTags : [],
          blurb: data.blurb || '',
          createdAt,
          // Additional fields for cover resolution
          isbn: data.isbn13 || data.isbn10 || data.isbn || '',
          openLibraryId: data.openLibraryId || data.olid || '',
          imageUrl: data.imageUrl || '',
          image: data.image || '',
          thumbnail: data.thumbnail || '',
          cover: data.cover || ''
        };
        
        // No API pre-resolution - we use only what's in the document
        // If there's a cached cover URL from a previous session, use it
        const cachedCover = getCachedCoverUrl(book);
        if (cachedCover && !coverUrl) {
          book.coverUrl = cachedCover;
        }
        
        return book;
      })
      // Filter out invalid books only; allow missing covers (grid renders text cover)
      .filter(book => book.id && book.title && book.author);
      
      if (filters.search && filters.search.trim()) {
        // If catalog is small (< 30) or model not yet loaded, use simple reranker
        const useSimple = books.length < 30;
        if (useSimple) {
          return simpleRerank(books, filters.search.trim());
        }
        // Hybrid rerank with embeddings + tag/popularity; fallback to simple
        try {
          const reranked = await hybridRerank(books, filters.search.trim());
          return reranked;
        } catch (e) {
          console.warn('Hybrid rerank failed, using simple rerank', e);
          return simpleRerank(books, filters.search.trim());
        }
      }
      return books;
    } catch (error) {
      console.error('ForestDiscovery: Firestore query failed:', error);
      return [];
    }
  }

  semanticSearch(books, query) {
    
    const queryTags = extractSemanticTags(query);
    
    const scoredBooks = books.map(book => {
      const score = this.calculateSemanticScore(book, query, queryTags);
      return { ...book, semanticScore: score };
    });
    
    // Sort by semantic score (highest first)
    scoredBooks.sort((a, b) => b.semanticScore - a.semanticScore);
    
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
      
      // After initial render, fetch top tags asynchronously and update overlay
      // Use materialized topTags if present; otherwise fetch from reviews
      const initial = Array.isArray(book.topTags) ? book.topTags.slice(0,5) : [];
      if (initial.length) {
        const overlay = bookCard.querySelector('[data-tags-overlay]');
        if (overlay) {
          overlay.innerHTML = initial.map(tag => (
            `<span class=\"px-2 py-1 bg-white/90 text-gray-800 text-xs rounded-full font-medium mr-1 mb-1 inline-block\">${this.escapeHtml(tag)}</span>`
          )).join('');
        }
      }
      this.getTopTagsForBook(book.id).then(tags => {
        const overlay = bookCard.querySelector('[data-tags-overlay]');
        if (!overlay) return;
        overlay.innerHTML = tags.map(tag => (
          `<span class="px-2 py-1 bg-white/90 text-gray-800 text-xs rounded-full font-medium mr-1 mb-1 inline-block">${this.escapeHtml(tag)}</span>`
        )).join('');
      }).catch(err => console.warn('Top tags fetch failed for book', book.id, err));
    });
  }

  createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer';
    
    // Guard against missing book.id to prevent book.html?id=undefined
    if (book.id) {
      card.onclick = () => viewBook(book.id);
    } else {
      card.className += ' pointer-events-none opacity-60';
      console.warn('Book card missing ID:', book);
    }
    
    const whyChips = this.buildWhyChips(book, this.lastSearchQuery);
    
    // Use same cover resolution logic as book pages - no backup images, only text fallback
    const resolvedCoverUrl = resolveCoverUrl(book);
    const hasCover = !!(resolvedCoverUrl && String(resolvedCoverUrl).trim());
    
    const coverSection = hasCover
      ? `
        <div class="relative bg-gray-200 overflow-hidden" data-cover style="aspect-ratio:3/4;">
          <img src="${resolvedCoverUrl}"
               alt="${this.escapeHtml(book.title)}"
               class="w-full h-full object-cover"
               referrerpolicy="no-referrer"
               crossorigin="anonymous"
               loading="lazy"
               decoding="async"
               onerror="this.parentElement.replaceWith((() => { 
                 const div = document.createElement('div'); 
                 div.className = 'relative bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center'; 
                 div.setAttribute('data-cover', ''); 
                 div.style.aspectRatio = '3/4'; 
                 div.innerHTML = \`<div class='text-center px-4'><div class='text-base font-semibold text-white line-clamp-3'>${this.escapeHtml(book.title)}</div><div class='mt-1 text-sm text-white/80 line-clamp-1'>by ${this.escapeHtml(book.author)}</div></div><div class='absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 via-black/30 to-transparent'><div class='flex flex-wrap' data-tags-overlay></div></div>\`; 
                 return div; 
               })())">
          <div class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/75 via-black/40 to-transparent">
            <div class="flex flex-wrap" data-tags-overlay></div>
          </div>
        </div>
      `
      : `
        <div class="relative bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center" data-cover style="aspect-ratio:3/4;">
          <div class="text-center px-4">
            <div class="text-base font-semibold text-white line-clamp-3">${this.escapeHtml(book.title)}</div>
            <div class="mt-1 text-sm text-white/80 line-clamp-1">by ${this.escapeHtml(book.author)}</div>
          </div>
          <div class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
            <div class="flex flex-wrap" data-tags-overlay></div>
          </div>
        </div>
      `;

    card.innerHTML = `
      ${coverSection}
      <div class="p-4">
        <h3 class="font-semibold text-lg text-forest-text mb-1 line-clamp-2">${this.escapeHtml(book.title)}</h3>
        <p class="text-forest-text-muted mb-2">by ${this.escapeHtml(book.author)}</p>
        ${whyChips}
        <div class="flex items-center justify-between mt-1">
          <span class="text-sm text-forest-text-muted">${Number(book.reviewCount || 0)} reviews</span>
          <span class="text-xs text-forest-text-muted">${this.formatRegion(book.authorRegion)}</span>
        </div>
      </div>
    `;
    
    return card;
  }


  // Fetch and cache top tags (by frequency) from review moods
  async getTopTagsForBook(bookId) {
    if (!bookId) return [];
    if (this.topTagsCache.has(bookId)) return this.topTagsCache.get(bookId);
    try {
      const q = query(
        collection(db, 'reviews'),
        where('bookId', '==', bookId),
        limit(50)
      );
      const snap = await getDocs(q);
      const counts = Object.create(null);
      snap.forEach(docSnap => {
        const d = docSnap.data();
        const moods = Array.isArray(d?.moods) ? d.moods : [];
        moods.forEach(m => {
          const key = String(m || '').toLowerCase().trim();
          if (!key) return;
          counts[key] = (counts[key] || 0) + 1;
        });
      });
      const top = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([t]) => t);
      this.topTagsCache.set(bookId, top);
      return top;
    } catch (err) {
      console.warn('getTopTagsForBook failed:', err);
      this.topTagsCache.set(bookId, []);
      return [];
    }
  }

  escapeHtml(s) {
    return String(s || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  buildWhyChips(book, query) {
    const q = normalize(query || '');
    if (!q) return '';
    const facets = parseIntent(q);
    const show = [];
    if (facets.audience.length) show.push(`for ${facets.audience[0]}`);
    if (facets.tone.length) show.push(facets.tone[0]);
    if (facets.pace.length) show.push(facets.pace[0]);
    if (facets.domain.length) show.push(facets.domain[0]);
    if (facets.goal.length) show.push(facets.goal[0]);
    const chips = show.slice(0, 3).map(txt => `<span class="inline-block text-xs bg-gray-100 text-forest-text px-2 py-1 rounded mr-2 mb-2">${txt}</span>`);
    if (!chips.length) return '';
    return `<div class="mb-3">${chips.join('')}</div>`;
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
    const booksGrid = document.getElementById('booksGrid');
    if (!emptyState || !booksGrid) return;
    const isEmpty = this.books.length === 0;
    // Toggle via utility classes only; avoid inline display conflicts
    emptyState.classList.toggle('hidden', !isEmpty);
    booksGrid.classList.toggle('hidden', isEmpty);
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

// Add showEmptyState method to ForestDiscovery prototype
ForestDiscovery.prototype.showEmptyState = function() {
  const booksGrid = document.getElementById('booksGrid');
  const emptyState = document.getElementById('emptyState');
  if (!booksGrid || !emptyState) return;
  emptyState.classList.remove('hidden');
  booksGrid.classList.add('hidden');
};

// Initialize when DOM is ready (works whether imported before or after DOMContentLoaded)
(function initForestDiscoveryImmediate() {
  function start() {
    if (!window.db) {
      console.error('Forest Discovery: Firebase db not available!');
      return;
    }
    if (!window.app) {
      console.error('Forest Discovery: Firebase app not available!');
      return;
    }
    try {
      window.forestDiscovery = new ForestDiscovery();
    } catch (error) {
      console.error('Forest Discovery: Failed to initialize:', error);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();

// Global cover function for consistency with book pages
window.coverFor = function(book) {
  return resolveCoverUrl(book);
};

import { db } from './firebase-config.js';
import { doc, getDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function coverForLocal(book){
  if (window.coverFor) return window.coverFor(book);
  return book.coverUrl || '';
}

async function loadBook() {
  const id = getQueryParam('id');

  try {
    if (id) {
      const ref = doc(db, 'books', String(id));
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const b = snap.data();
        renderBook({
          id,
          title: b.title,
          author: b.author,
          language: b.primaryLanguage || b.language,
          region: b.authorRegion || b.region,
          blurb: b.blurb,
          rating: b.rating,
          year: b.publicationYear || b.year,
          tags: b.tags || b.authorTags || [],
          coverUrl: b.coverUrl
        });
        return;
      }
    }
  } catch (e) {
    console.warn('Firestore not available or book missing, using fallback.', e);
  }

  const fallbacks = (window.SAMPLE_BOOKS || []);
  const fallback = fallbacks.find(b => b.id === id) || fallbacks[0] || { title: 'Book', author: 'Unknown', blurb: 'No details available yet.', tags: [] };
  renderBook({ ...fallback });
}

function renderBook(book) {
  const $ = (id) => document.getElementById(id);
  
  // Update book details to match HTML IDs
  if ($('title')) $('title').textContent = book.title || 'Untitled';
  if ($('author')) $('author').textContent = book.author ? `By ${book.author}` : '';
  if ($('publicationYear')) $('publicationYear').textContent = book.year ?? '—';
  if ($('authorRegion')) $('authorRegion').textContent = book.region ?? '—';
  if ($('primaryLanguage')) $('primaryLanguage').textContent = book.language ?? '—';

  // Set cover image
  const cover = $('coverImg');
  if (cover) cover.src = coverForLocal(book);

  // Update tags
  const tags = $('authorTags');
  if (tags) {
    if (book.tags && book.tags.length > 0) {
      tags.innerHTML = book.tags.slice(0, 6).map(tag => 
        `<span class="bg-[#5A6560] text-white/90 px-2 py-1 rounded-full text-xs mr-1">${tag}</span>`
      ).join('');
    } else {
      tags.textContent = '—';
    }
  }

  // Load review insights instead of static blurb
  loadReviewInsights(book.id);
}

// Load review insights from aggregated review data
async function loadReviewInsights(bookId) {
  const insightsContainer = document.getElementById('reviewInsights');
  if (!insightsContainer) return;

  try {
    // Query reviews for this book
    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, where('bookId', '==', bookId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      insightsContainer.innerHTML = `
        <div class="bg-[#5A6560] rounded-lg p-4">
          <h3 class="font-semibold text-white mb-2">📚 Reader Insights</h3>
          <p class="text-white/70 text-sm">No reviews yet. Be the first to share your thoughts!</p>
        </div>
      `;
      return;
    }

    // Aggregate review data
    const reviews = snapshot.docs.map(doc => doc.data());
    const insights = generateInsights(reviews);
    
    // Render insights
    insightsContainer.innerHTML = `
      <div class="bg-[#5A6560] rounded-lg p-4 space-y-4">
        <h3 class="font-semibold text-white mb-3">📚 What Readers Are Saying</h3>
        ${insights.topMoods.length > 0 ? `
          <div>
            <h4 class="text-sm font-medium text-white/90 mb-2">Common Feelings</h4>
            <div class="flex flex-wrap gap-2">
              ${insights.topMoods.map(mood => `
                <span class="bg-forest-accent/20 text-forest-accent px-2 py-1 rounded-full text-xs">
                  ${mood.emoji} ${mood.name} (${mood.count})
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}
        ${insights.keyPhrases.length > 0 ? `
          <div>
            <h4 class="text-sm font-medium text-white/90 mb-2">Key Themes</h4>
            <div class="text-white/70 text-sm">
              ${insights.keyPhrases.slice(0, 3).map(phrase => `"${phrase}"`).join(' • ')}
            </div>
          </div>
        ` : ''}
        <div class="text-xs text-white/50">Based on ${reviews.length} reader review${reviews.length !== 1 ? 's' : ''}</div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading review insights:', error);
    insightsContainer.innerHTML = `
      <div class="bg-[#5A6560] rounded-lg p-4">
        <h3 class="font-semibold text-white mb-2">📚 Reader Insights</h3>
        <p class="text-white/70 text-sm">Unable to load insights at the moment.</p>
      </div>
    `;
  }
}

// Generate insights from review data
function generateInsights(reviews) {
  // Aggregate moods
  const moodCounts = {};
  const moodEmojis = {
    inspiring: '✨', mysterious: '🌙', emotional: '💝', suspenseful: '⚡',
    thoughtful: '🤔', adventurous: '🗺️', romantic: '💕', dark: '🌚',
    uplifting: '🌟', intense: '🔥', peaceful: '🕊️', funny: '😄'
  };

  reviews.forEach(review => {
    if (review.moods) {
      review.moods.forEach(mood => {
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      });
    }
  });

  const topMoods = Object.entries(moodCounts)
    .map(([mood, count]) => ({
      name: mood.charAt(0).toUpperCase() + mood.slice(1),
      count,
      emoji: moodEmojis[mood] || '📖'
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // Extract key phrases from review text
  const allText = reviews.map(r => r.text || '').join(' ').toLowerCase();
  const commonPhrases = extractKeyPhrases(allText);

  return {
    topMoods,
    keyPhrases: commonPhrases,
    totalReviews: reviews.length
  };
}

// Simple key phrase extraction
function extractKeyPhrases(text) {
  const phrases = [];
  
  // Common positive patterns
  const positivePatterns = [
    /beautifully written/g, /well developed/g, /highly recommend/g,
    /page turner/g, /couldn't put.*down/g, /amazing story/g,
    /great characters/g, /wonderful book/g, /excellent read/g
  ];
  
  positivePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        if (!phrases.includes(match)) {
          phrases.push(match);
        }
      });
    }
  });
  
  return phrases.slice(0, 5);
}

document.addEventListener('DOMContentLoaded', loadBook);



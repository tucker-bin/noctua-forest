import { db } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

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
  $('bookTitle').textContent = book.title || 'Untitled';
  $('bookAuthor').textContent = book.author ? `By ${book.author}` : '';
  $('bookRating').textContent = `⭐ ${book.rating ?? '—'}`;
  $('bookYear').textContent = book.year ?? '—';
  $('bookRegion').textContent = book.region ?? '—';
  $('bookLanguage').textContent = book.language ?? '—';
  $('bookBlurb').textContent = book.blurb || '';

  const cover = $('bookCover');
  cover.src = coverForLocal(book);

  const tags = $('bookTags');
  tags.innerHTML = '';
  (book.tags || []).slice(0, 6).forEach(tag => {
    const el = document.createElement('span');
    el.className = 'bg-[#5A6560] text-white/90 px-2 py-1 rounded-full text-xs';
    el.textContent = tag;
    tags.appendChild(el);
  });
}

document.addEventListener('DOMContentLoaded', loadBook);



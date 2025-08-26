import { db } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

async function loadBook() {
  const id = getQueryParam('id');
  const fallback = getFallback(parseInt(id || '0', 10));

  try {
    if (id) {
      const ref = doc(db, 'books', String(id));
      const snap = await getDoc(ref);
      if (snap.exists()) {
        renderBook(snap.data());
        return;
      }
    }
  } catch (e) {
    console.warn('Firestore not available or book missing, using fallback.', e);
  }

  renderBook(fallback);
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
  if (book.coverUrl) cover.src = book.coverUrl;

  const tags = $('bookTags');
  tags.innerHTML = '';
  (book.tags || []).slice(0, 6).forEach(tag => {
    const el = document.createElement('span');
    el.className = 'bg-[#5A6560] text-white/90 px-2 py-1 rounded-full text-xs';
    el.textContent = tag;
    tags.appendChild(el);
  });
}

function getFallback(id) {
  const base = {
    1: { title: 'Klara and the Sun', author: 'Kazuo Ishiguro', language: 'en', region: 'europe', rating: 4.1, year: 2021, blurb: 'An artificial friend observes the world with profound questions about love and humanity.', tags: ['science fiction', 'philosophical'] },
    2: { title: 'The Midnight Library', author: 'Matt Haig', language: 'en', region: 'europe', rating: 4.2, year: 2020, blurb: 'Between life and death there is a library where every book is a different life you could live.', tags: ['contemporary', 'philosophical'] },
    3: { title: 'Circe', author: 'Madeline Miller', language: 'en', region: 'north-america', rating: 4.3, year: 2018, blurb: 'A feminist retelling of the Greek goddess who transforms from an awkward nymph into a formidable witch.', tags: ['mythology', 'fantasy'] },
  };
  return base[id] || { title: 'Book', author: 'Unknown', blurb: 'No details available yet.', tags: [] };
}

document.addEventListener('DOMContentLoaded', loadBook);



// Amazon Product API Service
import { db } from '../firebase-config.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const bookCache = new Map();

export function extractASIN(url) {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('amazon')) {
      throw new Error('Not an Amazon URL');
    }

    const patterns = [
      /\/dp\/([A-Z0-9]{10})/i,
      /\/gp\/product\/([A-Z0-9]{10})/i,
      /\/([A-Z0-9]{10})\//i
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }

    throw new Error('Could not extract ASIN from URL');
  } catch (err) {
    console.error('Error extracting ASIN:', err);
    throw new Error('Invalid Amazon URL. Please check the format and try again.');
  }
}

export async function fetchBookMetadata(amazonUrl) {
  try {
    const asin = extractASIN(amazonUrl);
    
    if (bookCache.has(asin)) {
      return bookCache.get(asin);
    }

    const bookDoc = await getDoc(doc(db, 'book_metadata', asin));
    if (bookDoc.exists()) {
      const data = bookDoc.data();
      if (data.cachedAt && (Date.now() - data.cachedAt.toMillis()) < 30 * 24 * 60 * 60 * 1000) {
        bookCache.set(asin, data);
        return data;
      }
    }

    const response = await fetch(`/api/pa/items?asin=${encodeURIComponent(asin)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch book data');
    }

    const data = await response.json();
    if (!data || !data.title) {
      throw new Error('Invalid book data received');
    }

    const metadata = {
      asin: asin,
      title: data.title,
      author: data.author || 'Unknown',
      coverUrl: data.imageUrl,
      description: data.description || '',
      publisher: data.publisher || '',
      publicationDate: data.publicationDate || '',
      pageCount: data.pageCount || null,
      categories: data.categories || [],
      cachedAt: new Date()
    };

    await setDoc(doc(db, 'book_metadata', asin), metadata);
    bookCache.set(asin, metadata);
    
    return metadata;
  } catch (err) {
    console.error('Error fetching book metadata:', err);
    throw new Error('Could not fetch book details. Please check the URL and try again.');
  }
}

export function fillFormWithMetadata(metadata) {
  const fields = {
    title: metadata.title || '',
    author: metadata.author || '',
    blurb: metadata.description || ''
  };

  Object.entries(fields).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.value = value;
    }
  });
}
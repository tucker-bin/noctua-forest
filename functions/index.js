import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';

// Global options (region + minimal concurrency)
setGlobalOptions({ region: 'us-central1', concurrency: 10 });

// Initialize Admin SDK
initializeApp();
const db = getFirestore();

function normalizeTag(tag) {
  return String(tag || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

async function recomputeBookAggregates(bookId) {
  const reviewsRef = db.collection('reviews').where('bookId', '==', bookId).limit(200);
  const snap = await reviewsRef.get();
  const counts = Object.create(null);
  let reviewCount = 0;
  snap.forEach(doc => {
    reviewCount += 1;
    const data = doc.data() || {};
    const moods = Array.isArray(data.moods) ? data.moods : [];
    moods.forEach(m => {
      const key = normalizeTag(m);
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
  });
  const topTags = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);

  await db.collection('books').doc(bookId).set({
    topTags,
    reviewCount
  }, { merge: true });
}

export const onReviewWrite = onDocumentWritten('reviews/{reviewId}', async (event) => {
    try {
      const before = event.data?.before?.data() || null;
      const after = event.data?.after?.data() || null;

      const beforeBookId = before?.bookId || null;
      const afterBookId = after?.bookId || null;

      const affected = new Set();
      if (beforeBookId) affected.add(beforeBookId);
      if (afterBookId) affected.add(afterBookId);

      for (const bookId of affected) {
        if (!bookId) continue;
        await recomputeBookAggregates(bookId);
      }
    } catch (err) {
      console.error('onReviewWrite error:', err);
    }
  });



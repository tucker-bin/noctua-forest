// Review Service
import { db } from '../firebase-config.js';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { generateRandomForestName } from './randomForestNameService.js';

/**
 * Get aggregated mood data for a book
 */
export async function getBookMoods(bookId) {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('bookId', '==', bookId),
      where('moods', '!=', null)
    );

    const snapshot = await getDocs(q);
    const moodCounts = {};
    let totalReviews = 0;

    snapshot.forEach(doc => {
      const review = doc.data();
      if (review.moods && Array.isArray(review.moods)) {
        totalReviews++;
        review.moods.forEach(mood => {
          moodCounts[mood] = (moodCounts[mood] || 0) + 1;
        });
      }
    });

    // Convert to percentages and sort by count
    const moodStats = Object.entries(moodCounts)
      .map(([mood, count]) => ({
        mood,
        count,
        percentage: Math.round((count / totalReviews) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalReviews,
      moods: moodStats
    };
  } catch (err) {
    console.error('Error getting book moods:', err);
    return { totalReviews: 0, moods: [] };
  }
}

/**
 * Get content warnings for a book
 */
export async function getContentWarnings(bookId) {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('bookId', '==', bookId),
      where('contentWarnings', '!=', null)
    );

    const snapshot = await getDocs(q);
    const warningCounts = {};
    let totalReviews = 0;

    snapshot.forEach(doc => {
      const review = doc.data();
      if (review.contentWarnings && Array.isArray(review.contentWarnings)) {
        totalReviews++;
        review.contentWarnings.forEach(warning => {
          warningCounts[warning] = (warningCounts[warning] || 0) + 1;
        });
      }
    });

    // Convert to percentages and sort by count
    const warningStats = Object.entries(warningCounts)
      .map(([warning, count]) => ({
        warning,
        count,
        percentage: Math.round((count / totalReviews) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalReviews,
      warnings: warningStats
    };
  } catch (err) {
    console.error('Error getting content warnings:', err);
    return { totalReviews: 0, warnings: [] };
  }
}

/**
 * Get average interest level for a book
 */
export async function getAverageInterest(bookId) {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('bookId', '==', bookId),
      where('interestLevel', '>', 0)
    );

    const snapshot = await getDocs(q);
    let totalInterest = 0;
    let totalReviews = 0;

    snapshot.forEach(doc => {
      const review = doc.data();
      if (review.interestLevel) {
        totalInterest += review.interestLevel;
        totalReviews++;
      }
    });

    return {
      average: totalReviews > 0 ? Math.round((totalInterest / totalReviews) * 10) / 10 : 0,
      totalReviews
    };
  } catch (err) {
    console.error('Error getting average interest:', err);
    return { average: 0, totalReviews: 0 };
  }
}

/**
 * Get copy format distribution for a book
 */
export async function getCopyFormatStats(bookId) {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('bookId', '==', bookId),
      where('copyFormat', '!=', null)
    );
    const snapshot = await getDocs(q);
    const counts = { print: 0, ebook: 0, audiobook: 0, other: 0, total: 0 };
    snapshot.forEach(doc => {
      const r = doc.data();
      if (!r.copyFormat) return;
      const k = (r.copyFormat || '').toLowerCase();
      if (k === 'print' || k === 'printed' || k === 'paperback' || k === 'hardcover') counts.print++;
      else if (k === 'ebook' || k === 'e-book' || k === 'kindle') counts.ebook++;
      else if (k === 'audiobook' || k === 'audio') counts.audiobook++;
      else counts.other++;
      counts.total++;
    });
    return counts;
  } catch (err) {
    console.error('Error getting copy format stats:', err);
    return { print: 0, ebook: 0, audiobook: 0, other: 0, total: 0 };
  }
}

/**
 * Get helpful count for a review
 */
export async function getHelpfulCount(reviewId) {
  try {
    const helpfulRef = collection(db, 'helpful_votes');
    const q = query(helpfulRef, where('reviewId', '==', reviewId));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (err) {
    console.error('Error getting helpful count:', err);
    return 0;
  }
}

/**
 * Format mood name for display
 */
export function formatMoodName(mood) {
  return mood.charAt(0).toUpperCase() + mood.slice(1).replace(/_/g, ' ');
}

/**
 * Format warning name for display
 */
export function formatWarningName(warning) {
  return warning.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

/**
 * Get interest level label
 */
export function getInterestLabel(level) {
  const labels = {
    5: 'Must Read',
    4: 'Very Interested',
    3: 'Neutral',
    2: 'Not For Me',
    1: 'Skip It'
  };
  return labels[level] || '';
}

/**
 * Get mood color class
 */
export function getMoodColor(mood) {
  const colors = {
    inspiring: 'bg-yellow-500',
    heartwarming: 'bg-pink-500',
    mysterious: 'bg-purple-500',
    suspenseful: 'bg-red-500',
    funny: 'bg-green-500',
    dark: 'bg-gray-700',
    thoughtful: 'bg-blue-500',
    adventurous: 'bg-orange-500',
    romantic: 'bg-rose-400',
    emotional: 'bg-indigo-500',
    informative: 'bg-teal-500',
    relaxing: 'bg-emerald-500'
  };
  return colors[mood] || 'bg-gray-500';
}

/**
 * Submit a new review for a book
 * @param {Object} reviewData - The review data
 * @param {string} reviewData.bookId - The book ID
 * @param {string} reviewData.text - The review text
 * @param {string} reviewData.authorId - The user ID
 * @param {string} reviewData.authorAvatarUrl - The user's avatar URL
 * @param {number} reviewData.interestLevel - Interest level (1-5)
 * @param {Array} reviewData.moods - Array of mood tags
 * @param {Array} reviewData.contentWarnings - Array of content warnings
 * @param {boolean} reviewData.hasReadBook - Verification that user read the book
 * @param {boolean} reviewData.authenticReview - Verification that review is authentic
 * @param {boolean} reviewData.noAI - Verification that review is not AI-generated
 * @returns {Promise<Object>} The created review
 */
export async function submitReview(reviewData) {
  try {
    // Validate reading verification
    if (!reviewData.hasReadBook || !reviewData.authenticReview || !reviewData.noAI) {
      throw new Error('Reading verification required. You must confirm you have read the book and written an authentic review.');
    }

    // Generate random Forest name for this review
    const forestName = generateRandomForestName();

    const review = {
      bookId: reviewData.bookId,
      text: reviewData.text,
      authorId: reviewData.authorId,
      authorForestName: forestName, // Random name per review
      authorAvatarUrl: reviewData.authorAvatarUrl,
      moods: reviewData.moods || [],
      contentWarnings: reviewData.contentWarnings || [],
      copyFormat: reviewData.copyFormat || null,
      helpfulCount: 0,
      unhelpfulCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Verification flags
      verifiedRead: true,
      verifiedAuthentic: true,
      verifiedNoAI: true
    };

    const docRef = await addDoc(collection(db, 'reviews'), review);
    
    return {
      id: docRef.id,
      ...review
    };
  } catch (err) {
    console.error('Error submitting review:', err);
    throw err;
  }
}

/**
 * Get reviews for a specific book
 */
export async function getReviewsForBook(bookId) {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('bookId', '==', bookId),
      orderBy('createdAt', 'desc'),
      limit(10) // Limit to 10 reviews for performance
    );

    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return reviews;
  } catch (err) {
    console.error('Error getting reviews for book:', err);
    return [];
  }
}

/**
 * Get recent reviews for a user
 */
export async function getRecentReviews(userId, limit = 5) {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limit)
    );

    const snapshot = await getDocs(q);
    const reviews = [];
    
    for (const doc of snapshot.docs) {
      const review = doc.data();
      // Get book title
      try {
        const bookDoc = await getDoc(doc(db, 'books', review.bookId));
        const bookData = bookDoc.exists() ? bookDoc.data() : {};
        reviews.push({
          id: doc.id,
          bookId: review.bookId,
          bookTitle: bookData.title || 'Unknown Book',
          rating: review.interestLevel || 0,
          createdAt: review.createdAt
        });
      } catch (err) {
        console.error('Error getting book data:', err);
        reviews.push({
          id: doc.id,
          bookId: review.bookId,
          bookTitle: 'Unknown Book',
          rating: review.interestLevel || 0,
          createdAt: review.createdAt
        });
      }
    }

    return reviews;
  } catch (err) {
    console.error('Error getting recent reviews:', err);
    return [];
  }
}
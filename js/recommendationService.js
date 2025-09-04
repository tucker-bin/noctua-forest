// Recommendation Service
import { db } from '../firebase-config.js';
import { collection, query, where, getDocs, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const BOOKS_COLLECTION = 'books';
const REVIEWS_COLLECTION = 'reviews';

/**
 * Get similar books based on moods and genres
 */
export async function getSimilarBooks(bookId, { moods = [], genres = [], limit: resultLimit = 4 } = {}) {
    try {
        // Get the source book's details
        // Load source book by document ID
        const sourceRef = (await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')).doc(db, BOOKS_COLLECTION, String(bookId));
        const sourceSnap = await (await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')).getDoc(sourceRef);
        if (!sourceSnap.exists()) {
            throw new Error('Source book not found');
        }
        const sourceBook = sourceSnap.data();

        // If no moods/genres provided, use the source book's
        if (moods.length === 0) {
            // Get moods from reviews
            const reviewsQuery = query(
                collection(db, REVIEWS_COLLECTION),
                where('bookId', '==', bookId)
            );
            const reviewsSnap = await getDocs(reviewsQuery);
            const allMoods = new Set();
            reviewsSnap.forEach(doc => {
                const review = doc.data();
                if (review.moods) {
                    review.moods.forEach(mood => allMoods.add(mood));
                }
            });
            moods = Array.from(allMoods);
        }

        if (genres.length === 0 && sourceBook.genres) {
            genres = sourceBook.genres;
        }

        // Build query conditions
        const conditions = [];

        // Match by moods (if any)
        if (moods.length > 0) {
            // We'll do post-query filtering for mood matching
            // since Firestore doesn't support array contains any with multiple fields
        }

        // Match by genres (if any)
        if (genres.length > 0) {
            conditions.push(where('genres', 'array-contains-any', genres));
        }

        // Query books
        const booksQuery = query(
            collection(db, BOOKS_COLLECTION),
            ...conditions
        );

        const booksSnap = await getDocs(booksQuery);
        const books = [];

        booksSnap.forEach(doc => {
            const book = doc.data();
            const currentBookId = doc.id;
            
            // Skip the source book
            if (currentBookId === String(bookId)) {
                return;
            }
            
            // Calculate mood match score
            let moodScore = 0;
            if (moods.length > 0 && book.moods) {
                moodScore = moods.filter(mood => book.moods.includes(mood)).length;
            }

            books.push({
                ...book,
                moodScore
            });
        });

        // Sort by mood score (if moods were provided) and take top N
        if (moods.length > 0) {
            books.sort((a, b) => b.moodScore - a.moodScore);
        }

        return books.slice(0, resultLimit);
    } catch (err) {
        console.error('Error getting similar books:', err);
        return [];
    }
}

/**
 * Get books from the same author
 */
export async function getMoreFromAuthor(authorName, excludeBookId, { limit: resultLimit = 4 } = {}) {
    try {
        const booksQuery = query(
            collection(db, BOOKS_COLLECTION),
            where('author', '==', authorName)
        );

        const booksSnap = await getDocs(booksQuery);
        const books = [];

        booksSnap.forEach(doc => {
            const data = doc.data();
            const currentBookId = doc.id;
            if (currentBookId !== String(excludeBookId)) {
                books.push({
                    ...data,
                    id: currentBookId
                });
            }
        });

        // Sort by createdAt desc and limit
        return books
            .sort((a, b) => new Date(b.createdAt?.toDate?.() || b.createdAt || 0) - new Date(a.createdAt?.toDate?.() || a.createdAt || 0))
            .slice(0, resultLimit);
    } catch (err) {
        console.error('Error getting author books:', err);
        return [];
    }
}

/**
 * Get books that appear together in lists
 */
export async function getFrequentlyListedTogether(bookId, { limit: resultLimit = 4 } = {}) {
    try {
        // For now, return empty array to avoid permission issues
        // This feature can be re-enabled when reading_lists permissions are properly configured
        return [];
    } catch (err) {
        console.error('Error getting frequently listed together:', err);
        return [];
    }
}

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
        const sourceBookQuery = query(
            collection(db, BOOKS_COLLECTION),
            where('id', '==', bookId)
        );
        const sourceBookSnap = await getDocs(sourceBookQuery);
        if (sourceBookSnap.empty) {
            throw new Error('Source book not found');
        }
        const sourceBook = sourceBookSnap.docs[0].data();

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
        
        // Don't include the source book
        conditions.push(where('id', '!=', bookId));

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
            ...conditions,
            orderBy('createdAt', 'desc'),
            limit(resultLimit * 2) // Get extra to allow for mood filtering
        );

        const booksSnap = await getDocs(booksQuery);
        const books = [];

        booksSnap.forEach(doc => {
            const book = doc.data();
            
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
            where('author', '==', authorName),
            where('id', '!=', excludeBookId),
            orderBy('createdAt', 'desc'),
            limit(resultLimit)
        );

        const booksSnap = await getDocs(booksQuery);
        const books = [];

        booksSnap.forEach(doc => {
            books.push(doc.data());
        });

        return books;
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
        // Get all lists containing this book
        const listsQuery = query(
            collection(db, 'reading_lists'),
            where('books', 'array-contains', bookId)
        );
        const listsSnap = await getDocs(listsQuery);

        // Count co-occurrences
        const coOccurrences = new Map();
        listsSnap.forEach(doc => {
            const list = doc.data();
            list.books.forEach(otherBookId => {
                if (otherBookId !== bookId) {
                    coOccurrences.set(
                        otherBookId,
                        (coOccurrences.get(otherBookId) || 0) + 1
                    );
                }
            });
        });

        // Sort by frequency and get top N
        const topBookIds = Array.from(coOccurrences.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, resultLimit)
            .map(([id]) => id);

        // Fetch book details
        const books = [];
        for (const id of topBookIds) {
            const bookQuery = query(
                collection(db, BOOKS_COLLECTION),
                where('id', '==', id)
            );
            const bookSnap = await getDocs(bookQuery);
            if (!bookSnap.empty) {
                books.push(bookSnap.docs[0].data());
            }
        }

        return books;
    } catch (err) {
        console.error('Error getting frequently listed together:', err);
        return [];
    }
}

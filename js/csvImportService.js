// CSV Import Service for Curator Plus
import { db } from '../firebase-config.js';
import { 
    collection, doc, getDoc, addDoc, updateDoc, setDoc,
    query, where, orderBy, serverTimestamp, arrayUnion 
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const TO_REVIEW_COLLECTION = 'toReviewQueue';
const BOOKS_COLLECTION = 'books';

/**
 * Parse CSV content and extract book data
 * @param {string} csvContent - The CSV file content
 * @returns {Array} Array of book objects
 */
export function parseCSV(csvContent) {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const books = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length >= headers.length) {
            const book = {};
            headers.forEach((header, index) => {
                book[header] = values[index] || '';
            });
            books.push(book);
        }
    }
    
    return books;
}

/**
 * Validate and normalize book data from CSV
 * @param {Object} bookData - Raw book data from CSV
 * @returns {Object} Normalized book data
 */
export function normalizeBookData(bookData) {
    const normalized = {
        title: bookData.title || bookData.name || '',
        author: bookData.author || bookData.writer || '',
        isbn: bookData.isbn || bookData.isbn13 || bookData.isbn10 || '',
        asin: bookData.asin || '',
        amazonUrl: bookData.amazon_url || bookData.amazonurl || bookData.url || '',
        publisher: bookData.publisher || '',
        publicationDate: bookData.publication_date || bookData.date || '',
        pageCount: bookData.pages || bookData.page_count || '',
        categories: bookData.genre || bookData.categories || '',
        language: bookData.language || 'en',
        region: bookData.region || 'us'
    };

    // Clean up ISBN (remove hyphens, spaces)
    if (normalized.isbn) {
        normalized.isbn = normalized.isbn.replace(/[-\s]/g, '');
    }

    // Extract ASIN from Amazon URL if not provided
    if (!normalized.asin && normalized.amazonUrl) {
        const asinMatch = normalized.amazonUrl.match(/\/dp\/([A-Z0-9]{10})/);
        if (asinMatch) {
            normalized.asin = asinMatch[1];
        }
    }

    // Parse categories
    if (normalized.categories) {
        normalized.categories = normalized.categories.split(',').map(c => c.trim()).filter(Boolean);
    }

    return normalized;
}

/**
 * Check if a book already exists in the system
 * @param {Object} bookData - Normalized book data
 * @returns {Promise<Object|null>} Existing book or null
 */
export async function findExistingBook(bookData) {
    try {
        // Try to find by ISBN first
        if (bookData.isbn) {
            const isbnQuery = query(
                collection(db, BOOKS_COLLECTION),
                where('isbn', '==', bookData.isbn)
            );
            const isbnSnap = await getDocs(isbnQuery);
            if (!isbnSnap.empty) {
                return { id: isbnSnap.docs[0].id, ...isbnSnap.docs[0].data() };
            }
        }

        // Try to find by ASIN
        if (bookData.asin) {
            const asinQuery = query(
                collection(db, BOOKS_COLLECTION),
                where('asin', '==', bookData.asin)
            );
            const asinSnap = await getDocs(asinQuery);
            if (!asinSnap.empty) {
                return { id: asinSnap.docs[0].id, ...asinSnap.docs[0].data() };
            }
        }

        // Try to find by title and author (fuzzy match)
        if (bookData.title && bookData.author) {
            const titleQuery = query(
                collection(db, BOOKS_COLLECTION),
                where('title', '==', bookData.title)
            );
            const titleSnap = await getDocs(titleQuery);
            
            for (const doc of titleSnap.docs) {
                const data = doc.data();
                if (data.author && data.author.toLowerCase() === bookData.author.toLowerCase()) {
                    return { id: doc.id, ...data };
                }
            }
        }

        return null;
    } catch (error) {
        console.error('Error finding existing book:', error);
        return null;
    }
}

/**
 * Add books to the To-Review queue
 * @param {string} userId - The user's ID
 * @param {Array} books - Array of normalized book data
 * @returns {Promise<Object>} Import results
 */
export async function addToReviewQueue(userId, books) {
    const results = {
        imported: 0,
        duplicates: 0,
        errors: 0,
        books: []
    };

    for (const bookData of books) {
        try {
            // Check if book already exists
            const existingBook = await findExistingBook(bookData);
            
            if (existingBook) {
                // Book exists, add to user's to-review queue
                const queueItem = {
                    userId,
                    bookId: existingBook.id,
                    bookTitle: existingBook.title,
                    bookAuthor: existingBook.author,
                    status: 'pending',
                    addedAt: serverTimestamp(),
                    source: 'csv_import'
                };

                await addDoc(collection(db, TO_REVIEW_COLLECTION), queueItem);
                results.duplicates++;
                results.books.push({
                    title: existingBook.title,
                    author: existingBook.author,
                    status: 'existing',
                    bookId: existingBook.id
                });
            } else {
                // Book doesn't exist, create new book entry
                const newBook = {
                    ...bookData,
                    status: 'pending_review',
                    submittedBy: userId,
                    submittedAt: serverTimestamp(),
                    source: 'csv_import'
                };

                const bookRef = await addDoc(collection(db, BOOKS_COLLECTION), newBook);
                
                // Add to user's to-review queue
                const queueItem = {
                    userId,
                    bookId: bookRef.id,
                    bookTitle: bookData.title,
                    bookAuthor: bookData.author,
                    status: 'pending',
                    addedAt: serverTimestamp(),
                    source: 'csv_import'
                };

                await addDoc(collection(db, TO_REVIEW_COLLECTION), queueItem);
                results.imported++;
                results.books.push({
                    title: bookData.title,
                    author: bookData.author,
                    status: 'new',
                    bookId: bookRef.id
                });
            }
        } catch (error) {
            console.error('Error processing book:', bookData, error);
            results.errors++;
            results.books.push({
                title: bookData.title || 'Unknown',
                author: bookData.author || 'Unknown',
                status: 'error',
                error: error.message
            });
        }
    }

    return results;
}

/**
 * Get user's To-Review queue
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of queue items
 */
export async function getToReviewQueue(userId) {
    try {
        const queueQuery = query(
            collection(db, TO_REVIEW_COLLECTION),
            where('userId', '==', userId),
            orderBy('addedAt', 'desc')
        );

        const queueSnap = await getDocs(queueQuery);
        const queue = [];
        
        queueSnap.forEach(doc => {
            queue.push({ id: doc.id, ...doc.data() });
        });

        return queue;
    } catch (error) {
        console.error('Error getting to-review queue:', error);
        return [];
    }
}

/**
 * Remove item from To-Review queue
 * @param {string} queueItemId - The queue item ID
 * @returns {Promise<boolean>} Success status
 */
export async function removeFromQueue(queueItemId) {
    try {
        await updateDoc(doc(db, TO_REVIEW_COLLECTION, queueItemId), {
            status: 'removed',
            removedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error removing from queue:', error);
        return false;
    }
}

/**
 * Mark item as reviewed
 * @param {string} queueItemId - The queue item ID
 * @returns {Promise<boolean>} Success status
 */
export async function markAsReviewed(queueItemId) {
    try {
        await updateDoc(doc(db, TO_REVIEW_COLLECTION, queueItemId), {
            status: 'reviewed',
            reviewedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error marking as reviewed:', error);
        return false;
    }
}

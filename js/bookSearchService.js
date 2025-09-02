// Book Search Service
import { db } from '../firebase-config.js';
import { collection, query, where, getDocs, limit } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

/**
 * Search for books by ISBN, ASIN, or title/author combination
 */
export async function searchBooks(params) {
    try {
        const booksRef = collection(db, 'books');
        let q;

        // Search by ISBN (most reliable)
        if (params.isbn) {
            q = query(
                booksRef,
                where('isbn', '==', params.isbn.replace(/[-\s]/g, '')),
                limit(1)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                return {
                    found: true,
                    book: {
                        id: snapshot.docs[0].id,
                        ...snapshot.docs[0].data()
                    }
                };
            }
        }

        // Search by ASIN
        if (params.asin) {
            q = query(
                booksRef,
                where('asin', '==', params.asin),
                limit(1)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                return {
                    found: true,
                    book: {
                        id: snapshot.docs[0].id,
                        ...snapshot.docs[0].data()
                    }
                };
            }
        }

        // Search by title and author combination
        if (params.title && params.author) {
            // Normalize strings for comparison
            const normalizeStr = str => str.toLowerCase().trim();
            const title = normalizeStr(params.title);
            const author = normalizeStr(params.author);

            // First try exact match
            q = query(
                booksRef,
                where('titleLower', '==', title),
                where('authorLower', '==', author),
                limit(1)
            );
            let snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                return {
                    found: true,
                    book: {
                        id: snapshot.docs[0].id,
                        ...snapshot.docs[0].data()
                    }
                };
            }

            // Then try fuzzy match on title
            q = query(
                booksRef,
                where('titleLower', '>=', title),
                where('titleLower', '<=', title + '\uf8ff'),
                limit(5)
            );
            snapshot = await getDocs(q);

            // Check for close matches
            const matches = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (normalizeStr(data.author) === author) {
                    matches.push({
                        id: doc.id,
                        ...data
                    });
                }
            });

            if (matches.length > 0) {
                return {
                    found: true,
                    book: matches[0],
                    alternatives: matches.slice(1)
                };
            }
        }

        return { found: false };
    } catch (err) {
        console.error('Error searching books:', err);
        throw err;
    }
}

/**
 * Extract ISBN from Amazon URL or text
 */
export function extractISBN(text) {
    // ISBN-13: 978-0-123456-78-9
    // ISBN-10: 0-123456-78-9
    const isbnRegex = /(?:ISBN[:-]?1[03]?[:-]?)?(?=[-0-9 ]{17}|[-0-9X ]{13})(?:97[89][:-]?)?[0-9]{1,5}[:-]?[0-9]+[:-]?[0-9]+[:-]?[0-9X]/gi;
    const matches = text.match(isbnRegex);
    if (matches) {
        // Clean up the ISBN
        return matches[0].replace(/[-\s]/g, '');
    }
    return null;
}

/**
 * Extract ASIN from Amazon URL
 */
export function extractASIN(url) {
    try {
        const urlObj = new URL(url);
        if (!urlObj.hostname.includes('amazon')) {
            return null;
        }

        // Try common ASIN patterns
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

        return null;
    } catch (err) {
        return null;
    }
}

/**
 * Prepare book data for storage
 */
export function prepareBookData(data) {
    return {
        ...data,
        titleLower: data.title.toLowerCase().trim(),
        authorLower: data.author.toLowerCase().trim(),
        isbn: data.isbn?.replace(/[-\s]/g, ''),
        createdAt: new Date()
    };
}

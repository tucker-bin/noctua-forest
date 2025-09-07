// Book Service
import { BaseService } from './BaseService.js';
import { serverTimestamp, addDoc, updateDoc, doc, increment } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

class BookService extends BaseService {
    constructor() {
        super();
        this.BOOKS_COLLECTION = 'books';
        this.SUBMISSIONS_COLLECTION = 'submissions';
    }

    async getBook(bookId) {
        return await this.getDocument(this.BOOKS_COLLECTION, bookId);
    }

    async queryBooks({ conditions = [], orderByField = 'createdAt', startAfter = null, limit = 12 } = {}) {
        try {
            let queryConditions = [...conditions];
            
            // Add startAfter if provided
            if (startAfter) {
                queryConditions.push({ field: orderByField, operator: '>', value: startAfter[orderByField] });
            }

            const books = await this.queryCollection(
                this.BOOKS_COLLECTION,
                queryConditions,
                orderByField,
                limit
            );

            // Resolve cover URLs
            return await Promise.all(
                books.map(async book => ({
                    ...book,
                    coverUrl: await this.resolveCoverUrl(book)
                }))
            );
        } catch (error) {
            throw this.handleError(error, 'Query Books');
        }
    }

    async resolveCoverUrl(book) {
        if (!book) return null;

        // If we have a direct cover URL, ensure it's HTTPS
        if (book.coverUrl) {
            return book.coverUrl.replace(/^http:/, 'https:');
        }

        // Try ISBN-based Open Library cover
        if (book.isbn) {
            const url = `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;
            try {
                const response = await fetch(url, { method: 'HEAD' });
                if (response.ok) {
                    return url;
                }
            } catch (error) {
                console.warn('Failed to check Open Library cover:', error);
            }
        }

        // Try title-based Open Library search
        if (book.title && book.author) {
            try {
                const query = encodeURIComponent(`${book.title} ${book.author}`);
                const searchUrl = `https://openlibrary.org/search.json?q=${query}&limit=1`;
                const response = await fetch(searchUrl);
                const data = await response.json();
                
                if (data.docs && data.docs[0] && data.docs[0].cover_i) {
                    return `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`;
                }
            } catch (error) {
                console.warn('Failed to search Open Library:', error);
            }
        }

        // Return null to trigger text-based cover
        return null;
    }

    async createBook(bookData) {
        try {
            this.validateRequired(bookData, ['title', 'author']);

            const book = {
                title: bookData.title,
                author: bookData.author,
                coverUrl: bookData.coverUrl || null,
                description: bookData.description || '',
                genres: bookData.genres || [],
                moods: bookData.moods || [],
                primaryLanguage: bookData.primaryLanguage || 'en',
                authorRegion: bookData.authorRegion || null,
                publicationYear: bookData.publicationYear || null,
                publishedAt: bookData.publishedAt || null,
                isbn: bookData.isbn || null,
                reviewCount: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            try {
                // Try direct book creation
                const docRef = await addDoc(collection(this.db, this.BOOKS_COLLECTION), book);
                return { id: docRef.id, ...book };
            } catch (err) {
                // Fallback to submissions queue
                const sub = {
                    type: 'book',
                    payload: book,
                    status: 'pending',
                    createdAt: serverTimestamp()
                };
                const subRef = await addDoc(collection(this.db, this.SUBMISSIONS_COLLECTION), sub);
                return { id: subRef.id, ...book, status: 'pending' };
            }
        } catch (error) {
            throw this.handleError(error, 'Create Book');
        }
    }

    async updateBook(bookId, updates) {
        try {
            const bookRef = doc(this.db, this.BOOKS_COLLECTION, bookId);
            await updateDoc(bookRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            return await this.getBook(bookId);
        } catch (error) {
            throw this.handleError(error, 'Update Book');
        }
    }

    async searchBooks(query, limit = 20) {
        // Note: This is a simple implementation. For production, consider using Algolia or similar
        const conditions = [
            { 
                field: 'title', 
                operator: '>=', 
                value: query.toLowerCase() 
            },
            { 
                field: 'title', 
                operator: '<=', 
                value: query.toLowerCase() + '\uf8ff' 
            }
        ];
        return await this.queryBooks({ conditions, limit });
    }

    async getRecentBooks(limit = 20) {
        return await this.queryBooks({ limit });
    }

    async getSimilarBooks(bookId, { moods = [], genres = [], limit = 4 } = {}) {
        try {
            // Get the source book
            const sourceBook = await this.getBook(bookId);
            if (!sourceBook) {
                throw new Error('Source book not found');
            }

            // If no moods/genres provided, use the source book's
            const searchMoods = moods.length > 0 ? moods : (sourceBook.moods || []);
            const searchGenres = genres.length > 0 ? genres : (sourceBook.genres || []);

            // Build query conditions
            const conditions = [];
            
            // Exclude the source book
            conditions.push({ field: 'id', operator: '!=', value: bookId });

            // Match by genres if available
            if (searchGenres.length > 0) {
                conditions.push({ 
                    field: 'genres', 
                    operator: 'array-contains-any', 
                    value: searchGenres 
                });
            }

            // Get potential matches
            const matches = await this.queryBooks({
                conditions,
                orderByField: 'reviewCount',
                limit: limit * 2 // Get extra to allow for mood filtering
            });

            // Score matches by mood overlap
            if (searchMoods.length > 0) {
                const scoredMatches = matches.map(book => {
                    const bookMoods = book.moods || [];
                    const moodOverlap = searchMoods.filter(mood => 
                        bookMoods.includes(mood)
                    ).length;
                    return {
                        ...book,
                        score: moodOverlap
                    };
                });

                // Sort by score and take top matches
                scoredMatches.sort((a, b) => b.score - a.score);
                return scoredMatches.slice(0, limit);
            }

            return matches.slice(0, limit);
        } catch (error) {
            throw this.handleError(error, 'Get Similar Books');
        }
    }
}

// Create singleton instance
const bookService = new BookService();
export default bookService;
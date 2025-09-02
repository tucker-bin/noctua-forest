// Reading List Service
import { db } from '../firebase-config.js';
import { 
    collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc,
    query, where, orderBy, serverTimestamp, arrayUnion, arrayRemove, limit 
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const LISTS_COLLECTION = 'readingLists';
const SHARES_COLLECTION = 'listShares';
const LIST_SAVES_COLLECTION = 'listSaves';
const LIST_ATTRIBUTIONS_COLLECTION = 'listAttributions';

/**
 * Create a new reading list
 * @param {string} userId - The user's ID
 * @param {string} name - List name (defaults to "Wish List")
 * @param {string} [description] - Optional list description
 * @returns {Promise<string>} The new list ID
 */
export async function createList(userId, name = "Wish List", description = "") {
    const list = {
        userId,
        name,
        description,
        books: [],
        stats: {
            languages: {},
            genres: {},
            authors: {}
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, LISTS_COLLECTION), list);
    return docRef.id;
}

/**
 * Get a user's reading lists
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of list objects
 */
export async function getUserLists(userId) {
    const q = query(
        collection(db, LISTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

/**
 * Get a single list by ID
 * @param {string} listId - The list ID
 * @returns {Promise<Object|null>} The list object or null if not found
 */
export async function getList(listId) {
    const docRef = doc(db, LISTS_COLLECTION, listId);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    return {
        id: snapshot.id,
        ...snapshot.data()
    };
}

/**
 * Update list details
 * @param {string} listId - The list ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateList(listId, updates) {
    const docRef = doc(db, LISTS_COLLECTION, listId);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
    });
}

/**
 * Delete a list
 * @param {string} listId - The list ID
 * @returns {Promise<void>}
 */
export async function deleteList(listId) {
    // Delete any shares first
    const sharesQuery = query(
        collection(db, SHARES_COLLECTION),
        where('listId', '==', listId)
    );
    const sharesDocs = await getDocs(sharesQuery);
    await Promise.all(sharesDocs.docs.map(doc => deleteDoc(doc.ref)));
    
    // Delete the list
    await deleteDoc(doc(db, LISTS_COLLECTION, listId));
}

/**
 * Add a book to a list
 * @param {string} listId - The list ID
 * @param {Object} book - The book to add
 * @returns {Promise<void>}
 */
export async function addBookToList(listId, book) {
    const docRef = doc(db, LISTS_COLLECTION, listId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) throw new Error('List not found');
    
    const data = snapshot.data();
    const books = data.books || [];
    const stats = data.stats || { languages: {}, genres: {}, authors: {} };
    
    // Update stats
    if (book.primaryLanguage) {
        stats.languages[book.primaryLanguage] = (stats.languages[book.primaryLanguage] || 0) + 1;
    }
    if (book.genre) {
        stats.genres[book.genre] = (stats.genres[book.genre] || 0) + 1;
    }
    if (book.author) {
        stats.authors[book.author] = (stats.authors[book.author] || 0) + 1;
    }
    
    // Add book with order
    const order = books.length;
    const bookEntry = {
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        addedAt: serverTimestamp(),
        order
    };
    
    await updateDoc(docRef, {
        books: arrayUnion(bookEntry),
        stats,
        updatedAt: serverTimestamp()
    });

    // Track save for global count (idempotent per list+book)
    const saveId = `${listId}_${book.id}`;
    await setDoc(doc(db, LIST_SAVES_COLLECTION, saveId), {
        listId,
        userId: data.userId,
        bookId: book.id,
        createdAt: serverTimestamp()
    }, { merge: true });

    // Track attribution for creator lists (idempotent)
    const userDoc = await getDoc(doc(db, 'users', data.userId));
    if (userDoc.exists() && userDoc.data().applicationStatus === 'approved') {
        const attributionId = `${listId}_${book.id}`;
        await setDoc(doc(db, LIST_ATTRIBUTIONS_COLLECTION, attributionId), {
            listId,
            creatorId: data.userId,
            bookId: book.id,
            createdAt: serverTimestamp()
        }, { merge: true });
    }
}

/**
 * Remove a book from a list
 * @param {string} listId - The list ID
 * @param {string} bookId - The book ID to remove
 * @returns {Promise<void>}
 */
export async function removeBookFromList(listId, bookId) {
    const docRef = doc(db, LISTS_COLLECTION, listId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) throw new Error('List not found');
    
    const data = snapshot.data();
    const books = data.books || [];
    const stats = data.stats || { languages: {}, genres: {}, authors: {} };
    
    // Find the book to remove
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    // Update stats
    if (book.primaryLanguage && stats.languages[book.primaryLanguage] > 0) {
        stats.languages[book.primaryLanguage]--;
    }
    if (book.genre && stats.genres[book.genre] > 0) {
        stats.genres[book.genre]--;
    }
    if (book.author && stats.authors[book.author] > 0) {
        stats.authors[book.author]--;
    }
    
    // Remove book and reorder remaining books
    const newBooks = books
        .filter(b => b.id !== bookId)
        .map((b, idx) => ({ ...b, order: idx }));
    
    await updateDoc(docRef, {
        books: newBooks,
        stats,
        updatedAt: serverTimestamp()
    });

    // Remove corresponding save record
    const saveId = `${listId}_${bookId}`;
    await deleteDoc(doc(db, LIST_SAVES_COLLECTION, saveId)).catch(()=>{});

    // Remove corresponding attribution record
    const attributionId = `${listId}_${bookId}`;
    await deleteDoc(doc(db, LIST_ATTRIBUTIONS_COLLECTION, attributionId)).catch(()=>{});
}

/**
 * Reorder books in a list
 * @param {string} listId - The list ID
 * @param {Array<{id: string, order: number}>} newOrder - New book order
 * @returns {Promise<void>}
 */
export async function reorderBooks(listId, newOrder) {
    const docRef = doc(db, LISTS_COLLECTION, listId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) throw new Error('List not found');
    
    const data = snapshot.data();
    const books = data.books || [];
    
    // Create order map
    const orderMap = new Map(newOrder.map(item => [item.id, item.order]));
    
    // Update book orders
    const newBooks = books.map(book => ({
        ...book,
        order: orderMap.get(book.id) ?? book.order
    })).sort((a, b) => a.order - b.order);
    
    await updateDoc(docRef, {
        books: newBooks,
        updatedAt: serverTimestamp()
    });
}

/**
 * Generate a shareable link for a list
 * @param {string} listId - The list ID
 * @param {string} creatorId - The creator's user ID
 * @returns {Promise<string>} The share ID
 */
export async function shareList(listId, creatorId) {
    // Check if share already exists
    const sharesQuery = query(
        collection(db, SHARES_COLLECTION),
        where('listId', '==', listId),
        limit(1)
    );
    const sharesDocs = await getDocs(sharesQuery);
    
    if (!sharesDocs.empty) {
        // Ensure creatorId is present
        const shareRef = sharesDocs.docs[0].ref;
        if (!sharesDocs.docs[0].data().creatorId) {
            await updateDoc(shareRef, { creatorId });
        }
        return sharesDocs.docs[0].id;
    }
    
    // Create new share
    const shareDoc = await addDoc(collection(db, SHARES_COLLECTION), {
        listId,
        creatorId,
        createdAt: serverTimestamp()
    });
    
    return shareDoc.id;
}

/**
 * Get a shared list by share ID
 * @param {string} shareId - The share ID
 * @returns {Promise<Object|null>} The list object or null if not found
 */
export async function getSharedList(shareId) {
    const shareDoc = await getDoc(doc(db, SHARES_COLLECTION, shareId));
    if (!shareDoc.exists()) return null;
    
    const shareData = shareDoc.data();
    const list = await getList(shareData.listId);
    if (!list) return null;

    return {
        ...list,
        creatorId: shareData.creatorId, // Pass creatorId along
    };
}

/**
 * Clone a shared list for another user
 * @param {string} shareId - The share ID
 * @param {string} userId - The user ID to clone for
 * @returns {Promise<string>} The new list ID
 */
export async function cloneList(shareId, userId) {
    const list = await getSharedList(shareId);
    if (!list) throw new Error('Shared list not found');
    
    const newList = {
        userId,
        name: `${list.name} (Clone)`,
        description: list.description,
        books: list.books,
        stats: list.stats,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, LISTS_COLLECTION), newList);
    return docRef.id;
}

/**
 * Get total number of lists (all users) that contain a given book
 * @param {string} bookId
 * @returns {Promise<number>}
 */
export async function getBookSaveCount(bookId) {
    const q = query(collection(db, LIST_SAVES_COLLECTION), where('bookId', '==', bookId));
    const snap = await getDocs(q);
    return snap.size;
}

/**
 * Get total number of active creator lists that contain a given book
 * @param {string} bookId
 * @returns {Promise<number>}
 */
export async function getActiveListsCount(bookId) {
    const q = query(collection(db, LIST_ATTRIBUTIONS_COLLECTION), where('bookId', '==', bookId));
    const snap = await getDocs(q);
    return snap.size;
}

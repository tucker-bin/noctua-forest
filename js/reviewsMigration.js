// Reviews Migration Service
import { db } from './firebase-config.js';
import { 
    collection, getDocs, addDoc, deleteDoc,
    query, where, orderBy, serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { getUserForestName } from './forestNameFirestore.js';

const COMMENTS_COLLECTION = 'comments';
const REVIEWS_COLLECTION = 'reviews';

/**
 * Migrate a single comment to a review
 * @param {Object} comment - The comment document data
 * @param {string} commentId - The comment document ID
 * @returns {Promise<string>} The new review ID
 */
async function migrateComment(comment, commentId) {
    // Get the user's forest name
    let forestName = 'Anonymous Forest Dweller';
    try {
        if (comment.authorId) {
            const userForestName = await getUserForestName(comment.authorId);
            if (userForestName) {
                forestName = userForestName;
            }
        }
    } catch (err) {
        console.warn('Failed to get forest name for user:', err);
    }

    // Create the review document
    const reviewData = {
        bookId: comment.bookId,
        text: comment.text,
        authorId: comment.authorId,
        authorForestName: forestName,
        createdAt: comment.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        rating: null, // Placeholder for future rating feature
        isLegacy: true, // Mark as migrated from comments
        originalCommentId: commentId
    };

    const reviewRef = await addDoc(collection(db, REVIEWS_COLLECTION), reviewData);
    return reviewRef.id;
}

/**
 * Migrate all comments to reviews
 * @returns {Promise<{success: number, failed: number}>} Migration statistics
 */
export async function migrateAllComments() {
    const stats = { success: 0, failed: 0 };
    
    try {
        // Get all comments ordered by creation date
        const commentsQuery = query(
            collection(db, COMMENTS_COLLECTION),
            orderBy('createdAt', 'asc')
        );
        
        const snapshot = await getDocs(commentsQuery);
        
        // Process each comment
        for (const doc of snapshot.docs) {
            try {
                await migrateComment(doc.data(), doc.id);
                await deleteDoc(doc.ref); // Remove the original comment
                stats.success++;
            } catch (err) {
                console.error('Failed to migrate comment:', doc.id, err);
                stats.failed++;
            }
        }
    } catch (err) {
        console.error('Migration failed:', err);
        throw err;
    }
    
    return stats;
}

/**
 * Check if comments collection is empty
 * @returns {Promise<boolean>} True if no comments exist
 */
export async function isCommentsEmpty() {
    const snapshot = await getDocs(collection(db, COMMENTS_COLLECTION));
    return snapshot.empty;
}

/**
 * Get review with forest name
 * @param {string} reviewId - The review document ID
 * @returns {Promise<Object|null>} The review data or null if not found
 */
export async function getReviewWithForestName(reviewId) {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    const reviewSnap = await getDoc(reviewRef);
    
    if (!reviewSnap.exists()) return null;
    
    const review = reviewSnap.data();
    
    // Update forest name if needed
    if (review.authorId && !review.authorForestName) {
        try {
            const forestName = await getUserForestName(review.authorId);
            if (forestName) {
                review.authorForestName = forestName;
                await updateDoc(reviewRef, { authorForestName: forestName });
            }
        } catch (err) {
            console.warn('Failed to update forest name for review:', err);
        }
    }
    
    return review;
}

/**
 * Update review text
 * @param {string} reviewId - The review document ID
 * @param {string} newText - The new review text
 * @returns {Promise<void>}
 */
export async function updateReviewText(reviewId, newText) {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    await updateDoc(reviewRef, {
        text: newText,
        updatedAt: serverTimestamp()
    });
}

/**
 * Delete a review
 * @param {string} reviewId - The review document ID
 * @returns {Promise<void>}
 */
export async function deleteReview(reviewId) {
    await deleteDoc(doc(db, REVIEWS_COLLECTION, reviewId));
}

/**
 * Add a new review
 * @param {Object} reviewData - The review data
 * @returns {Promise<string>} The new review ID
 */
export async function addReview(reviewData) {
    // Get the user's forest name
    let forestName = 'Anonymous Forest Dweller';
    try {
        if (reviewData.authorId) {
            const userForestName = await getUserForestName(reviewData.authorId);
            if (userForestName) {
                forestName = userForestName;
            }
        }
    } catch (err) {
        console.warn('Failed to get forest name for user:', err);
    }

    const fullReviewData = {
        ...reviewData,
        authorForestName: forestName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    const reviewRef = await addDoc(collection(db, REVIEWS_COLLECTION), fullReviewData);
    return reviewRef.id;
}

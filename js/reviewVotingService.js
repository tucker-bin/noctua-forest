// Review Voting Service
import { db } from '../firebase-config.js';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const HELPFUL_VOTES_COLLECTION = 'helpful_votes';
const UNHELPFUL_VOTES_COLLECTION = 'unhelpful_votes';

/**
 * Get a user's vote on a review
 */
export async function getUserVote(reviewId, userId) {
    try {
        // Check helpful vote
        const helpfulRef = doc(db, HELPFUL_VOTES_COLLECTION, `${reviewId}_${userId}`);
        const helpfulDoc = await getDoc(helpfulRef);
        if (helpfulDoc.exists()) {
            return 'helpful';
        }

        // Check unhelpful vote
        const unhelpfulRef = doc(db, UNHELPFUL_VOTES_COLLECTION, `${reviewId}_${userId}`);
        const unhelpfulDoc = await getDoc(unhelpfulRef);
        if (unhelpfulDoc.exists()) {
            return 'unhelpful';
        }

        return null;
    } catch (err) {
        console.error('Error getting user vote:', err);
        return null;
    }
}

/**
 * Get vote counts for a review
 */
export async function getVoteCounts(reviewId) {
    try {
        // Get helpful votes
        const helpfulQuery = query(
            collection(db, HELPFUL_VOTES_COLLECTION),
            where('reviewId', '==', reviewId)
        );
        const helpfulSnapshot = await getDocs(helpfulQuery);

        // Get unhelpful votes
        const unhelpfulQuery = query(
            collection(db, UNHELPFUL_VOTES_COLLECTION),
            where('reviewId', '==', reviewId)
        );
        const unhelpfulSnapshot = await getDocs(unhelpfulQuery);

        return {
            helpful: helpfulSnapshot.size,
            unhelpful: unhelpfulSnapshot.size
        };
    } catch (err) {
        console.error('Error getting vote counts:', err);
        return { helpful: 0, unhelpful: 0 };
    }
}

/**
 * Vote on a review
 */
export async function voteOnReview(reviewId, userId, vote) {
    try {
        const currentVote = await getUserVote(reviewId, userId);
        
        // Remove current vote if any
        if (currentVote === 'helpful') {
            await deleteDoc(doc(db, HELPFUL_VOTES_COLLECTION, `${reviewId}_${userId}`));
        } else if (currentVote === 'unhelpful') {
            await deleteDoc(doc(db, UNHELPFUL_VOTES_COLLECTION, `${reviewId}_${userId}`));
        }

        // If new vote is different from current vote, add it
        if (vote && vote !== currentVote) {
            const collection = vote === 'helpful' ? HELPFUL_VOTES_COLLECTION : UNHELPFUL_VOTES_COLLECTION;
            await setDoc(doc(db, collection, `${reviewId}_${userId}`), {
                reviewId,
                userId,
                createdAt: new Date()
            });
        }

        // Return new vote counts
        return await getVoteCounts(reviewId);
    } catch (err) {
        console.error('Error voting on review:', err);
        throw err;
    }
}

/**
 * Format vote count for display
 */
export function formatVoteCount(count) {
    if (count === 0) return '0';
    if (count < 1000) return count.toString();
    if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
    return `${Math.floor(count / 1000)}k`;
}

// Content Moderation Service - Handles review validation and AI detection
import { db } from '../firebase-config.js';
import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy, limit, serverTimestamp, deleteDoc, increment } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const REVIEWS_COLLECTION = 'reviews';
const FLAGGED_CONTENT_COLLECTION = 'flagged_content';
const USER_HISTORY_COLLECTION = 'user_history';

// Suspicious patterns that might indicate AI-generated content
const AI_PATTERNS = [
    /\b(in\sconclusion|to\ssummarize|all\sin\sall)\b/i,  // Common AI transitions
    /\b(this\s(book|novel|work)\s(explores|examines|discusses|delves\sinto))\b/i,  // Academic-style analysis
    /\b(through\sthe\slens\sof|in\sthe\scontext\sof)\b/i,  // Academic phrases
    /\b(the\sauthor\sseeks\sto|the\snarrative\sserves\sto)\b/i,  // Analytical distance
    /\b(masterfully\scrafted|beautifully\swoven|expertly\srendered)\b/i,  // Generic praise
    /\b(while\sat\sthe\ssame\stime|on\sthe\sother\shand)\b/i,  // Common AI connectors
];

// Patterns that indicate authentic personal experience
const AUTHENTICITY_MARKERS = [
    /\b(reminded\sme\sof|made\sme\sfeel|i\sfelt|i\sthought)\b/i,  // Personal reactions
    /\b(couldn't\sput\sit\sdown|stayed\sup\slate|read\sit\sin\sone\ssitting)\b/i,  // Reading experience
    /\b(my\sfavorite\spart|what\si\sloved|what\sbugged\sme)\b/i,  // Personal opinions
    /\b(personally|honestly|actually|literally)\b/i,  // Personal markers
];

/**
 * Check for signs of AI-generated content
 */
function detectAIPatterns(text) {
    const aiMatches = AI_PATTERNS.filter(pattern => pattern.test(text));
    const authenticityMatches = AUTHENTICITY_MARKERS.filter(pattern => pattern.test(text));
    
    return {
        aiScore: aiMatches.length / AI_PATTERNS.length,
        authenticityScore: authenticityMatches.length / AUTHENTICITY_MARKERS.length,
        suspiciousPatterns: aiMatches.map(p => p.source)
    };
}

/**
 * Check for review spinning/duplication
 */
async function checkForDuplication(userId, text) {
    try {
        // Get user's recent reviews
        const userReviews = query(
            collection(db, REVIEWS_COLLECTION),
            where('authorId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(10)
        );
        const reviewsSnap = await getDocs(userReviews);

        // Calculate similarity with recent reviews
        const similarities = [];
        reviewsSnap.forEach(doc => {
            const review = doc.data();
            const similarity = calculateTextSimilarity(text, review.text);
            if (similarity > 0.7) { // 70% similarity threshold
                similarities.push({
                    reviewId: doc.id,
                    similarity
                });
            }
        });

        return similarities;
    } catch (err) {
        console.error('Error checking for duplication:', err);
        return [];
    }
}

/**
 * Calculate text similarity using Levenshtein distance
 */
function calculateTextSimilarity(text1, text2) {
    const longer = text1.length > text2.length ? text1 : text2;
    const shorter = text1.length > text2.length ? text2 : text1;
    
    if (shorter.length === 0) return 0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = str1[i-1] === str2[j-1] 
                ? dp[i-1][j-1]
                : Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]) + 1;
        }
    }

    return dp[m][n];
}

/**
 * Check user's review history for suspicious patterns
 */
async function checkUserHistory(userId) {
    try {
        // Get user's review stats
        const historyDoc = await getDoc(doc(db, USER_HISTORY_COLLECTION, userId));
        const history = historyDoc.exists() ? historyDoc.data() : {
            reviewCount: 0,
            averageLength: 0,
            reviewTimes: [],
            flaggedCount: 0
        };

        // Get recent review timestamps
        const recentReviews = query(
            collection(db, REVIEWS_COLLECTION),
            where('authorId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
        const reviewsSnap = await getDocs(recentReviews);
        
        // Calculate time between reviews
        const timestamps = [];
        reviewsSnap.forEach(doc => {
            timestamps.push(doc.data().createdAt.toDate());
        });

        // Check for suspiciously fast reviews
        let suspiciousIntervals = 0;
        for (let i = 1; i < timestamps.length; i++) {
            const interval = (timestamps[i-1] - timestamps[i]) / 1000; // seconds
            if (interval < 300) { // Less than 5 minutes between reviews
                suspiciousIntervals++;
            }
        }

        return {
            history,
            suspiciousIntervals,
            rapidReviewRate: suspiciousIntervals / (timestamps.length - 1)
        };
    } catch (err) {
        console.error('Error checking user history:', err);
        return null;
    }
}

/**
 * Validate a review before submission
 */
export async function validateReview(userId, reviewData) {
    try {
        // Check for minimum length
        if (reviewData.text.length < 100) {
            return {
                valid: false,
                error: 'Review must be at least 100 characters long'
            };
        }

        // Check for AI patterns
        const aiCheck = detectAIPatterns(reviewData.text);
        if (aiCheck.aiScore > 0.5 && aiCheck.authenticityScore < 0.2) {
            return {
                valid: false,
                error: 'Review appears to be AI-generated',
                details: aiCheck
            };
        }

        // Check for duplicates
        const duplicates = await checkForDuplication(userId, reviewData.text);
        if (duplicates.length > 0) {
            return {
                valid: false,
                error: 'Review is too similar to your previous reviews',
                details: duplicates
            };
        }

        // Check user history
        const history = await checkUserHistory(userId);
        if (history?.rapidReviewRate > 0.5) {
            return {
                valid: false,
                error: 'You are submitting reviews too quickly',
                details: history
            };
        }

        return { valid: true };
    } catch (err) {
        console.error('Error validating review:', err);
        throw err;
    }
}

/**
 * Flag suspicious content for moderation
 */
export async function flagContent(reviewId, reason, reporterId = null) {
    try {
        const reviewDoc = await getDoc(doc(db, REVIEWS_COLLECTION, reviewId));
        if (!reviewDoc.exists()) {
            throw new Error('Review not found');
        }

        const review = reviewDoc.data();
        const flagDoc = doc(collection(db, FLAGGED_CONTENT_COLLECTION));
        
        await setDoc(flagDoc, {
            id: flagDoc.id,
            reviewId,
            authorId: review.authorId,
            reason,
            reporterId,
            reviewText: review.text,
            aiCheck: detectAIPatterns(review.text),
            status: 'pending',
            createdAt: serverTimestamp()
        });

        // Update user history
        const historyRef = doc(db, USER_HISTORY_COLLECTION, review.authorId);
        await setDoc(historyRef, {
            flaggedCount: increment(1),
            lastFlaggedAt: serverTimestamp()
        }, { merge: true });

        return flagDoc.id;
    } catch (err) {
        console.error('Error flagging content:', err);
        throw err;
    }
}

/**
 * Get moderation queue
 */
export async function getModerationQueue(limit = 20) {
    try {
        const flaggedQuery = query(
            collection(db, FLAGGED_CONTENT_COLLECTION),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc'),
            limit(limit)
        );
        
        const flaggedSnap = await getDocs(flaggedQuery);
        const items = [];
        
        flaggedSnap.forEach(doc => {
            items.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return items;
    } catch (err) {
        console.error('Error getting moderation queue:', err);
        return [];
    }
}

/**
 * Take moderation action
 */
export async function moderateContent(flagId, action, moderatorNotes = '') {
    try {
        const flagDoc = await getDoc(doc(db, FLAGGED_CONTENT_COLLECTION, flagId));
        if (!flagDoc.exists()) {
            throw new Error('Flagged content not found');
        }

        const flag = flagDoc.data();
        
        // Update flag status
        await setDoc(doc(db, FLAGGED_CONTENT_COLLECTION, flagId), {
            status: action,
            moderatorNotes,
            moderatedAt: serverTimestamp()
        }, { merge: true });

        if (action === 'remove') {
            // Remove the review
            await deleteDoc(doc(db, REVIEWS_COLLECTION, flag.reviewId));
            
            // Update user history
            const historyRef = doc(db, USER_HISTORY_COLLECTION, flag.authorId);
            await setDoc(historyRef, {
                removedCount: increment(1),
                lastRemovalAt: serverTimestamp()
            }, { merge: true });
        }

        return true;
    } catch (err) {
        console.error('Error moderating content:', err);
        throw err;
    }
}

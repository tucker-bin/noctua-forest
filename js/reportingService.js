// Reporting Service - Handles review reports and moderation
import { db } from '../firebase-config.js';
import { doc, getDoc, addDoc, collection, query, where, orderBy, limit, serverTimestamp, getDocs, setDoc, deleteDoc, increment } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const REPORTS_COLLECTION = 'reports';
const REVIEWS_COLLECTION = 'reviews';
const USERS_COLLECTION = 'users';

/**
 * Submit a report for a review
 */
export async function reportReview(reviewId, reason, reporterId, details = '') {
    try {
        // Get review data
        const reviewDoc = await getDoc(doc(db, REVIEWS_COLLECTION, reviewId));
        if (!reviewDoc.exists()) {
            throw new Error('Review not found');
        }

        const review = reviewDoc.data();
        
        // Create report
        const reportRef = await addDoc(collection(db, REPORTS_COLLECTION), {
            reviewId,
            reviewText: review.text,
            reviewAuthorId: review.authorId,
            reason,
            details,
            reporterId,
            status: 'pending',
            createdAt: serverTimestamp()
        });

        // Check for multiple reports
        const existingReports = query(
            collection(db, REPORTS_COLLECTION),
            where('reviewId', '==', reviewId),
            where('status', '==', 'pending')
        );
        const reportsSnap = await getDocs(existingReports);

        // If multiple reports, flag for priority review
        if (reportsSnap.size >= 3) {
            await setDoc(doc(db, REVIEWS_COLLECTION, reviewId), {
                flaggedForReview: true,
                flagReason: 'Multiple reports',
                lastFlaggedAt: serverTimestamp()
            }, { merge: true });
        }

        return reportRef.id;
    } catch (err) {
        console.error('Error submitting report:', err);
        throw err;
    }
}

/**
 * Get reports for moderation
 */
export async function getReportsForModeration(limit = 20) {
    try {
        const reportsQuery = query(
            collection(db, REPORTS_COLLECTION),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc'),
            limit(limit)
        );

        const reportsSnap = await getDocs(reportsQuery);
        const reports = [];

        for (const doc of reportsSnap.docs) {
            const report = doc.data();
            
            // Get reporter name
            if (report.reporterId) {
                const reporterDoc = await getDoc(doc(db, USERS_COLLECTION, report.reporterId));
                if (reporterDoc.exists()) {
                    report.reporterName = reporterDoc.data().forestName || 'Anonymous Night Owl';
                }
            }

            // Get review author name
            if (report.reviewAuthorId) {
                const authorDoc = await getDoc(doc(db, USERS_COLLECTION, report.reviewAuthorId));
                if (authorDoc.exists()) {
                    report.authorName = authorDoc.data().forestName || 'Anonymous Night Owl';
                }
            }

            reports.push({
                id: doc.id,
                ...report
            });
        }

        return reports;
    } catch (err) {
        console.error('Error getting reports:', err);
        return [];
    }
}

/**
 * Take action on a report
 */
export async function moderateReport(reportId, action, moderatorNotes = '') {
    try {
        const reportDoc = await getDoc(doc(db, REPORTS_COLLECTION, reportId));
        if (!reportDoc.exists()) {
            throw new Error('Report not found');
        }

        const report = reportDoc.data();
        
        // Update report status
        await setDoc(doc(db, REPORTS_COLLECTION, reportId), {
            status: action,
            moderatorNotes,
            moderatedAt: serverTimestamp()
        }, { merge: true });

        if (action === 'remove_review') {
            // Remove the review
            await deleteDoc(doc(db, REVIEWS_COLLECTION, report.reviewId));

            // Update user's review count and flag history
            await setDoc(doc(db, USERS_COLLECTION, report.reviewAuthorId), {
                removedReviewCount: increment(1),
                lastReviewRemovalAt: serverTimestamp()
            }, { merge: true });

            // If AI-generated, add to user's warning count
            if (report.reason === 'ai_generated') {
                await setDoc(doc(db, USERS_COLLECTION, report.reviewAuthorId), {
                    aiWarningCount: increment(1),
                    lastAiWarningAt: serverTimestamp()
                }, { merge: true });
            }
        }

        return true;
    } catch (err) {
        console.error('Error moderating report:', err);
        throw err;
    }
}

/**
 * Get user's report history
 */
export async function getUserReportHistory(userId) {
    try {
        const reportsQuery = query(
            collection(db, REPORTS_COLLECTION),
            where('reviewAuthorId', '==', userId),
            where('status', 'in', ['remove_review', 'warning']),
            orderBy('createdAt', 'desc')
        );

        const reportsSnap = await getDocs(reportsQuery);
        return reportsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (err) {
        console.error('Error getting user report history:', err);
        return [];
    }
}

/**
 * Check if user should be suspended
 */
export async function checkUserViolations(userId) {
    try {
        const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
        if (!userDoc.exists()) return false;

        const userData = userDoc.data();
        
        // Check for multiple AI warnings
        if (userData.aiWarningCount >= 3) {
            await setDoc(doc(db, USERS_COLLECTION, userId), {
                status: 'suspended',
                suspensionReason: 'Multiple AI-generated content violations',
                suspendedAt: serverTimestamp()
            }, { merge: true });
            return true;
        }

        // Check for rapid review removals
        if (userData.removedReviewCount >= 5) {
            const recentRemovals = query(
                collection(db, REPORTS_COLLECTION),
                where('reviewAuthorId', '==', userId),
                where('status', '==', 'remove_review'),
                where('createdAt', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // Last 30 days
                orderBy('createdAt', 'desc')
            );
            const removalsSnap = await getDocs(recentRemovals);
            
            if (removalsSnap.size >= 5) {
                await setDoc(doc(db, USERS_COLLECTION, userId), {
                    status: 'suspended',
                    suspensionReason: 'Multiple content policy violations',
                    suspendedAt: serverTimestamp()
                }, { merge: true });
                return true;
            }
        }

        return false;
    } catch (err) {
        console.error('Error checking user violations:', err);
        return false;
    }
}

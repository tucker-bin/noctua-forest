// Review Service
import { BaseService } from './BaseService.js';
import { serverTimestamp, increment, addDoc, updateDoc, doc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { generateRandomForestName } from '../randomForestNameService.js';

class ReviewService extends BaseService {
    constructor() {
        super();
        this.REVIEWS_COLLECTION = 'reviews';
        this.SUBMISSIONS_COLLECTION = 'submissions';
    }

    async getReview(reviewId) {
        return await this.getDocument(this.REVIEWS_COLLECTION, reviewId);
    }

    async getReviewsForBook(bookId, limit = 20) {
        const conditions = [
            { field: 'bookId', operator: '==', value: bookId },
            { field: 'status', operator: '==', value: 'published' }
        ];
        return await this.queryCollection(this.REVIEWS_COLLECTION, conditions, 'createdAt', limit);
    }

    async getRecentReviews(userId, limit = 5) {
        const conditions = [
            { field: 'userId', operator: '==', value: userId },
            { field: 'status', operator: '==', value: 'published' }
        ];
        return await this.queryCollection(this.REVIEWS_COLLECTION, conditions, 'createdAt', limit);
    }

    async submitReview(reviewData) {
        try {
            this.validateRequired(reviewData, ['bookId', 'text', 'userId']);

            // Generate random Forest name for this review
            const forestName = generateRandomForestName();

            const review = {
                bookId: reviewData.bookId,
                text: reviewData.text,
                userId: reviewData.userId,
                authorForestName: forestName,
                moods: reviewData.moods || [],
                contentWarnings: reviewData.contentWarnings || [],
                copyFormat: reviewData.copyFormat || null,
                status: 'published',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                // Store verification flags but don't block submission
                verifiedRead: !!reviewData.hasReadBook,
                verifiedAuthentic: !!reviewData.authenticReview,
                verifiedNoAI: !!reviewData.noAI
            };

            try {
                // Try direct review creation first
                const docRef = await addDoc(collection(this.db, this.REVIEWS_COLLECTION), review);
                
                // Update book review count
                await updateDoc(doc(this.db, 'books', reviewData.bookId), {
                    reviewCount: increment(1),
                    updatedAt: serverTimestamp()
                });

                return { id: docRef.id, ...review };
            } catch (err) {
                // Fallback to submissions queue if direct write fails
                const sub = {
                    type: 'review',
                    userId: reviewData.userId,
                    bookId: reviewData.bookId,
                    reviewText: reviewData.text,
                    payload: review,
                    status: 'pending',
                    createdAt: serverTimestamp()
                };
                const subRef = await addDoc(collection(this.db, this.SUBMISSIONS_COLLECTION), sub);
                return { id: subRef.id, ...review, status: 'pending' };
            }
        } catch (error) {
            throw this.handleError(error, 'Submit Review');
        }
    }

    async getBookMoods(bookId) {
        try {
            const reviews = await this.getReviewsForBook(bookId);
            const moodCounts = {};
            let totalReviews = 0;

            reviews.forEach(review => {
                if (review.moods && Array.isArray(review.moods)) {
                    totalReviews++;
                    review.moods.forEach(mood => {
                        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
                    });
                }
            });

            const moodStats = Object.entries(moodCounts)
                .map(([mood, count]) => ({
                    mood,
                    count,
                    percentage: Math.round((count / totalReviews) * 100)
                }))
                .sort((a, b) => b.count - a.count);

            return {
                totalReviews,
                moods: moodStats
            };
        } catch (error) {
            throw this.handleError(error, 'Get Book Moods');
        }
    }

    async getContentWarnings(bookId) {
        try {
            const reviews = await this.getReviewsForBook(bookId);
            const warningCounts = {};
            let totalReviews = 0;

            reviews.forEach(review => {
                if (review.contentWarnings && Array.isArray(review.contentWarnings)) {
                    totalReviews++;
                    review.contentWarnings.forEach(warning => {
                        warningCounts[warning] = (warningCounts[warning] || 0) + 1;
                    });
                }
            });

            const warningStats = Object.entries(warningCounts)
                .map(([warning, count]) => ({
                    warning,
                    count,
                    percentage: Math.round((count / totalReviews) * 100)
                }))
                .sort((a, b) => b.count - a.count);

            return {
                totalReviews,
                warnings: warningStats
            };
        } catch (error) {
            throw this.handleError(error, 'Get Content Warnings');
        }
    }
}

// Create singleton instance
const reviewService = new ReviewService();
export default reviewService;

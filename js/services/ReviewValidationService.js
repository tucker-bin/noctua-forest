// Review Validation Service
import { BaseService } from './BaseService.js';

class ReviewValidationService extends BaseService {
    constructor() {
        super();
        this.REVIEWS_COLLECTION = 'reviews';
    }

    validateReview(reviewData) {
        const validation = {
            isValid: true,
            warnings: [],
            requiresModeration: false
        };

        // Basic content validation
        if (!reviewData.text || reviewData.text.trim().length === 0) {
            validation.isValid = false;
            validation.warnings.push('Review text is required');
        }

        if (reviewData.text && reviewData.text.length < 10) {
            validation.warnings.push('Consider adding more detail to your review');
        }

        // Check for potential spam/abuse indicators
        if (this.containsSpamIndicators(reviewData.text)) {
            validation.requiresModeration = true;
            validation.warnings.push('Review contains potential spam content');
        }

        // Check for potentially harmful content
        if (this.containsHarmfulContent(reviewData.text)) {
            validation.requiresModeration = true;
            validation.warnings.push('Review may contain harmful content');
        }

        return validation;
    }

    containsSpamIndicators(text) {
        const spamPatterns = [
            /\b(buy|sell|discount|offer)\b.*\b(now|today|click|visit)\b/i,
            /https?:\/\/[^\s]+/g,
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/
        ];

        return spamPatterns.some(pattern => pattern.test(text));
    }

    containsHarmfulContent(text) {
        // Basic check for obvious harmful content
        // This should be expanded based on your content policy
        const harmfulPatterns = [
            /\b(hate|kill|death threat|bomb|attack)\b/i
        ];

        return harmfulPatterns.some(pattern => pattern.test(text));
    }

    async checkForDuplication(reviewData) {
        try {
            // Check for exact duplicates from same user
            const conditions = [
                { field: 'userId', operator: '==', value: reviewData.userId },
                { field: 'bookId', operator: '==', value: reviewData.bookId }
            ];
            
            const existingReviews = await this.queryCollection(this.REVIEWS_COLLECTION, conditions);
            
            return {
                isDuplicate: existingReviews.length > 0,
                existingReview: existingReviews[0] || null
            };
        } catch (error) {
            console.warn('Duplication check failed:', error);
            // Don't block submission on check failure
            return {
                isDuplicate: false,
                existingReview: null
            };
        }
    }
}

// Create singleton instance
const reviewValidationService = new ReviewValidationService();
export default reviewValidationService;

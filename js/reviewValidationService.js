/**
 * Review Validation Service
 * Implements AI detection, pattern analysis, and content quality checks
 * to maintain the integrity of our recommendation engine
 */

// AI Detection Patterns
const AI_PATTERNS = {
  // Generic AI review phrases
  genericPhrases: [
    'this book is a must-read',
    'highly recommend',
    'captivating read',
    'beautifully written',
    'thought-provoking',
    'engaging narrative',
    'well-developed characters',
    'masterful storytelling',
    'compelling plot',
    'emotional journey',
    'page-turner',
    'cannot put down',
    'excellent book',
    'wonderful story',
    'amazing read'
  ],
  
  // Overly formal language patterns
  formalPatterns: [
    /the author masterfully/i,
    /this literary work/i,
    /the narrative structure/i,
    /the character development/i,
    /the thematic elements/i,
    /the prose is/i,
    /the plot unfolds/i,
    /the reader will find/i
  ],
  
  // Repetitive sentence structures
  repetitiveStructures: [
    /^This book is .*$/i,
    /^I would recommend .*$/i,
    /^The author .*$/i,
    /^If you like .*$/i
  ],
  
  // Suspicious timing patterns (reviews submitted too quickly)
  timingThresholds: {
    minWordsPerSecond: 0.5, // Minimum words per second for human writing
    maxReviewLength: 1000, // Maximum reasonable review length
    suspiciousSpeed: 2.0 // Words per second that's suspicious
  }
};

// Content Quality Patterns
const QUALITY_PATTERNS = {
  // Minimum requirements
  minLength: 20,
  maxLength: 1000,
  
  // Suspicious patterns
  suspiciousPatterns: [
    /^[A-Z\s]+$/, // ALL CAPS
    /^[a-z\s]+$/, // all lowercase
    /[A-Z]{3,}/, // Multiple consecutive caps
    /\?{3,}/, // Multiple question marks
    /!{3,}/, // Multiple exclamation marks
    /\.{3,}/, // Multiple periods
    /[^\w\s.,!?-]/g // Too many special characters
  ],
  
  // Required elements for quality reviews
  requiredElements: [
    'personal experience',
    'specific details',
    'genuine opinion'
  ]
};

/**
 * Analyze review text for AI-generated content
 * @param {string} reviewText - The review text to analyze
 * @param {Object} metadata - Additional metadata (timing, user history, etc.)
 * @returns {Object} Analysis results with confidence scores
 */
export function analyzeReviewForAI(reviewText, metadata = {}) {
  const analysis = {
    isLikelyAI: false,
    confidence: 0,
    reasons: [],
    riskFactors: []
  };
  
  if (!reviewText || typeof reviewText !== 'string') {
    analysis.reasons.push('Invalid review text');
    analysis.isLikelyAI = true;
    analysis.confidence = 1.0;
    return analysis;
  }
  
  const text = reviewText.toLowerCase().trim();
  const words = text.split(/\s+/);
  const wordCount = words.length;
  
  // Check for generic AI phrases
  let genericPhraseCount = 0;
  AI_PATTERNS.genericPhrases.forEach(phrase => {
    if (text.includes(phrase.toLowerCase())) {
      genericPhraseCount++;
    }
  });
  
  if (genericPhraseCount > 0) {
    const genericRatio = genericPhraseCount / wordCount;
    if (genericRatio > 0.1) { // More than 10% generic phrases
      analysis.reasons.push(`High ratio of generic phrases (${genericRatio.toFixed(2)})`);
      analysis.riskFactors.push('generic_phrases');
    }
  }
  
  // Check for overly formal language
  let formalPatternCount = 0;
  AI_PATTERNS.formalPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      formalPatternCount++;
    }
  });
  
  if (formalPatternCount > 0) {
    analysis.reasons.push(`Overly formal language patterns detected (${formalPatternCount})`);
    analysis.riskFactors.push('formal_language');
  }
  
  // Check for repetitive sentence structures
  let repetitiveCount = 0;
  AI_PATTERNS.repetitiveStructures.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      repetitiveCount += matches.length;
    }
  });
  
  if (repetitiveCount > 2) {
    analysis.reasons.push(`Repetitive sentence structures detected (${repetitiveCount})`);
    analysis.riskFactors.push('repetitive_structures');
  }
  
  // Check content length and quality
  if (wordCount < QUALITY_PATTERNS.minLength) {
    analysis.reasons.push(`Review too short (${wordCount} words, minimum ${QUALITY_PATTERNS.minLength})`);
    analysis.riskFactors.push('too_short');
  }
  
  if (wordCount > QUALITY_PATTERNS.maxLength) {
    analysis.reasons.push(`Review suspiciously long (${wordCount} words, maximum ${QUALITY_PATTERNS.maxLength})`);
    analysis.riskFactors.push('too_long');
  }
  
  // Check for suspicious text patterns
  let suspiciousPatternCount = 0;
  QUALITY_PATTERNS.suspiciousPatterns.forEach(pattern => {
    if (pattern.test(reviewText)) {
      suspiciousPatternCount++;
    }
  });
  
  if (suspiciousPatternCount > 0) {
    analysis.reasons.push(`Suspicious text patterns detected (${suspiciousPatternCount})`);
    analysis.riskFactors.push('suspicious_patterns');
  }
  
  // Calculate confidence score based on risk factors
  const riskScore = analysis.riskFactors.length * 0.2;
  analysis.confidence = Math.min(riskScore, 1.0);
  analysis.isLikelyAI = analysis.confidence > 0.6;
  
  return analysis;
}

/**
 * Analyze user behavior patterns for suspicious activity
 * @param {Object} userHistory - User's review and activity history
 * @returns {Object} Behavior analysis results
 */
export function analyzeUserBehavior(userHistory) {
  const analysis = {
    isSuspicious: false,
    confidence: 0,
    reasons: [],
    riskFactors: []
  };
  
  if (!userHistory || !userHistory.reviews) {
    return analysis;
  }
  
  const { reviews, accountAge, reviewCount, lastReviewTime } = userHistory;
  
  // Check for rapid-fire reviews
  if (reviews && reviews.length > 1) {
    const timeBetweenReviews = reviews.map((review, index) => {
      if (index === 0) return null;
      return review.createdAt - reviews[index - 1].createdAt;
    }).filter(time => time !== null);
    
    const suspiciouslyFast = timeBetweenReviews.filter(time => 
      time < (5 * 60 * 1000) // Less than 5 minutes between reviews
    );
    
    if (suspiciouslyFast.length > 0) {
      analysis.reasons.push(`Rapid-fire reviews detected (${suspiciouslyFast.length} reviews in quick succession)`);
      analysis.riskFactors.push('rapid_reviews');
    }
  }
  
  // Check for new account with many reviews
  if (accountAge && reviewCount) {
    const daysSinceCreation = (Date.now() - accountAge) / (1000 * 60 * 60 * 24);
    const reviewsPerDay = reviewCount / Math.max(daysSinceCreation, 1);
    
    if (reviewsPerDay > 3) { // More than 3 reviews per day
      analysis.reasons.push(`High review frequency for new account (${reviewsPerDay.toFixed(1)} reviews/day)`);
      analysis.riskFactors.push('high_frequency_new_account');
    }
  }
  
  // Check for consistent review timing patterns
  if (reviews && reviews.length > 5) {
    const reviewHours = reviews.map(review => new Date(review.createdAt).getHours());
    const hourCounts = {};
    reviewHours.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const maxHourCount = Math.max(...Object.values(hourCounts));
    if (maxHourCount > reviews.length * 0.7) { // 70% of reviews at same hour
      analysis.reasons.push(`Suspicious timing pattern: ${maxHourCount} reviews at the same hour`);
      analysis.riskFactors.push('timing_patterns');
    }
  }
  
  // Calculate confidence score
  const riskScore = analysis.riskFactors.length * 0.25;
  analysis.confidence = Math.min(riskScore, 1.0);
  analysis.isSuspicious = analysis.confidence > 0.5;
  
  return analysis;
}

/**
 * Comprehensive review validation combining all checks
 * @param {Object} reviewData - The review data to validate
 * @param {Object} userHistory - User's activity history
 * @returns {Object} Comprehensive validation results
 */
export function validateReview(reviewData, userHistory = {}) {
  const validation = {
    isValid: true,
    requiresModeration: false,
    riskLevel: 'low',
    issues: [],
    aiAnalysis: null,
    behaviorAnalysis: null
  };
  
  // Basic validation
  if (!reviewData.text || reviewData.text.trim().length === 0) {
    validation.isValid = false;
    validation.issues.push('Review text is required');
  }
  
  if (!reviewData.hasReadBook || !reviewData.authenticReview || !reviewData.noAI) {
    validation.isValid = false;
    validation.issues.push('Reading verification checks are required');
  }
  
  // AI detection analysis
  validation.aiAnalysis = analyzeReviewForAI(reviewData.text);
  if (validation.aiAnalysis.isLikelyAI) {
    validation.requiresModeration = true;
    validation.riskLevel = 'high';
    validation.issues.push('Review appears to be AI-generated');
  }
  
  // User behavior analysis
  validation.behaviorAnalysis = analyzeUserBehavior(userHistory);
  if (validation.behaviorAnalysis.isSuspicious) {
    validation.requiresModeration = true;
    validation.riskLevel = Math.max(validation.riskLevel === 'high' ? 2 : 1, validation.behaviorAnalysis.confidence > 0.7 ? 2 : 1);
    validation.issues.push('Suspicious user behavior detected');
  }
  
  // Determine overall risk level
  if (validation.aiAnalysis.confidence > 0.8 || validation.behaviorAnalysis.confidence > 0.8) {
    validation.riskLevel = 'critical';
  } else if (validation.aiAnalysis.confidence > 0.6 || validation.behaviorAnalysis.confidence > 0.6) {
    validation.riskLevel = 'high';
  } else if (validation.aiAnalysis.confidence > 0.4 || validation.behaviorAnalysis.confidence > 0.4) {
    validation.riskLevel = 'medium';
  }
  
  // Set risk level text
  if (validation.riskLevel === 2) validation.riskLevel = 'high';
  if (validation.riskLevel === 1) validation.riskLevel = 'low';
  
  return validation;
}

/**
 * Get validation recommendations for moderators
 * @param {Object} validation - Validation results
 * @returns {Object} Moderation recommendations
 */
export function getModerationRecommendations(validation) {
  const recommendations = {
    action: 'approve',
    priority: 'low',
    reviewTime: 'immediate',
    notes: []
  };
  
  if (validation.riskLevel === 'critical') {
    recommendations.action = 'reject';
    recommendations.priority = 'high';
    recommendations.reviewTime = 'immediate';
    recommendations.notes.push('High confidence AI-generated content detected');
  } else if (validation.riskLevel === 'high') {
    recommendations.action = 'moderate';
    recommendations.priority = 'high';
    recommendations.reviewTime = 'within_24h';
    recommendations.notes.push('Multiple risk factors detected, requires human review');
  } else if (validation.riskLevel === 'medium') {
    recommendations.action = 'moderate';
    recommendations.priority = 'medium';
    recommendations.reviewTime = 'within_48h';
    recommendations.notes.push('Some risk factors detected, moderate priority review');
  }
  
  // Add specific recommendations based on issues
  if (validation.aiAnalysis?.reasons.length > 0) {
    recommendations.notes.push(`AI detection: ${validation.aiAnalysis.reasons.join(', ')}`);
  }
  
  if (validation.behaviorAnalysis?.reasons.length > 0) {
    recommendations.notes.push(`Behavior: ${validation.behaviorAnalysis.reasons.join(', ')}`);
  }
  
  return recommendations;
}

/**
 * Log validation results for monitoring and improvement
 * @param {Object} validation - Validation results
 * @param {string} reviewId - The review ID
 * @param {string} userId - The user ID
 */
export function logValidationResults(validation, reviewId, userId) {
  // This would typically send data to analytics/monitoring service
  console.log('Review validation logged:', {
    reviewId,
    userId,
    timestamp: new Date().toISOString(),
    riskLevel: validation.riskLevel,
    requiresModeration: validation.requiresModeration,
    aiConfidence: validation.aiAnalysis?.confidence,
    behaviorConfidence: validation.behaviorAnalysis?.confidence,
    issues: validation.issues
  });
}

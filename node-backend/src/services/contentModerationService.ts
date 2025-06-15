import logger from '../config/logger';

interface ModerationResult {
  isApproved: boolean;
  issues: string[];
  confidence: number;
  suggestions?: string[];
}

interface CopyrightPattern {
  pattern: RegExp;
  artist: string;
  confidence: number;
}

// Common copyrighted lyrics patterns (simplified for demonstration)
const COPYRIGHTED_PATTERNS: CopyrightPattern[] = [
  { pattern: /happy birthday to you/i, artist: 'Traditional (Warner)', confidence: 0.9 },
  { pattern: /let it be.*speaking words of wisdom/i, artist: 'The Beatles', confidence: 0.8 },
  { pattern: /imagine all the people.*living life in peace/i, artist: 'John Lennon', confidence: 0.8 },
  // Add more patterns as needed
];

// Offensive content patterns
const OFFENSIVE_PATTERNS = [
  /\b(hate|kill|murder)\s+(all|every)\s+\w+/i,
  /\b(racial|ethnic)\s+slur/i,
  // Add more patterns carefully
];

// Common public domain or fair use indicators
const FAIR_USE_INDICATORS = [
  /parody|satire|remix|cover|tribute/i,
  /educational|analysis|critique|review/i,
  /transformative|commentary/i,
];

export class ContentModerationService {
  /**
   * Check content for copyright and offensive material
   */
  static async moderateContent(content: string, metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
  }): Promise<ModerationResult> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let confidence = 0;

    // Check for copyrighted content
    const copyrightCheck = this.checkCopyright(content, metadata);
    if (copyrightCheck.issues.length > 0) {
      issues.push(...copyrightCheck.issues);
      suggestions.push(...(copyrightCheck.suggestions || []));
      confidence = Math.max(confidence, copyrightCheck.confidence);
    }

    // Check for offensive content
    const offensiveCheck = this.checkOffensive(content);
    if (offensiveCheck.issues.length > 0) {
      issues.push(...offensiveCheck.issues);
      confidence = Math.max(confidence, offensiveCheck.confidence);
    }

    // Check if content is too short or spam-like
    const qualityCheck = this.checkQuality(content);
    if (qualityCheck.issues.length > 0) {
      issues.push(...qualityCheck.issues);
      suggestions.push(...(qualityCheck.suggestions || []));
    }

    const isApproved = issues.length === 0;

    logger.info('Content moderation result', {
      isApproved,
      issueCount: issues.length,
      confidence
    });

    return {
      isApproved,
      issues,
      confidence,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  /**
   * Check for potential copyright violations
   */
  private static checkCopyright(content: string, metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
  }): ModerationResult {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let maxConfidence = 0;

    // Check content against known copyrighted patterns
    for (const copyrightPattern of COPYRIGHTED_PATTERNS) {
      if (copyrightPattern.pattern.test(content)) {
        issues.push(`Potential copyrighted content detected: "${copyrightPattern.artist}"`);
        maxConfidence = Math.max(maxConfidence, copyrightPattern.confidence);
      }
    }

    // Check if fair use is indicated
    const combinedText = [
      content,
      metadata?.title || '',
      metadata?.description || '',
      ...(metadata?.tags || [])
    ].join(' ');

    const hasFairUseIndicator = FAIR_USE_INDICATORS.some(pattern => 
      pattern.test(combinedText)
    );

    if (issues.length > 0 && hasFairUseIndicator) {
      suggestions.push(
        'Your content appears to reference copyrighted material. ' +
        'If this is for educational, critique, or transformative purposes, ' +
        'please clearly indicate this in your description.'
      );
      // Reduce confidence if fair use is indicated
      maxConfidence *= 0.5;
    }

    // Check for verbatim lengthy quotes
    const lines = content.split('\n');
    const consecutiveLines = this.findConsecutiveMatches(lines);
    if (consecutiveLines > 4) {
      issues.push('Large blocks of potentially copyrighted text detected');
      suggestions.push('Consider using shorter excerpts or paraphrasing');
      maxConfidence = Math.max(maxConfidence, 0.7);
    }

    return {
      isApproved: issues.length === 0,
      issues,
      confidence: maxConfidence,
      suggestions
    };
  }

  /**
   * Check for offensive content
   */
  private static checkOffensive(content: string): ModerationResult {
    const issues: string[] = [];
    let confidence = 0;

    for (const pattern of OFFENSIVE_PATTERNS) {
      if (pattern.test(content)) {
        issues.push('Potentially offensive content detected');
        confidence = 0.8;
        break; // Don't reveal specific patterns
      }
    }

    // Check for excessive profanity (simplified)
    const profanityCount = (content.match(/\b(fuck|shit|damn|hell)\b/gi) || []).length;
    const wordCount = content.split(/\s+/).length;
    const profanityRatio = profanityCount / wordCount;

    if (profanityRatio > 0.1) { // More than 10% profanity
      issues.push('Excessive profanity detected');
      confidence = Math.max(confidence, 0.6);
    }

    return {
      isApproved: issues.length === 0,
      issues,
      confidence
    };
  }

  /**
   * Check content quality
   */
  private static checkQuality(content: string): ModerationResult {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check minimum length
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount < 10) {
      issues.push('Content is too short');
      suggestions.push('Please provide at least 10 words for meaningful analysis');
    }

    // Check for spam patterns
    const repeatedChars = /(.)\1{10,}/; // Same character repeated 10+ times
    const repeatedWords = /(\b\w+\b)(\s+\1){5,}/i; // Same word repeated 5+ times
    
    if (repeatedChars.test(content) || repeatedWords.test(content)) {
      issues.push('Spam-like patterns detected');
      suggestions.push('Please provide genuine content for analysis');
    }

    // Check for all caps (shouting)
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.8 && content.length > 20) {
      issues.push('Excessive use of capital letters');
      suggestions.push('Please use normal capitalization');
    }

    return {
      isApproved: issues.length === 0,
      issues,
      confidence: 0.9,
      suggestions
    };
  }

  /**
   * Helper to find consecutive matching lines (potential copy-paste)
   */
  private static findConsecutiveMatches(lines: string[]): number {
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].length > 20 && lines[i] === lines[i - 1]) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }
    
    return maxConsecutive;
  }

  /**
   * Check if content should be flagged for manual review
   */
  static shouldFlagForReview(moderationResult: ModerationResult): boolean {
    // Flag for review if confidence is moderate but not high
    return !moderationResult.isApproved && 
           moderationResult.confidence >= 0.5 && 
           moderationResult.confidence < 0.8;
  }
}

export default ContentModerationService; 
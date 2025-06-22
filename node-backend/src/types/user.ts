export interface UserPreferences {
  // AI Model preferences
  preferredModel?: string;
  autoUpgradeForComplexity?: boolean;
  budgetLimit?: number; // Monthly spending limit in USD
  
  // Payment preferences
  preferredPaymentMethod?: 'stripe' | 'crypto';
  preferredCryptoCurrency?: string;
  
  // Observatory preferences
  defaultLanguage?: string;
  focusMode?: 'comprehensive' | 'rhyme' | 'rhythm' | 'alliteration' | 'advanced';
  sensitivity?: 'subtle' | 'moderate' | 'strong';
  culturalContext?: boolean;
  phoneticDepth?: 'basic' | 'detailed' | 'expert';
}

export interface UserUsage {
  tokensUsedThisMonth: number;
  costThisMonth: number;
  observationsThisMonth: number;
  lastReset: Date;
  favoriteModels: string[];
}

export interface ModelUsageStats {
  modelId: string;
  tokensUsed: number;
  cost: number;
  observations: number;
  avgResponseTime: number;
  userSatisfaction?: number;
} 
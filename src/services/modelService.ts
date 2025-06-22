import { auth } from '../config/firebase';
import { log } from '../utils/logger';

export interface AIModel {
  id: string;
  name: string;
  description: string;
  tier: 'basic' | 'standard' | 'premium';
  strengths: string[];
  costPerToken: number;
  maxTokens: number;
}

export interface ModelRecommendation {
  recommendedModel: {
    id: string;
    name: string;
    description: string;
    tier: string;
  };
  estimatedTokens: number;
  estimatedCost: number;
  reasoning: {
    textLength: number;
    language: string;
    complexity: string;
    isRTL: boolean;
    isComplexLanguage: boolean;
  };
}

export interface UserPreferences {
  preferredModel?: string;
  autoUpgradeForComplexity?: boolean;
  budgetLimit?: number;
  preferredPaymentMethod?: 'stripe' | 'crypto';
  preferredCryptoCurrency?: string;
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
  favoriteModels: string[];
}

export interface CostEstimate {
  modelId: string;
  modelName: string;
  estimatedTokens: number;
  estimatedCost: number;
  costPerToken: number;
}

class ModelService {
  private baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://your-backend-url.com/api' 
    : 'http://localhost:3001/api';

  private async getAuthHeaders(): Promise<HeadersInit> {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
    }
    return {
      'Content-Type': 'application/json'
    };
  }

  async getAvailableModels(): Promise<{ models: AIModel[]; defaultModel: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/models/available`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      return await response.json();
    } catch (error) {
      log.error('Failed to fetch available models', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  async getModelRecommendation(
    text: string, 
    language: string = 'en', 
    complexity: 'simple' | 'standard' | 'complex' = 'standard'
  ): Promise<ModelRecommendation> {
    try {
      const response = await fetch(`${this.baseUrl}/models/recommend`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ text, language, complexity })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get model recommendation');
      }
      
      return await response.json();
    } catch (error) {
      log.error('Failed to get model recommendation', { text, language, complexity, error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  async getCostEstimate(
    text: string, 
    modelId?: string, 
    language: string = 'en'
  ): Promise<CostEstimate> {
    try {
      const response = await fetch(`${this.baseUrl}/models/cost-estimate`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ text, modelId, language })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get cost estimate');
      }
      
      return await response.json();
    } catch (error) {
      log.error('Failed to get cost estimate', { text, modelId, language, error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  async getUserPreferences(): Promise<{ preferences: UserPreferences }> {
    try {
      const response = await fetch(`${this.baseUrl}/models/preferences`, {
        headers: await this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user preferences');
      }
      
      return await response.json();
    } catch (error) {
      log.error('Failed to fetch user preferences', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/models/preferences`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(preferences)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user preferences');
      }
    } catch (error) {
      log.error('Failed to update user preferences', { preferences, error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  async getUserUsage(): Promise<UserUsage> {
    try {
      const response = await fetch(`${this.baseUrl}/models/usage`, {
        headers: await this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user usage');
      }
      
      return await response.json();
    } catch (error) {
      log.error('Failed to fetch user usage', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      throw error;
    }
  }
}

export const modelService = new ModelService(); 
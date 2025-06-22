// Environment variables are loaded in index.ts

export const settings = {
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
    maxRequests: parseInt(process.env.MAX_REQUESTS_PER_WINDOW || '10', 10)
  },
  
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '86400', 10)
  },
  
  security: {
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    apiKeyHeader: process.env.API_KEY_HEADER || 'X-API-Key'
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  },
  
  features: {
    batchProcessing: process.env.ENABLE_BATCH_PROCESSING === 'true',
    advancedMetrics: process.env.ENABLE_ADVANCED_METRICS === 'true'
  },
  
  validation: {
    maxTextLength: 5000,
    unsafePatterns: [
      '<script>',
      'javascript:',
      'data:',
      'vbscript:',
      'expression('
    ]
  },

  // AI Model Configuration
  models: {
    available: [
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3 Haiku',
        provider: 'anthropic',
        costPerToken: 0.00025, // $0.25 per 1K tokens
        maxTokens: 4096,
        description: 'Fastest and most affordable - great for basic pattern detection',
        tier: 'basic',
        strengths: ['speed', 'cost-effective', 'simple patterns']
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        costPerToken: 0.003, // $3 per 1K tokens
        maxTokens: 4096,
        description: 'Balanced performance and cost - ideal for most observations',
        tier: 'standard',
        strengths: ['balanced', 'reliable', 'cultural context']
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        costPerToken: 0.015, // $15 per 1K tokens
        maxTokens: 4096,
        description: 'Most capable model - best for complex poetry and cultural analysis',
        tier: 'premium',
        strengths: ['complex patterns', 'cultural nuance', 'deep analysis']
      }
    ],
    default: 'claude-3-5-sonnet-20241022',
    
    // Model selection logic
    getRecommendedModel: (textLength: number, language: string, complexity: 'simple' | 'standard' | 'complex' = 'standard') => {
      // For RTL languages and complex poetry, recommend higher tier models
      const isRTL = ['ar', 'he', 'fa', 'ur'].includes(language);
      const isComplexLanguage = ['ja', 'zh', 'ko', 'ar', 'he', 'fa', 'ur'].includes(language);
      
      if (complexity === 'complex' || isRTL || (isComplexLanguage && textLength > 500)) {
        return 'claude-3-opus-20240229';
      } else if (textLength > 1000 || complexity === 'standard') {
        return 'claude-3-5-sonnet-20241022';
      } else {
        return 'claude-3-5-haiku-20241022';
      }
    },

    // Cost calculation
    calculateCost: (tokens: number, modelId: string) => {
      const model = settings.models.available.find(m => m.id === modelId);
      if (!model) return 0;
      return (tokens / 1000) * model.costPerToken;
    }
  }
}; 
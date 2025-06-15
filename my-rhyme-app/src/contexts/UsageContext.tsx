import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from './AuthContext';

export interface RegionalPricing {
  tokenMultiplier: number;
  currency: string;
  exchangeRate: number;
}

export interface TokenConfig {
  batchSize: number;
  baseCost: number;
  batchCost: number;
  bulkDiscount: number;
  regionalPricing: {
    [countryCode: string]: RegionalPricing;
  };
  cooldownSeconds: number;
}

export interface PlanLimits {
  monthlyAnalyses: number;
  tokenLimit: number;
  features: string[];
  regionalPricing?: RegionalPricing;
}

export interface UsageInfo {
  tokenBalance: number;
  lastAnalysisDate: Date | null;
  analysesThisMonth: number;
  tokensUsedThisMonth: number;
  planLimits: PlanLimits;
  lastTokenUpdate: Date | null;
  userRegion?: string;
}

interface UsageContextType {
  usageInfo: UsageInfo | null;
  updateTokenBalance: (amount: number) => Promise<void>;
  recordAnalysis: (tokensUsed: number) => Promise<void>;
  calculateTokenCost: (textLength: number) => number;
  isLoading: boolean;
  error: string | null;
  tokenConfig: TokenConfig;
}

export const UsageContext = createContext<UsageContextType | undefined>(undefined);

export const useUsage = () => {
  const context = useContext(UsageContext);
  if (!context) {
    throw new Error('useUsage must be used within a UsageProvider');
  }
  return context;
};

interface UsageProviderProps {
  children: ReactNode;
}

const DEFAULT_TOKEN_CONFIG: TokenConfig = {
  batchSize: 3000,
  baseCost: 1,
  batchCost: 0.5,
  bulkDiscount: 0.1, // 10% discount for bulk
  regionalPricing: {
    'US': { tokenMultiplier: 1, currency: 'USD', exchangeRate: 1 },
    'GB': { tokenMultiplier: 1, currency: 'GBP', exchangeRate: 0.79 },
    'EU': { tokenMultiplier: 0.9, currency: 'EUR', exchangeRate: 0.92 },
    'IN': { tokenMultiplier: 0.5, currency: 'INR', exchangeRate: 83.12 },
    // Add more regions as needed
  },
  cooldownSeconds: 0,
};

const DEFAULT_PLAN_LIMITS: PlanLimits = {
  monthlyAnalyses: 10,
  tokenLimit: 1000,
  features: ['Basic Analysis', 'Standard Patterns'],
};

export const UsageProvider: React.FC<UsageProviderProps> = ({ children }) => {
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenConfig, setTokenConfig] = useState<TokenConfig>(DEFAULT_TOKEN_CONFIG);
  const authCtx = useContext(AuthContext);
  const currentUser = authCtx?.currentUser;

  // Fetch token configuration from admin settings
  useEffect(() => {
    const fetchTokenConfig = async () => {
      try {
        // Only try to fetch if user is authenticated and is admin
        if (!currentUser) {
          console.log('Using default token config - no user authenticated');
          return;
        }
        
        const configDoc = await getDoc(doc(db, 'admin', 'tokenConfig'));
        if (configDoc.exists()) {
          setTokenConfig(configDoc.data() as TokenConfig);
          console.log('Loaded token config from Firebase');
        } else {
          console.log('No token config found in Firebase, using defaults');
        }
      } catch (err: unknown) {
        console.warn('Could not fetch token config from Firebase, using defaults:', err);
        // Continue with default config - this is not a critical error
      }
    };
    
    // Only fetch if we have a user
    if (currentUser) {
      fetchTokenConfig();
    }
  }, [currentUser]);

  // Calculate token cost based on text length and user's region
  const calculateTokenCost = (textLength: number): number => {
    const batches = Math.ceil(textLength / tokenConfig.batchSize);
    let cost = tokenConfig.baseCost;
    
    if (batches > 1) {
      cost += (batches - 1) * tokenConfig.batchCost;
      // Apply bulk discount for 5+ batches
      if (batches >= 5) {
        cost *= (1 - tokenConfig.bulkDiscount);
      }
    }

    // Apply regional pricing if available
    if (usageInfo?.userRegion && tokenConfig.regionalPricing[usageInfo.userRegion]) {
      const regionalMultiplier = tokenConfig.regionalPricing[usageInfo.userRegion].tokenMultiplier;
      cost *= regionalMultiplier;
    }

    return Math.ceil(cost);
  };

  useEffect(() => {
    const fetchUsageInfo = async () => {
      if (!currentUser) {
        setUsageInfo(null);
        setIsLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsageInfo({
            tokenBalance: data.tokenBalance || 0,
            lastAnalysisDate: data.lastAnalysisDate?.toDate() || null,
            analysesThisMonth: data.analysesThisMonth || 0,
            tokensUsedThisMonth: data.tokensUsedThisMonth || 0,
            planLimits: data.planLimits || DEFAULT_PLAN_LIMITS,
            lastTokenUpdate: data.lastTokenUpdate?.toDate() || null,
            userRegion: data.userRegion,
          });
        } else {
          // Initialize new user with default values
          const newUsageInfo: UsageInfo = {
            tokenBalance: 100, // Starting tokens
            lastAnalysisDate: null,
            analysesThisMonth: 0,
            tokensUsedThisMonth: 0,
            planLimits: DEFAULT_PLAN_LIMITS,
            lastTokenUpdate: new Date(),
            userRegion: 'US', // Default region
          };
          await setDoc(userDocRef, {
            ...newUsageInfo,
            lastTokenUpdate: serverTimestamp(),
          }, { merge: true });
          setUsageInfo(newUsageInfo);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch usage info');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsageInfo();
  }, [currentUser]);

  const updateTokenBalance = async (amount: number) => {
    if (!currentUser || !usageInfo) return;

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const newBalance = usageInfo.tokenBalance + amount;
      await updateDoc(userDocRef, {
        tokenBalance: newBalance,
        lastTokenUpdate: serverTimestamp(),
      });
      setUsageInfo(prev => prev ? { ...prev, tokenBalance: newBalance } : null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update token balance');
    }
  };

  const recordAnalysis = async (tokensUsed: number) => {
    if (!currentUser || !usageInfo) return;

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const newBalance = usageInfo.tokenBalance - tokensUsed;
      const newAnalysesThisMonth = usageInfo.analysesThisMonth + 1;
      const newTokensUsedThisMonth = usageInfo.tokensUsedThisMonth + tokensUsed;

      await updateDoc(userDocRef, {
        tokenBalance: newBalance,
        lastAnalysisDate: serverTimestamp(),
        analysesThisMonth: newAnalysesThisMonth,
        tokensUsedThisMonth: newTokensUsedThisMonth,
      });

      setUsageInfo(prev => prev ? {
        ...prev,
        tokenBalance: newBalance,
        lastAnalysisDate: new Date(),
        analysesThisMonth: newAnalysesThisMonth,
        tokensUsedThisMonth: newTokensUsedThisMonth,
      } : null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record analysis');
    }
  };

  return (
    <UsageContext.Provider value={{ 
      usageInfo, 
      updateTokenBalance, 
      recordAnalysis, 
      calculateTokenCost,
      isLoading, 
      error,
      tokenConfig
    }}>
      {children}
    </UsageContext.Provider>
  );
};

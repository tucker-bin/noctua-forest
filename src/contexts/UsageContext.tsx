import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { log } from '../utils/logger';

interface UsageInfo {
  observationsThisMonth: number;
  tokenBalance: number;
  lastObservationTime?: string;
  userRegion?: string;
}

interface TokenConfig {
  batchSize: number;
  baseCost: number;
  batchCost: number;
  bulkDiscount: number;
  regionalPricing: { [region: string]: { tokenMultiplier: number; currency: string; exchangeRate: number } };
  cooldownSeconds: number;
}

interface UsageContextType {
  usageInfo: UsageInfo | null;
  tokenConfig: TokenConfig;
  calculateTokenCost: (textLength: number) => number;
  recordObservation: (tokenCost: number) => Promise<void>;
  isLoading: boolean;
}

const DEFAULT_TOKEN_CONFIG: TokenConfig = {
  batchSize: 3000,
  baseCost: 0.27,
  batchCost: 0.135,
  bulkDiscount: 0.1,
  regionalPricing: {
    'US': { tokenMultiplier: 0.27, currency: 'USD', exchangeRate: 1 },
    'GB': { tokenMultiplier: 0.27, currency: 'GBP', exchangeRate: 0.79 },
    'EU': { tokenMultiplier: 0.243, currency: 'EUR', exchangeRate: 0.92 },
    'IN': { tokenMultiplier: 0.135, currency: 'INR', exchangeRate: 83.12 },
  },
  cooldownSeconds: 0,
};

const UsageContext = createContext<UsageContextType>({
  usageInfo: null,
  tokenConfig: DEFAULT_TOKEN_CONFIG,
  calculateTokenCost: () => 0,
  recordObservation: async () => {},
  isLoading: true
});

export const useUsage = () => useContext(UsageContext);

export const UsageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenConfig] = useState<TokenConfig>(DEFAULT_TOKEN_CONFIG);

  const fetchUsageInfo = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      const token = await currentUser.getIdToken();
      
      log.info('Fetching usage information', { userId: currentUser.uid });
      
      const response = await fetch('/api/usage', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsageInfo(data);
        log.info('Usage information loaded', { 
          observationsCount: data.observationsCount,
          currentPlan: data.currentPlan 
        });
      } else {
        throw new Error('Failed to fetch usage info');
      }
    } catch (error) {
      log.error('Failed to fetch usage information', { 
        userId: currentUser?.uid,
        error: error instanceof Error ? error.message : String(error) 
      }, error instanceof Error ? error : undefined);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUsageInfo();
  }, [fetchUsageInfo]);

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

  const recordObservation = useCallback(async (tokenCost: number) => {
    if (!currentUser) return;
    
    try {
      const token = await currentUser.getIdToken();
      
      log.userAction('Recording observation', { 
        userId: currentUser.uid,
        textLength: tokenCost 
      });
      
      const response = await fetch('/api/usage/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ textLength: tokenCost })
      });
      
      if (response.ok) {
        // Refresh usage info after recording
        await fetchUsageInfo();
        log.info('Observation recorded successfully');
      } else {
        throw new Error('Failed to record observation');
      }
    } catch (error) {
      log.error('Failed to record observation', { 
        userId: currentUser?.uid,
        error: error instanceof Error ? error.message : String(error) 
      }, error instanceof Error ? error : undefined);
    }
  }, [currentUser, fetchUsageInfo]);

  return (
    <UsageContext.Provider value={{
      usageInfo,
      tokenConfig,
      calculateTokenCost,
      recordObservation,
      isLoading
    }}>
      {children}
    </UsageContext.Provider>
  );
}; 
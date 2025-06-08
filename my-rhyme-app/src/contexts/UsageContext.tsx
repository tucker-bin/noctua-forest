import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from './AuthContext';

export interface PlanLimits {
  monthlyAnalyses: number;
  tokenLimit: number;
  features: string[];
}

export interface UsageInfo {
  tokenBalance: number;
  lastAnalysisDate: Date | null;
  analysesThisMonth: number;
  tokensUsedThisMonth: number;
  planLimits: PlanLimits;
  lastTokenUpdate: Date | null;
}

interface UsageContextType {
  usageInfo: UsageInfo | null;
  updateTokenBalance: (amount: number) => Promise<void>;
  recordAnalysis: (tokensUsed: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
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

const DEFAULT_PLAN_LIMITS: PlanLimits = {
  monthlyAnalyses: 10,
  tokenLimit: 1000,
  features: ['Basic Analysis', 'Standard Patterns'],
};

export const UsageProvider: React.FC<UsageProviderProps> = ({ children }) => {
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authCtx = useContext(AuthContext);
  const currentUser = authCtx?.currentUser;

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
          };
          await setDoc(userDocRef, {
            ...newUsageInfo,
            lastTokenUpdate: serverTimestamp(),
          }, { merge: true });
          setUsageInfo(newUsageInfo);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch usage info');
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
    } catch (err: any) {
      setError(err.message || 'Failed to update token balance');
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
    } catch (err: any) {
      setError(err.message || 'Failed to record analysis');
    }
  };

  return (
    <UsageContext.Provider value={{ usageInfo, updateTokenBalance, recordAnalysis, isLoading, error }}>
      {children}
    </UsageContext.Provider>
  );
};

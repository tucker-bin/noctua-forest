import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface GameSession {
  regularGamesPlayed: number;
  customGamesUsed: number;
  sessionStartTime: Date;
}

interface GameSessionContextType {
  session: GameSession;
  canPlayRegularGame: boolean;
  canPlayCustomGame: boolean;
  playRegularGame: () => void;
  playCustomGame: () => void;
  remainingRegularGames: number;
  showSignupPrompt: boolean;
  dismissSignupPrompt: () => void;
}

const GameSessionContext = createContext<GameSessionContextType | undefined>(undefined);

const FREE_REGULAR_GAMES_LIMIT = 10;

export const GameSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  
  // Session data (no localStorage - resets on page refresh)
  const [session, setSession] = useState<GameSession>({
    regularGamesPlayed: 0,
    customGamesUsed: 0,
    sessionStartTime: new Date()
  });
  
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  // For logged in users, no limits
  const isLoggedIn = !!currentUser;
  
  const canPlayRegularGame = isLoggedIn || session.regularGamesPlayed < FREE_REGULAR_GAMES_LIMIT;
  const canPlayCustomGame = isLoggedIn; // Custom games require login
  
  const remainingRegularGames = isLoggedIn ? Infinity : Math.max(0, FREE_REGULAR_GAMES_LIMIT - session.regularGamesPlayed);

  const playRegularGame = () => {
    if (!canPlayRegularGame) return;
    
    setSession(prev => ({
      ...prev,
      regularGamesPlayed: prev.regularGamesPlayed + 1
    }));
    
    // Show signup prompt after 7 games (3 remaining)
    if (!isLoggedIn && session.regularGamesPlayed >= 7) {
      setShowSignupPrompt(true);
    }
  };

  const playCustomGame = () => {
    if (!canPlayCustomGame) return;
    
    setSession(prev => ({
      ...prev,
      customGamesUsed: prev.customGamesUsed + 1
    }));
  };

  const dismissSignupPrompt = () => {
    setShowSignupPrompt(false);
  };

  // Reset signup prompt when user logs in
  useEffect(() => {
    if (isLoggedIn) {
      setShowSignupPrompt(false);
    }
  }, [isLoggedIn]);

  return (
    <GameSessionContext.Provider value={{
      session,
      canPlayRegularGame,
      canPlayCustomGame,
      playRegularGame,
      playCustomGame,
      remainingRegularGames,
      showSignupPrompt,
      dismissSignupPrompt
    }}>
      {children}
    </GameSessionContext.Provider>
  );
};

export const useGameSession = (): GameSessionContextType => {
  const context = useContext(GameSessionContext);
  if (!context) {
    throw new Error('useGameSession must be used within a GameSessionProvider');
  }
  return context;
}; 
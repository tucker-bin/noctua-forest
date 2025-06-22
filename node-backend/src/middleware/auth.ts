import { Request, Response, NextFunction } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { admin, auth, db } from '../config/firebase';
import { logger } from '../utils/logger';
import { AuthRequest, NoctuaUser, UserTier } from '../types/express.d';
import express from 'express';

// Helper function to determine user tier from Firebase token and Firestore data
async function getUserTier(decodedToken: DecodedIdToken): Promise<UserTier> {
  try {
    // Check if user has admin custom claim
    if (decodedToken.admin === true) {
      return 'admin';
    }
    
    // Check Firestore for premium status
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData?.tier === 'premium' || userData?.isPremium === true) {
        return 'premium';
      }
    }
    
    return 'free';
  } catch (error) {
    logger.error('Error determining user tier:', error);
    return 'free'; // Default to free on error
  }
}

// Helper function to create NoctuaUser from Firebase token
async function createNoctuaUser(decodedToken: DecodedIdToken): Promise<NoctuaUser> {
  const tier = await getUserTier(decodedToken);
  
  return {
    uid: decodedToken.uid,
    email: decodedToken.email,
    tier,
    displayName: decodedToken.name,
    photoURL: decodedToken.picture,
    isAdmin: tier === 'admin',
    isPremium: tier === 'premium' || tier === 'admin',
    lastLogin: new Date()
  };
}

// Helper function to check if a user is a Firebase admin
async function isFirebaseAdminUser(idToken: string): Promise<boolean> {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken.admin === true;
  } catch (error) {
    logger.error('Error verifying admin token:', error);
    return false;
  }
}

// Middleware to require admin token
const requireAdminToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  
  if (!idToken) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const isAdmin = await isFirebaseAdminUser(idToken);
    if (!isAdmin) {
      res.status(403).json({ error: 'Not authorized as admin' });
      return;
    }
    next();
  } catch (error) {
    logger.error('Error in requireAdminToken:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to authenticate any user and populate NoctuaUser
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(token);
    
    // Create full NoctuaUser object
    const noctuaUser = await createNoctuaUser(decodedToken);
    
    // Populate request with user data
    req.user = noctuaUser;
    req.userId = decodedToken.uid;
    req.decodedToken = decodedToken;
    
    // Update last login in Firestore (fire and forget)
    db.collection('users').doc(decodedToken.uid).set({
      lastLogin: new Date(),
      tier: noctuaUser.tier,
      email: decodedToken.email,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture
    }, { merge: true }).catch(error => {
      logger.error('Error updating user last login:', error);
    });
    
    next();
  } catch (error) {
    logger.error('Authentication error:', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decodedToken = await auth.verifyIdToken(token);
      
      // Create full NoctuaUser object
      const noctuaUser = await createNoctuaUser(decodedToken);
      
      req.user = noctuaUser;
      req.userId = decodedToken.uid;
      req.decodedToken = decodedToken;
    }
    next();
  } catch (error) {
    // Optional auth - continue without user
    next();
  }
};

// Middleware to require premium tier or higher
export const requirePremium = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  if (!req.user.isPremium) {
    res.status(403).json({ 
      error: 'Premium subscription required',
      userTier: req.user.tier,
      upgradeRequired: true
    });
    return;
  }
  
  next();
};

// Create a type-safe requireAuth middleware for Express compatibility
export const requireAuth: express.RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(token);
    
    // Create full NoctuaUser object
    const noctuaUser = await createNoctuaUser(decodedToken);
    
    // Populate request with user data - this ensures req.user is never undefined after auth
    (req as any).user = noctuaUser;
    (req as any).userId = decodedToken.uid;
    (req as any).decodedToken = decodedToken;
    
    next();
  } catch (error) {
    logger.error('Authentication error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(401).json({ error: 'Invalid token' });
  }
};

export {
  requireAdminToken,
  isFirebaseAdminUser,
  AuthRequest,
  NoctuaUser, 
  UserTier
}; 
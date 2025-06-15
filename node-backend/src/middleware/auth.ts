import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { AdminRequest } from '../types/express';
import admin from 'firebase-admin';

// Helper function to check if a user is a Firebase admin
async function isFirebaseAdminUser(idToken: string): Promise<boolean> {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken.admin === true;
  } catch (error) {
    logger.error('Error verifying admin token:', error);
    return false;
  }
}

// Middleware to require admin token
const requireAdminToken = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
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

// Middleware to authenticate any user
const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    
    if (!idToken) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    await admin.auth().verifyIdToken(idToken);
    next();
  } catch (error) {
    logger.error('Error authenticating user:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export {
  requireAdminToken,
  isFirebaseAdminUser,
  authenticateUser
}; 
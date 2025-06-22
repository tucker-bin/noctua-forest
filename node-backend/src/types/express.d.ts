// Complete Express type augmentation
import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';

// User tier system
export type UserTier = 'free' | 'premium' | 'admin';

export interface NoctuaUser {
  uid: string;
  email?: string;
  tier: UserTier;
  displayName?: string;
  photoURL?: string;
  isAdmin: boolean;
  isPremium: boolean;
  createdAt?: Date;
  lastLogin?: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: NoctuaUser;
      userId?: string;
      decodedToken?: DecodedIdToken; // Original Firebase token for auth verification
    }
  }
}

export interface AuthRequest extends Request {
  user: NoctuaUser;
  userId: string;
  decodedToken: DecodedIdToken;
}

export interface AdminRequest extends AuthRequest {
  user: NoctuaUser & {
    tier: 'admin';
    isAdmin: true;
  };
}

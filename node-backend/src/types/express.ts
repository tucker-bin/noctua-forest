import { Request } from 'express';

export interface AdminRequest extends Request {
  isAdmin?: boolean;
  userId?: string;
} 
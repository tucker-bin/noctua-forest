import { Request, Response, NextFunction } from 'express';

import { metricsService } from '../services/metricsService';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: number;
    details?: unknown;
  };
  requestInfo?: {
    path: string;
    method: string;
    userId?: string;
    timestamp: string;
  };
}

function createErrorResponse(err: Error | AppError, req: Request | Request): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error: {
      message: err.message || 'An unexpected error occurred'
    },
    requestInfo: {
      path: req.path,
      method: req.method,
      userId: (req as any).user?.uid,
      timestamp: new Date().toISOString()
    }
  };

  if (err instanceof AppError) {
    response.error.code = err.statusCode;
  }

  return response;
}

export function errorHandler(
  err: Error | AppError,
  req: Request | Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Error:', {
    error: err,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.uid
  });

  // Track error metrics
  metricsService.incrementCounter('errors.total', 1, {
    type: err instanceof AppError ? err.statusCode.toString() : 'UNKNOWN_ERROR',
    path: req.path
  }).catch(err => {
    logger.error('Error tracking metrics:', err);
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json(createErrorResponse(err, req));
    return;
  }

  // Handle Firebase Auth errors
  if (err.name === 'FirebaseAuthError') {
    res.status(401).json(createErrorResponse(
      new AppError('Authentication failed', 401),
      req
    ));
    return;
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json(createErrorResponse(
      new AppError('Invalid request data', 400),
      req
    ));
    return;
  }

  // Handle rate limit errors
  if (err.name === 'RateLimitExceeded') {
    res.status(429).json(createErrorResponse(
      new AppError('Too many requests, please try again later', 429),
      req
    ));
    return;
  }

  // Handle unexpected errors
  res.status(500).json(createErrorResponse(
    new AppError('An unexpected error occurred', 500),
    req
  ));
}

export function notFoundHandler(req: Request, res: Response): void {
  const error = new AppError('Route not found', 404);
  res.status(404).json(createErrorResponse(error, req));
} 
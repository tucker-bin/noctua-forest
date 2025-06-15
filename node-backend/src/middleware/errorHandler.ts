import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    logger.error(`Error occurred: ${err.message}`, {
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });

    if (res.headersSent) {
        return next(err);
    }
    
    // Default to 500 server error
    res.status(500).json({ message: err.message || 'An unexpected error occurred.' });
} 
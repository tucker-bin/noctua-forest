import { Router } from 'express';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

const router = Router();

// Web Vitals endpoint
router.post('/web-vitals', (req: Request, res: Response) => {
  try {
    const { name, value, rating, id } = req.body;
    
    logger.info('Web Vitals metric received', {
      metric: name,
      value,
      rating,
      id,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({ success: true, message: 'Web Vitals metric recorded' });
  } catch (error) {
    logger.error('Error processing Web Vitals metric:', error);
    res.status(500).json({ error: 'Failed to process Web Vitals metric' });
  }
});

// Performance metrics endpoint
router.post('/performance', (req: Request, res: Response) => {
  try {
    const metrics = req.body;
    
    logger.info('Performance metrics received', {
      ...metrics,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({ success: true, message: 'Performance metrics recorded' });
  } catch (error) {
    logger.error('Error processing performance metrics:', error);
    res.status(500).json({ error: 'Failed to process performance metrics' });
  }
});

export default router; 
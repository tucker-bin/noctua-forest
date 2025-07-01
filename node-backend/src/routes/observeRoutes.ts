import express from 'express';
import { requireAuth } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import { 
  observeText, 
  saveObservation, 
  getObservation, 
  getUserObservations, 
  deleteObservation,
  observeAnonymousExample 
} from '../controllers/observeController';

const router = express.Router();

// Wrapper to make controller functions compatible with Express
const wrapController = (fn: any) => (req: any, res: any, next: any) => fn(req, res, next);

// Main observation endpoint
router.post('/', apiLimiter, requireAuth, wrapController(observeText));

// Anonymous example endpoint (no auth required)
router.post('/example', apiLimiter, wrapController(observeAnonymousExample));

// Save observation endpoint
router.post('/save', requireAuth, wrapController(saveObservation));

// Get user's saved observations
router.get('/saved', requireAuth, wrapController(getUserObservations));

// Get specific observation by ID
router.get('/:id', requireAuth, wrapController(getObservation));

// Delete observation
router.delete('/:id', requireAuth, wrapController(deleteObservation));

export default router; 
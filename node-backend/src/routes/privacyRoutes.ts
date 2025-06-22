import express from 'express';
import { RequestHandler } from 'express';
import { requireAuth } from '../middleware/auth';
import { 
  updatePrivacySettings, 
  getPrivacySettings,
  exportUserData,
  requestDataDeletion,
  getDataSummary,
  updateCookieConsent,
  getCookieConsent
} from '../controllers/privacyController';
import { rateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Cookie consent management
router.get('/cookie-consent', getCookieConsent as any);
router.post('/cookie-consent', updateCookieConsent as any);

// Privacy settings (requires authentication)
router.get('/settings', requireAuth, getPrivacySettings as any);
router.put('/settings', requireAuth, updatePrivacySettings as any);

// Data summary
router.get('/data-summary', requireAuth, getDataSummary as any);

// Data export (GDPR Article 20 - Right to data portability)
router.post('/data-export', 
  requireAuth, 
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 3 }), // 3 requests per 15 minutes
  exportUserData
);

// Data deletion (GDPR Article 17 - Right to erasure)
router.delete('/data-deletion', 
  requireAuth,
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 1 }), // 1 request per hour
  requestDataDeletion
);

export default router; 
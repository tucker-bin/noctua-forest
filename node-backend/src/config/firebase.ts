import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { logger } from '../utils/logger';

let app: App;
let db: Firestore;
let auth: Auth;

try {
  // The Firebase Admin SDK automatically discovers credentials via the
  // GOOGLE_APPLICATION_CREDENTIALS environment variable.
  // The logic in `index.ts` ensures this variable is loaded correctly
  // for local development, and in production it's set by the environment.
  if (getApps().length === 0) {
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'my-rhyme-app'
    });
    logger.info('Firebase Admin SDK initialized using application default credentials.');
  }
  
  app = getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);

  logger.info('✅ Firebase Admin services configured successfully.');
} catch (error) {
  logger.error('❌ Firebase Admin initialization failed. This is a critical error.', {
    error: error instanceof Error ? error.message : String(error),
    tip: 'Ensure GOOGLE_APPLICATION_CREDENTIALS is set correctly in your production environment or that firebase-service-account.json is configured via .env for local development.'
  });
  // Re-throw to prevent the application from starting in a broken state.
  throw error;
}

export { app as admin, db, auth };
export default { admin: app, db, auth }; 

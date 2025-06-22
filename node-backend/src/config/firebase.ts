import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import * as path from 'path';
import { logger } from '../utils/logger';

let app: App;
let db: Firestore;
let auth: Auth;

try {
  // Check if Firebase is already initialized
  if (getApps().length === 0) {
    const serviceAccountPath = path.resolve(__dirname, '../../../../firebase-service-account.json');
    
    app = initializeApp({
      credential: cert(serviceAccountPath),
      projectId: process.env.FIREBASE_PROJECT_ID || 'my-rhyme-app'
    });
  } else {
    app = getApps()[0];
  }

  db = getFirestore(app);
  auth = getAuth(app);

  logger.info('✅ Firebase Admin initialized successfully');
} catch (error) {
  logger.error('❌ Firebase Admin initialization failed:', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
  throw error;
}

export { app as admin, db, auth };
export default { admin: app, db, auth }; 

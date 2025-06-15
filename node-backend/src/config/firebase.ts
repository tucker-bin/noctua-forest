import * as admin from 'firebase-admin';
import logger from './logger';

try {
  // Check if the app is already initialized to prevent errors
  if (!admin.apps.length) {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './firebase-service-account.json';
    
    logger.info(`Initializing Firebase from: ${serviceAccountPath}`);

    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id-here' // Fallback
    });
  }
} catch (error) {
  logger.error({
    message: 'Firebase Admin SDK initialization failed.',
    error: error
  });
  // Depending on the application's needs, you might want to exit the process
  // if Firebase is critical for all operations.
  // process.exit(1);
}

export const db = admin.firestore();
export const auth = admin.auth(); 
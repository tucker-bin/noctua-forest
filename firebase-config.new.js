// Firebase Web App config (browser ESM)
export const firebaseConfig = {
  apiKey: "AIzaSyDkrIV0Ji28ULmGHDl6mLTMvRWQsyR4XFg",
  authDomain: "auth.noctuaforest.com", // Custom auth domain
  projectId: "my-rhyme-app",
  storageBucket: "my-rhyme-app.firebasestorage.app",
  messagingSenderId: "487322724536",
  appId: "1:487322724536:web:a5eb91460b22e57e2b2c4d"
};

// Initialize Firebase with custom auth settings
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

// Initialize Firebase app
export const app = initializeApp(firebaseConfig);

// Initialize Auth with custom settings
export const auth = getAuth(app);
auth.useDeviceLanguage(); // Use browser's language
auth.settings.appVerificationDisabledForTesting = false; // Enable production security

// Initialize Firestore
export const db = getFirestore(app);

// Export to window for legacy compatibility
if (typeof window !== 'undefined') {
  window.__FIREBASE_APP__ = app;
  window.__FIREBASE_DB__ = db;
  window.__FIREBASE_AUTH__ = auth;
}

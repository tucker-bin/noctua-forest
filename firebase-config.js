// Paste your Firebase Web App config below and export the initialized app
// Firebase Console → Project settings → Your apps → Web app → SDK setup and configuration
// Example shape:
// const firebaseConfig = {
//   apiKey: "...",
//   authDomain: "...",
//   projectId: "...",
//   storageBucket: "...",
//   messagingSenderId: "...",
//   appId: "..."
// };

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

// TODO: replace with your real config
const firebaseConfig = window.__FIREBASE_CONFIG__ || {
  apiKey: "AIzaSyDkrIV0Ji28ULmGHDl6mLTMvRWQsyR4XFg",
  authDomain: "my-rhyme-app.firebaseapp.com",
  projectId: "my-rhyme-app",
  storageBucket: "my-rhyme-app.firebasestorage.app",
  messagingSenderId: "487322724536",
  appId: "1:487322724536:web:a5eb91460b22e57e2b2c4d"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default firebaseConfig;

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

// TODO: replace with your real config
const firebaseConfig = window.__FIREBASE_CONFIG__ || {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

export const app = initializeApp(firebaseConfig);



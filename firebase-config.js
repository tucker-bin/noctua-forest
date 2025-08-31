// Firebase Web App config
const firebaseConfig = {
  apiKey: "AIzaSyDkrIV0Ji28ULmGHDl6mLTMvRWQsyR4XFg",
  authDomain: "my-rhyme-app.firebaseapp.com",
  projectId: "my-rhyme-app",
  storageBucket: "my-rhyme-app.firebasestorage.app",
  messagingSenderId: "487322724536",
  appId: "1:487322724536:web:a5eb91460b22e57e2b2c4d"
};

// Export as a module script
const script = document.createElement('script');
script.type = 'module';
script.textContent = `
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
  import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

  const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};
  export const app = initializeApp(firebaseConfig);
  export const db = getFirestore(app);
  window.__FIREBASE_APP__ = app;
  window.__FIREBASE_DB__ = db;
`;
document.head.appendChild(script);
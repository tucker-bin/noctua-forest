// Firebase Auth bootstrap for a static site
// Requires firebase-config.js to export the initialized app

import { app } from './firebase-config.js';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailSignInBtn = document.getElementById('email-signin');
const emailSignUpBtn = document.getElementById('email-signup');
const googleBtn = document.getElementById('google-signin');
const signOutBtn = document.getElementById('signout');
const authStatus = document.getElementById('auth-status');

function setStatus(message) {
  if (authStatus) authStatus.textContent = message;
}

if (emailSignInBtn) {
  emailSignInBtn.addEventListener('click', async () => {
    const email = emailInput?.value?.trim();
    const password = passwordInput?.value ?? '';
    if (!email) return setStatus('Please enter your email.');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setStatus('Signed in.');
    } catch (err) {
      setStatus(err?.message || 'Sign in failed.');
    }
  });
}

if (emailSignUpBtn) {
  emailSignUpBtn.addEventListener('click', async () => {
    const email = emailInput?.value?.trim();
    const password = passwordInput?.value ?? '';
    if (!email) return setStatus('Please enter your email.');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setStatus('Account created and signed in.');
    } catch (err) {
      setStatus(err?.message || 'Sign up failed.');
    }
  });
}

if (googleBtn) {
  googleBtn.addEventListener('click', async () => {
    try {
      await signInWithPopup(auth, provider);
      setStatus('Signed in with Google.');
    } catch (err) {
      setStatus(err?.message || 'Google sign-in failed.');
    }
  });
}

if (signOutBtn) {
  signOutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      setStatus('Signed out.');
    } catch (err) {
      setStatus(err?.message || 'Sign out failed.');
    }
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    signOutBtn && (signOutBtn.style.display = 'inline-block');
    googleBtn && (googleBtn.style.display = 'none');
    if (emailInput) emailInput.disabled = true;
    if (passwordInput) passwordInput.disabled = true;
    setStatus(`Signed in as ${user.email || 'user'}.`);
  } else {
    signOutBtn && (signOutBtn.style.display = 'none');
    googleBtn && (googleBtn.style.display = 'inline-block');
    if (emailInput) emailInput.disabled = false;
    if (passwordInput) passwordInput.disabled = false;
    setStatus('Not signed in.');
  }
});



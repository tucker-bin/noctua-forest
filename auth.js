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
  getIdTokenResult,
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const auth = getAuth(app);
const db = getFirestore(app);
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
    if (auth.currentUser) {
      return setStatus('You are already signed in. Please sign out before creating a new account.');
    }
    const email = emailInput?.value?.trim();
    const password = passwordInput?.value ?? '';
    if (!email) return setStatus('Please enter your email.');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setStatus('Account created and signed in.');
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setStatus('Email/Password sign-up is not enabled for this project.');
      } else if (code === 'auth/email-already-in-use') {
        setStatus('That email is already in use. Try signing in instead.');
      } else if (code === 'auth/weak-password') {
        setStatus('Password should be at least 6 characters.');
      } else {
        setStatus(err?.message || 'Sign up failed.');
      }
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

// Check if user is admin (Firestore flag or custom claim)
async function checkAdminStatus(uid) {
  // Firestore flag
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data?.isAdmin === true || data?.admin === true) return true;
    }
  } catch (_) {}

  // Custom claim
  try {
    const token = await getIdTokenResult(auth.currentUser, true);
    return token.claims?.admin === true || token.claims?.isAdmin === true;
  } catch (_) {
    return false;
  }
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const isAdmin = await checkAdminStatus(user.uid);
    signOutBtn && (signOutBtn.style.display = 'inline-block');
    googleBtn && (googleBtn.style.display = 'none');
    emailSignInBtn && (emailSignInBtn.disabled = true);
    emailSignUpBtn && (emailSignUpBtn.disabled = true);
    if (emailInput) emailInput.disabled = true;
    if (passwordInput) passwordInput.disabled = true;
    setStatus(`Signed in as ${user.email || 'user'}${isAdmin ? ' (Admin)' : ''}.`);

    // Handle redirects based on user type and current page
    const currentPath = window.location.pathname;
    if (currentPath.endsWith('account.html')) {
      if (isAdmin) {
        window.location.href = 'admin/dashboard.html';
      } else {
        window.location.href = 'dashboard.html';
      }
      return;
    }

    // Redirect from admin pages if not admin
    if (!isAdmin && currentPath.includes('/admin/')) {
      window.location.href = '../dashboard.html';
    }
  } else {
    signOutBtn && (signOutBtn.style.display = 'none');
    googleBtn && (googleBtn.style.display = 'inline-block');
    emailSignInBtn && (emailSignInBtn.disabled = false);
    emailSignUpBtn && (emailSignUpBtn.disabled = false);
    if (emailInput) emailInput.disabled = false;
    if (passwordInput) passwordInput.disabled = false;
    setStatus('Not signed in.');

    // Redirect away from admin pages if not signed in
    if (window.location.pathname.includes('/admin/')) {
      window.location.href = '/welcome.html';
    }
  }
});



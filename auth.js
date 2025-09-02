// Authentication and Account Management
import { app, db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { getForestName, generateForestNameForUser, setForestName, validateForestName, formatForestName } from './js/forestNameService.js';
import { getUserLists } from './js/readingListService.js';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// UI Elements
const signinForm = document.getElementById('signin-form');
const dashboard = document.getElementById('dashboard');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailSigninBtn = document.getElementById('email-signin');
const emailSignupBtn = document.getElementById('email-signup');
const googleSigninBtn = document.getElementById('google-signin');
const signoutBtn = document.getElementById('signout');
const authStatus = document.getElementById('auth-status');
const emailDisplay = document.getElementById('email-display');

// Forest Name Elements
const forestNameDisplay = document.getElementById('forest-name-display');
const forestNameForm = document.getElementById('forest-name-form');
const currentForestName = document.getElementById('current-forest-name');
const forestNameInput = document.getElementById('forest-name');
const saveNameBtn = document.getElementById('save-name');
const generateNameBtn = document.getElementById('generate-name');
const changeNameBtn = document.getElementById('change-name');
const cancelNameBtn = document.getElementById('cancel-name');
const nameError = document.getElementById('name-error');

// Lists Container
const listsContainer = document.getElementById('lists-container');

// Show error message
function showError(message) {
  authStatus.textContent = message;
  authStatus.className = 'text-red-400 text-sm';
}

// Show success message
function showSuccess(message) {
  authStatus.textContent = message;
  authStatus.className = 'text-green-400 text-sm';
}

// Show name error
function showNameError(message) {
  nameError.textContent = message;
  nameError.classList.remove('hidden');
}

// Hide name error
function hideNameError() {
  nameError.classList.add('hidden');
}

// Show Forest Name form
function showForestNameForm() {
  forestNameDisplay.classList.add('hidden');
  forestNameForm.classList.remove('hidden');
  hideNameError();
}

// Hide Forest Name form
function hideForestNameForm() {
  forestNameForm.classList.add('hidden');
  forestNameDisplay.classList.remove('hidden');
  forestNameInput.value = '';
  hideNameError();
}

// Update UI for signed in user
async function updateSignedInUI(user) {
  signinForm.classList.add('hidden');
  dashboard.classList.remove('hidden');
  emailDisplay.textContent = user.email;

  // Load Forest Name
  const name = await getForestName(user.uid);
  if (name) {
    currentForestName.textContent = formatForestName(name);
    forestNameDisplay.classList.remove('hidden');
    forestNameForm.classList.add('hidden');
  } else {
    forestNameDisplay.classList.add('hidden');
    forestNameForm.classList.remove('hidden');
  }

  // Load reading lists
  try {
    const lists = await getUserLists(user.uid);
    if (lists.length === 0) {
      listsContainer.innerHTML = `
        <p class="text-white/60">You haven't created any reading lists yet.</p>
        <a href="forest.html" class="inline-block mt-4 px-4 py-2 bg-forest-accent text-white rounded-full hover:opacity-90">
          Explore Books
        </a>
      `;
    } else {
      listsContainer.innerHTML = lists.map(list => `
        <div class="bg-[#3A4440] rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-medium">${list.name}</h3>
            <span class="text-sm text-white/60">${list.books?.length || 0} books</span>
          </div>
          ${list.description ? `<p class="text-sm text-white/80 mb-3">${list.description}</p>` : ''}
          <a href="list.html?id=${list.id}" class="text-forest-accent hover:underline text-sm">View List</a>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading lists:', err);
    listsContainer.innerHTML = '<p class="text-red-400">Error loading your lists. Please try again later.</p>';
  }
}

// Update UI for signed out user
function updateSignedOutUI() {
  signinForm.classList.remove('hidden');
  dashboard.classList.add('hidden');
  emailInput.value = '';
  passwordInput.value = '';
}

// Handle email sign in
async function handleEmailSignIn(e) {
  e.preventDefault();
  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showSuccess('Signed in successfully!');
  } catch (error) {
    console.error('Sign in error:', error);
    showError('Failed to sign in. Please check your email and password.');
  }
}

// Handle email sign up
async function handleEmailSignUp(e) {
  e.preventDefault();
  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    showSuccess('Account created successfully!');
    
    // Generate initial Forest Name
    try {
      const name = await generateForestNameForUser(user.uid);
      currentForestName.textContent = formatForestName(name);
    } catch (nameError) {
      console.error('Error generating Forest Name:', nameError);
    }
  } catch (error) {
    console.error('Sign up error:', error);
    showError('Failed to create account. This email may already be in use.');
  }
}

// Handle Google sign in
async function handleGoogleSignIn() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if this is their first sign in
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      // Generate initial Forest Name for new users
      try {
        const name = await generateForestNameForUser(user.uid);
        currentForestName.textContent = formatForestName(name);
      } catch (nameError) {
        console.error('Error generating Forest Name:', nameError);
      }
    }
    
    showSuccess('Signed in with Google successfully!');
  } catch (error) {
    console.error('Google sign in error:', error);
    showError('Failed to sign in with Google.');
  }
}

// Handle sign out
async function handleSignOut() {
  try {
    await signOut(auth);
    showSuccess('Signed out successfully!');
  } catch (error) {
    console.error('Sign out error:', error);
    showError('Failed to sign out.');
  }
}

// Handle Forest Name save
async function handleSaveName() {
  const name = forestNameInput.value.trim();
  if (!name) return;

  const validation = validateForestName(name);
  if (!validation.valid) {
    showNameError(validation.error);
    return;
  }

  try {
    await setForestName(auth.currentUser.uid, name);
    currentForestName.textContent = formatForestName(name);
    hideForestNameForm();
  } catch (error) {
    console.error('Error saving Forest Name:', error);
    showNameError(error.message);
  }
}

// Handle random name generation
async function handleGenerateName() {
  try {
    const name = await generateForestNameForUser(auth.currentUser.uid);
    currentForestName.textContent = formatForestName(name);
    hideForestNameForm();
  } catch (error) {
    console.error('Error generating Forest Name:', error);
    showNameError('Failed to generate name. Please try again.');
  }
}

// Event listeners
emailSigninBtn.addEventListener('click', handleEmailSignIn);
emailSignupBtn.addEventListener('click', handleEmailSignUp);
googleSigninBtn.addEventListener('click', handleGoogleSignIn);
signoutBtn.addEventListener('click', handleSignOut);

// Forest Name event listeners
changeNameBtn.addEventListener('click', showForestNameForm);
saveNameBtn.addEventListener('click', handleSaveName);
generateNameBtn.addEventListener('click', handleGenerateName);
cancelNameBtn.addEventListener('click', hideForestNameForm);

// Auth state observer
auth.onAuthStateChanged((user) => {
  if (user) {
    updateSignedInUI(user);
  } else {
    updateSignedOutUI();
  }
});
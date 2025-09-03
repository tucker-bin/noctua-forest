// Authentication and Account Management
import { app, db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { getForestName, generateForestNameForUser } from './js/forestNameService.js';
import { getUserLists, createList } from './js/readingListService.js';
import { getCommissionEarningsSummary } from './js/commissionService.js';
import { getAnalyticsForUser } from './js/analyticsService.js';
import { getRecentReviews } from './js/reviewService.js';

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

// Forest Name Elements (read-only)
const currentForestName = document.getElementById('current-forest-name');

// Dashboard Elements
const listsContainer = document.getElementById('lists-container');
const accountTier = document.getElementById('account-tier');
const sessionUsage = document.getElementById('session-usage');
const curatorStatus = document.getElementById('curator-status');
const applyCuratorBtn = document.getElementById('apply-curator-btn');
const createListBtn = document.getElementById('create-list-btn');
const createListBtn2 = document.getElementById('create-list-btn-2');
const earningsMonth = document.getElementById('earnings-month');
const earnings30d = document.getElementById('earnings-30d');
const earningsLifetime = document.getElementById('earnings-lifetime');
const analyticsContainer = document.getElementById('analytics-container');
const recentActivityContainer = document.getElementById('recent-activity-container');

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

// Auto-assign forest name if missing
async function ensureForestName(userId) {
  try {
    const existingName = await getForestName(userId);
    if (!existingName) {
      await generateForestNameForUser(userId);
    }
  } catch (error) {
    console.error('Error ensuring forest name:', error);
  }
}

// Update UI for signed in user
async function updateSignedInUI(user) {
  signinForm.classList.add('hidden');
  dashboard.classList.remove('hidden');
  emailDisplay.textContent = user.email;

  // Ensure forest name exists and display it
  await ensureForestName(user.uid);
  const name = await getForestName(user.uid);
  if (name) {
    currentForestName.textContent = name; // Show raw name, not formatted
  }

  // Load dashboard data
  await loadDashboardData(user.uid);
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
    
    // Auto-assign forest name
    await ensureForestName(user.uid);
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
    
    // Auto-assign forest name if missing
    await ensureForestName(user.uid);
    
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

// Load comprehensive dashboard data
async function loadDashboardData(userId) {
  try {
    // Load user profile data
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    // Update account tier
    const tier = userData.applicationStatus === 'approved' ? 'Curator Plus' : 'Free';
    accountTier.textContent = tier;
    
    // Update curator status
    const status = userData.applicationStatus || 'not_applied';
    updateCuratorStatus(status);
    
    // Load reading lists
    await loadReadingLists(userId);
    
    // Load earnings data
    await loadEarningsData(userId);
    
    // Load analytics
    await loadAnalyticsData(userId);
    
    // Load recent activity
    await loadRecentActivity(userId);
    
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

// Update curator status display
function updateCuratorStatus(status) {
  const statusElement = curatorStatus;
  const applyBtn = applyCuratorBtn;
  
  switch (status) {
    case 'approved':
      statusElement.textContent = 'Approved';
      statusElement.className = 'px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300';
      applyBtn.textContent = 'Curator Dashboard';
      applyBtn.onclick = () => window.location.href = 'curator.html';
      break;
    case 'pending':
      statusElement.textContent = 'Pending Review';
      statusElement.className = 'px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-300';
      applyBtn.textContent = 'View Application';
      applyBtn.onclick = () => window.location.href = 'curator-onboarding.html';
      break;
    case 'rejected':
      statusElement.textContent = 'Application Rejected';
      statusElement.className = 'px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-300';
      applyBtn.textContent = 'Reapply';
      applyBtn.onclick = () => window.location.href = 'curator-onboarding.html';
      break;
    default:
      statusElement.textContent = 'Not Applied';
      statusElement.className = 'px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-300';
      applyBtn.textContent = 'Apply to be a Curator';
      applyBtn.onclick = () => window.location.href = 'curator-onboarding.html';
  }
}

// Load reading lists with full management
async function loadReadingLists(userId) {
  try {
    const lists = await getUserLists(userId);
    if (lists.length === 0) {
      listsContainer.innerHTML = `
        <div class="text-center py-8">
          <p class="text-white/60 mb-4">You haven't created any reading lists yet.</p>
          <button onclick="createNewList()" class="px-4 py-2 bg-forest-accent hover:bg-[#E0751C] text-white rounded-full text-sm font-medium transition-colors">
            Create Your First List
          </button>
        </div>
      `;
    } else {
      listsContainer.innerHTML = lists.map(list => `
        <div class="bg-[#3A4440] rounded-lg p-4">
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <h3 class="font-medium text-lg mb-1">${list.name}</h3>
              ${list.description ? `<p class="text-sm text-white/80 mb-2">${list.description}</p>` : ''}
              <div class="flex items-center gap-4 text-sm text-white/60">
                <span>${list.books?.length || 0} books</span>
                <span>Created ${new Date(list.createdAt?.toDate?.() || list.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div class="flex gap-2 ml-4">
              <button onclick="editList('${list.id}')" class="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>
              <button onclick="deleteList('${list.id}')" class="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
          <div class="flex gap-3">
            <a href="list.html?id=${list.id}" class="px-4 py-2 bg-forest-accent hover:bg-[#E0751C] text-white rounded-full text-sm font-medium transition-colors">
              View List
            </a>
            <button onclick="shareList('${list.id}')" class="px-4 py-2 border border-white/20 hover:bg-white/10 text-white rounded-full text-sm font-medium transition-colors">
              Share
            </button>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading lists:', err);
    listsContainer.innerHTML = '<p class="text-red-400">Error loading your lists. Please try again later.</p>';
  }
}

// Load earnings data
async function loadEarningsData(userId) {
  try {
    const earnings = await getCommissionEarningsSummary(userId);
    earningsMonth.textContent = `$${earnings.monthly || '0.00'}`;
    earnings30d.textContent = `$${earnings.last30Days || '0.00'}`;
    earningsLifetime.textContent = `$${earnings.lifetime || '0.00'}`;
  } catch (error) {
    console.error('Error loading earnings:', error);
    earningsMonth.textContent = '$0.00';
    earnings30d.textContent = '$0.00';
    earningsLifetime.textContent = '$0.00';
  }
}

// Load analytics data
async function loadAnalyticsData(userId) {
  try {
    const analytics = await getAnalyticsForUser(userId);
    if (analytics && analytics.length > 0) {
      analyticsContainer.innerHTML = analytics.map(stat => `
        <div class="bg-[#3A4440] rounded-lg p-4">
          <h3 class="font-medium mb-2">${stat.listName}</h3>
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-white/60">Views</span>
              <div class="text-lg font-semibold text-white">${stat.views || 0}</div>
            </div>
            <div>
              <span class="text-white/60">Saves</span>
              <div class="text-lg font-semibold text-white">${stat.saves || 0}</div>
            </div>
            <div>
              <span class="text-white/60">CTR</span>
              <div class="text-lg font-semibold text-white">${stat.ctr || '0%'}</div>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      analyticsContainer.innerHTML = `
        <div class="text-center py-8">
          <p class="text-white/60">Analytics will appear here once you create lists</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading analytics:', error);
    analyticsContainer.innerHTML = '<p class="text-red-400">Error loading analytics</p>';
  }
}

// Load recent activity
async function loadRecentActivity(userId) {
  try {
    const reviews = await getRecentReviews(userId, 5);
    if (reviews && reviews.length > 0) {
      recentActivityContainer.innerHTML = reviews.map(review => `
        <div class="bg-[#3A4440] rounded-lg p-4">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-medium">${review.bookTitle}</h3>
              <p class="text-sm text-white/80 mt-1">${review.rating}/5 stars</p>
              <p class="text-xs text-white/60 mt-2">${new Date(review.createdAt?.toDate?.() || review.createdAt).toLocaleDateString()}</p>
            </div>
            <a href="book.html?id=${review.bookId}" class="text-forest-accent hover:underline text-sm">View</a>
          </div>
        </div>
      `).join('');
    } else {
      recentActivityContainer.innerHTML = `
        <div class="text-center py-8">
          <p class="text-white/60">Your recent reviews and activity will appear here</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading recent activity:', error);
    recentActivityContainer.innerHTML = '<p class="text-red-400">Error loading recent activity</p>';
  }
}

// List management functions
async function createNewList() {
  const name = prompt('Enter list name:');
  if (!name) return;
  
  try {
    await createList(auth.currentUser.uid, name);
    await loadReadingLists(auth.currentUser.uid);
  } catch (error) {
    console.error('Error creating list:', error);
    alert('Failed to create list. Please try again.');
  }
}

async function editList(listId) {
  // TODO: Implement inline editing modal
  alert('Edit functionality coming soon!');
}

async function deleteList(listId) {
  if (!confirm('Are you sure you want to delete this list?')) return;
  
  try {
    // TODO: Implement delete functionality
    alert('Delete functionality coming soon!');
  } catch (error) {
    console.error('Error deleting list:', error);
    alert('Failed to delete list. Please try again.');
  }
}

async function shareList(listId) {
  // TODO: Implement share functionality
  alert('Share functionality coming soon!');
}

// Make functions global for onclick handlers
window.createNewList = createNewList;
window.editList = editList;
window.deleteList = deleteList;
window.shareList = shareList;

// Event listeners
emailSigninBtn.addEventListener('click', handleEmailSignIn);
emailSignupBtn.addEventListener('click', handleEmailSignUp);
googleSigninBtn.addEventListener('click', handleGoogleSignIn);
signoutBtn.addEventListener('click', handleSignOut);

// Dashboard event listeners
createListBtn?.addEventListener('click', createNewList);
createListBtn2?.addEventListener('click', createNewList);

// Auth state observer
auth.onAuthStateChanged((user) => {
  if (user) {
    updateSignedInUI(user);
  } else {
    updateSignedOutUI();
  }
});
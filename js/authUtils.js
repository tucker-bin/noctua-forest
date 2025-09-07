// Centralized auth utilities for consistent admin handling across pages
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

/**
 * Check if current URL has stay=user parameter
 * @returns {boolean} True if user wants to stay on user dashboard
 */
export function shouldStayOnUserDashboard() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('stay') === 'user';
}

/**
 * Check if user is admin (with multiple fallback methods)
 * @param {string} userId - User ID
 * @param {object} db - Firestore database instance
 * @returns {Promise<boolean>} True if user is admin
 */
export async function checkAdminStatus(userId, db) {
    try {
        // Hardcoded admin check for known admin users (fallback)
        if (userId && await isHardcodedAdmin(userId)) {
            return true;
        }
        
        // Check Firestore admin flag
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.isAdmin === true || userData.admin === true) {
                return true;
            }
        }
        
        // Check Firebase Auth custom claims
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
            const tokenResult = await user.getIdTokenResult();
            if (tokenResult.claims?.admin === true || tokenResult.claims?.isAdmin === true) {
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.warn('Error checking admin status:', error);
        
        // Fallback to hardcoded check on error
        return await isHardcodedAdmin(userId);
    }
}

/**
 * Check if user is hardcoded admin
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if hardcoded admin
 */
async function isHardcodedAdmin(userId) {
    try {
        const auth = getAuth();
        const user = auth.currentUser;
        return user && user.email === 'tucker.apply@gmail.com';
    } catch (error) {
        return false;
    }
}

/**
 * Handle admin redirect with proper stay parameter checking
 * @param {object} user - Firebase user object
 * @param {object} db - Firestore database instance
 * @param {string} currentPath - Current page path (optional)
 * @returns {Promise<boolean>} True if redirect happened, false otherwise
 */
export async function handleAdminRedirect(user, db, currentPath = window.location.pathname) {
    // Prevent redirect loop - don't redirect if we're already on admin dashboard
    if (currentPath.includes('admin/dashboard.html')) {
        console.log('Already on admin dashboard, skipping redirect');
        return false;
    }
    
    // Check if admin wants to stay on user dashboard (manual override)
    const stayOnUserDashboard = shouldStayOnUserDashboard();
    console.log('Auth redirect check - stay parameter:', stayOnUserDashboard);
    
    // Check if user is admin
    const isAdmin = await checkAdminStatus(user.uid, db);
    console.log('Admin check result:', isAdmin);
    
    if (isAdmin && !stayOnUserDashboard) {
        console.log('Admin detected, redirecting to admin dashboard');
        window.location.href = 'admin/dashboard.html';
        return true;
    }
    
    return false;
}

/**
 * Set up auth state listener with consistent admin handling
 * @param {object} db - Firestore database instance
 * @param {Function} onUserReady - Callback when user is authenticated and ready
 * @param {Function} onNoUser - Callback when user is not authenticated
 */
export function setupAuthStateListener(db, onUserReady, onNoUser) {
    const auth = getAuth();
    
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('User authenticated:', user.email);
            
            // Handle admin redirect (returns true if redirect happened)
            const didRedirect = await handleAdminRedirect(user, db);
            
            // Only call onUserReady if we didn't redirect
            if (!didRedirect && onUserReady) {
                onUserReady(user);
            }
        } else {
            console.log('User not authenticated');
            if (onNoUser) {
                onNoUser();
            }
        }
    });
}

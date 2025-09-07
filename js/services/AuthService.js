// Unified Authentication Service
import { app, db } from '../../firebase-config.js';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { 
    doc, 
    getDoc, 
    setDoc, 
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

class AuthService {
    constructor() {
        this.auth = getAuth(app);
        this.googleProvider = new GoogleAuthProvider();
        this.currentUser = null;
        this.userRoles = null;
        this.setupAuthListener();
    }

    setupAuthListener() {
        onAuthStateChanged(this.auth, async (user) => {
            this.currentUser = user;
            if (user) {
                await this.loadUserRoles();
            } else {
                this.userRoles = null;
            }
            this.dispatchAuthEvent();
        });
    }

    async loadUserRoles() {
        try {
            const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
            if (userDoc.exists()) {
                this.userRoles = {
                    isAdmin: userDoc.data().isAdmin || userDoc.data().admin || false,
                    isCurator: userDoc.data().isCurator || false,
                    tier: userDoc.data().tier || 'free'
                };
            }
        } catch (error) {
            console.error('Error loading user roles:', error);
            this.userRoles = { isAdmin: false, isCurator: false, tier: 'free' };
        }
    }

    dispatchAuthEvent() {
        window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: {
                user: this.currentUser,
                roles: this.userRoles
            }
        }));
    }

    async signInWithEmail(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            return userCredential.user;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    async signUpWithEmail(email, password, displayName) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            await this.initializeUserProfile(userCredential.user, { displayName });
            return userCredential.user;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(this.auth, this.googleProvider);
            await this.initializeUserProfile(result.user);
            return result.user;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    async initializeUserProfile(user, additionalData = {}) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            await setDoc(userRef, {
                email: user.email,
                displayName: additionalData.displayName || user.displayName,
                createdAt: serverTimestamp(),
                tier: 'free',
                isAdmin: false,
                isCurator: false,
                lastLoginAt: serverTimestamp(),
                ...additionalData
            });
        } else {
            await setDoc(userRef, {
                lastLoginAt: serverTimestamp()
            }, { merge: true });
        }
    }

    async signOut() {
        try {
            await signOut(this.auth);
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    hasRole(role) {
        if (!this.userRoles) return false;
        switch (role) {
            case 'admin':
                return this.userRoles.isAdmin;
            case 'curator':
                return this.userRoles.isCurator;
            default:
                return false;
        }
    }

    handleAuthError(error) {
        // Standardize error messages
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email',
            'auth/wrong-password': 'Incorrect password',
            'auth/email-already-in-use': 'An account already exists with this email',
            'auth/invalid-email': 'Please enter a valid email address',
            'auth/weak-password': 'Password should be at least 6 characters'
        };

        return new Error(errorMessages[error.code] || error.message);
    }
}

// Create singleton instance
const authService = new AuthService();
export default authService;

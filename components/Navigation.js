import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { app } from '../firebase-config.js';

export function initNavigation() {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const nav = document.getElementById('nav');

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists() && userDoc.data().isAdmin) {
                    // Add admin link if not already present
                    if (!document.querySelector('[data-admin-link]')) {
                        const adminLink = document.createElement('a');
                        adminLink.href = '/admin/dashboard.html';
                        adminLink.className = 'hover:text-forest-accent transition-colors duration-300 font-medium';
                        adminLink.style.color = '#4A5450';
                        adminLink.textContent = 'Admin';
                        adminLink.setAttribute('data-admin-link', '');
                        nav.appendChild(adminLink);
                    }
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
            }
        } else {
            // Remove admin link if it exists
            const adminLink = document.querySelector('[data-admin-link]');
            if (adminLink) {
                adminLink.remove();
            }
        }
    });
}

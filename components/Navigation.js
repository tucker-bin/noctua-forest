import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { app } from '../firebase-config.js';

export function initNavigation() {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const nav = document.getElementById('nav');

    // Ensure a mobile toggle exists and uses green-themed dropdown
    if (nav && !document.querySelector('[data-mobile-toggle]')) {
        const header = nav.parentElement;
        const btn = document.createElement('button');
        btn.setAttribute('data-mobile-toggle', '');
        btn.setAttribute('aria-label', 'Toggle menu');
        btn.className = 'md:hidden text-[#213029]';
        btn.innerHTML = '<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>';
        header?.appendChild(btn);

        const toggle = () => {
            const open = nav.classList.contains('hidden');
            nav.classList.toggle('hidden');
            nav.classList.toggle('flex');
            nav.classList.toggle('flex-col');
            nav.classList.toggle('absolute');
            nav.classList.toggle('top-20');
            nav.classList.toggle('right-4');
            nav.classList.toggle('p-5');
            nav.classList.toggle('rounded-lg');
            nav.classList.toggle('shadow-lg');
            nav.classList.toggle('z-50');
            // Use green card background and light text instead of white
            if (open) {
                nav.style.backgroundColor = '#3A4440';
                nav.style.color = '#E8ECE6';
            } else {
                nav.style.backgroundColor = '';
                nav.style.color = '';
            }
            document.body.style.overflow = open ? 'hidden' : '';
        };
        btn.addEventListener('click', toggle);
    }

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

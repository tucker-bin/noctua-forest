// Mobile Menu Service
class MobileMenuService {
    constructor() {
        this.isOpen = false;
        this.nav = null;
        this.overlay = null;
        this.menuButton = null;
        this.initialized = false;
    }

    /**
     * Initialize mobile menu
     */
    initialize() {
        if (this.initialized) return;

        // Get elements
        this.nav = document.getElementById('nav');
        this.overlay = document.getElementById('navOverlay');
        this.menuButton = document.querySelector('[aria-label="Toggle menu"]');

        if (!this.nav || !this.menuButton) return;

        // Create overlay if it doesn't exist
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.id = 'navOverlay';
            this.overlay.className = 'nav-overlay';
            document.body.appendChild(this.overlay);
        }

        // Set up event listeners
        this.setupEventListeners();
        this.initialized = true;
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Menu button click
        this.menuButton.addEventListener('click', () => this.toggleMenu());

        // Menu button touch
        this.menuButton.addEventListener('touchend', (e) => {
            if (window.innerWidth < 768) {
                e.preventDefault();
                this.toggleMenu();
            }
        }, { passive: false });

        // Overlay click
        this.overlay.addEventListener('click', () => this.closeMenu());

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768 && this.isOpen) {
                this.closeMenu();
            }
        });

        // Close menu when clicking a link
        this.nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (this.isOpen) {
                    this.closeMenu();
                }
            });
        });
    }

    /**
     * Toggle menu state
     */
    toggleMenu() {
        if (window.innerWidth >= 768) return;
        this.isOpen ? this.closeMenu() : this.openMenu();
    }

    /**
     * Open menu
     */
    openMenu() {
        if (!this.nav) return;

        this.isOpen = true;
        this.nav.classList.remove('hidden');
        this.nav.classList.add('flex', 'flex-col');
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Apply mobile styles
        this.nav.style.backgroundColor = '#3A4440';
        this.nav.style.color = '#E0E2DB';
        this.nav.querySelectorAll('a').forEach(a => {
            a.style.setProperty('color', '#E0E2DB', 'important');
            a.classList.add('block', 'py-3', 'px-4');
            a.classList.remove('md:py-0', 'md:px-0');
        });

        // Update ARIA
        this.menuButton.setAttribute('aria-expanded', 'true');
        this.nav.setAttribute('aria-hidden', 'false');
    }

    /**
     * Close menu
     */
    closeMenu() {
        if (!this.nav) return;

        this.isOpen = false;
        this.nav.classList.add('hidden');
        this.nav.classList.remove('flex', 'flex-col');
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';

        // Remove mobile styles
        this.nav.style.backgroundColor = '';
        this.nav.style.color = '';
        this.nav.querySelectorAll('a').forEach(a => {
            a.style.removeProperty('color');
            a.classList.remove('block', 'py-3', 'px-4');
        });

        // Update ARIA
        this.menuButton.setAttribute('aria-expanded', 'false');
        this.nav.setAttribute('aria-hidden', 'true');
    }
}

// Create singleton instance
const mobileMenuService = new MobileMenuService();

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    mobileMenuService.initialize();
});

export default mobileMenuService;

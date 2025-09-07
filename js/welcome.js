// Welcome Page Script
import carouselService from './services/CarouselService.js';

async function initializeWelcomePage() {
    try {
        // Load featured books for carousel
        const featuredBooks = await carouselService.getFeaturedBooks();
        
        // Get carousel container
        const carouselContainer = document.getElementById('reviewsCarousel');
        if (!carouselContainer) return;

        if (featuredBooks.length === 0) {
            carouselContainer.parentElement.style.display = 'none';
            return;
        }

        // Create and render carousel
        const carouselHtml = carouselService.createCarouselHtml(featuredBooks);
        carouselContainer.innerHTML = carouselHtml;

        // Initialize carousel functionality
        carouselService.initializeCarousel(carouselContainer);

    } catch (error) {
        console.error('Error initializing welcome page:', error);
        const carouselContainer = document.getElementById('reviewsCarousel');
        if (carouselContainer) {
            carouselContainer.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-forest-text-muted">Unable to load featured books at this time.</p>
                </div>
            `;
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeWelcomePage);

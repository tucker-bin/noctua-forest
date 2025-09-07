// Carousel Service
import { BaseService } from './BaseService.js';
import bookService from './BookService.js';

class CarouselService extends BaseService {
    constructor() {
        super();
        this.BOOKS_COLLECTION = 'books';
    }

    async getFeaturedBooks(limit = 6) {
        try {
            // Get recent books
            const books = await bookService.getRecentBooks(limit * 2);

            // Filter for books with valid covers
            const booksWithCovers = await Promise.all(
                books.map(async book => {
                    const coverUrl = await bookService.resolveCoverUrl(book);
                    return coverUrl ? { ...book, coverUrl } : null;
                })
            );

            // Remove null entries and limit results
            return booksWithCovers
                .filter(Boolean)
                .slice(0, limit);
        } catch (error) {
            throw this.handleError(error, 'Get Featured Books');
        }
    }

    createCarouselHtml(books) {
        if (!books || books.length === 0) {
            return '';
        }

        const slides = books.map((book, index) => `
            <div class="carousel-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                <div class="relative aspect-[3/4] rounded-xl overflow-hidden">
                    <img src="${book.coverUrl}" 
                         alt="${book.title}" 
                         class="w-full h-full object-cover"
                         loading="${index === 0 ? 'eager' : 'lazy'}"
                         decoding="async">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div class="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h3 class="text-xl font-bold mb-2">${book.title}</h3>
                        <p class="text-white/80">${book.author}</p>
                        <a href="book.html?id=${book.id}" 
                           class="inline-block mt-4 px-6 py-2 bg-forest-accent hover:bg-[#E0751C] rounded-full text-sm font-medium transition-colors">
                            Learn More
                        </a>
                    </div>
                </div>
            </div>
        `).join('');

        return `
            <div class="carousel relative">
                <div class="carousel-container">
                    ${slides}
                </div>
                <button class="carousel-nav prev" aria-label="Previous slide">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button class="carousel-nav next" aria-label="Next slide">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
                <div class="carousel-dots">
                    ${books.map((_, i) => `
                        <button class="carousel-dot ${i === 0 ? 'active' : ''}" 
                                data-index="${i}" 
                                aria-label="Go to slide ${i + 1}"></button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    initializeCarousel(container) {
        if (!container) return;

        let currentSlide = 0;
        const slides = container.querySelectorAll('.carousel-slide');
        const dots = container.querySelectorAll('.carousel-dot');
        const prevBtn = container.querySelector('.carousel-nav.prev');
        const nextBtn = container.querySelector('.carousel-nav.next');

        const showSlide = (index) => {
            slides.forEach(slide => slide.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            
            slides[index].classList.add('active');
            dots[index].classList.add('active');
            currentSlide = index;
        };

        const nextSlide = () => {
            showSlide((currentSlide + 1) % slides.length);
        };

        const prevSlide = () => {
            showSlide((currentSlide - 1 + slides.length) % slides.length);
        };

        // Event listeners
        prevBtn?.addEventListener('click', prevSlide);
        nextBtn?.addEventListener('click', nextSlide);
        
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => showSlide(index));
        });

        // Touch support
        let touchStartX = 0;
        let touchEndX = 0;

        container.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 50) {
                nextSlide();
            } else if (touchEndX - touchStartX > 50) {
                prevSlide();
            }
        }, { passive: true });

        // Auto-advance
        let autoAdvance = setInterval(nextSlide, 5000);

        container.addEventListener('mouseenter', () => {
            clearInterval(autoAdvance);
        });

        container.addEventListener('mouseleave', () => {
            autoAdvance = setInterval(nextSlide, 5000);
        });

        // Keyboard navigation
        container.setAttribute('tabindex', '0');
        container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'ArrowRight') nextSlide();
        });

        // Pause on document hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearInterval(autoAdvance);
            } else {
                autoAdvance = setInterval(nextSlide, 5000);
            }
        });

        // Initial state
        showSlide(0);
    }
}

// Create singleton instance
const carouselService = new CarouselService();
export default carouselService;

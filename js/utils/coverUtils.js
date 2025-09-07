// Cover Utilities
import { resolveCoverUrl } from '../services/BookService.js';

/**
 * Generate text-based cover HTML for books without images
 */
export function generateTextCover(book) {
    if (!book) return '';
    
    const title = book.title || 'Untitled';
    const author = book.author || 'Unknown Author';
    const bgColor = stringToColor(title + author);
    const textColor = getContrastColor(bgColor);

    return `
        <div class="w-full h-full flex flex-col items-center justify-center text-center p-4"
             style="background-color: ${bgColor}; color: ${textColor}">
            <div class="font-medium text-sm mb-2 line-clamp-3">${title}</div>
            <div class="text-xs opacity-80">${author}</div>
        </div>
    `;
}

/**
 * Generate deterministic color from string
 */
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate dark, muted colors suitable for backgrounds
    const h = Math.abs(hash) % 360;
    const s = 25 + (Math.abs(hash >> 8) % 20); // 25-45% saturation
    const l = 25 + (Math.abs(hash >> 16) % 20); // 25-45% lightness
    
    return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Get contrasting text color (black or white) based on background
 */
function getContrastColor(hslStr) {
    // Extract lightness from HSL string
    const l = parseInt(hslStr.split(',')[2].split('%')[0]);
    return l > 50 ? '#1a1a1a' : '#ffffff';
}

/**
 * Create book card HTML with proper cover handling
 */
export async function createBookCard(book, options = {}) {
    const {
        showSaveButton = false,
        linkPrefix = 'book.html',
        extraClasses = '',
        lazyLoad = true
    } = options;

    const coverUrl = await resolveCoverUrl(book);
    const coverHtml = coverUrl 
        ? `<img src="${coverUrl}" 
               alt="${book.title}" 
               class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
               ${lazyLoad ? 'loading="lazy" decoding="async"' : ''}>`
        : generateTextCover(book);

    return `
        <div class="group ${extraClasses}">
            <div class="aspect-[3/4] bg-[#2F3835] rounded-lg overflow-hidden relative">
                ${coverHtml}
                ${showSaveButton ? `
                    <button data-book='${JSON.stringify(book).replace(/'/g, '&apos;')}' 
                            class="save-button absolute bottom-2 right-2 px-3 py-1 rounded-full text-xs 
                                   bg-forest-accent text-white hover:opacity-90">
                        Save
                    </button>
                ` : ''}
            </div>
            <a href="${linkPrefix}?id=${book.id}" class="block mt-2">
                <h3 class="font-medium text-sm text-white group-hover:text-forest-accent 
                          transition-colors duration-300 line-clamp-2">
                    ${book.title || 'Untitled'}
                </h3>
                <p class="text-xs text-white/60 mt-1">${book.author || 'Unknown Author'}</p>
            </a>
        </div>
    `;
}

/**
 * Create book grid HTML with proper cover handling
 */
export async function createBookGrid(books, options = {}) {
    const {
        containerClasses = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4',
        showSaveButtons = false,
        linkPrefix = 'book.html'
    } = options;

    if (!books || books.length === 0) {
        return `
            <div class="text-center py-8">
                <p class="text-white/60">No books found</p>
            </div>
        `;
    }

    const bookCards = await Promise.all(
        books.map(book => createBookCard(book, { showSaveButton: showSaveButtons, linkPrefix }))
    );

    return `
        <div class="${containerClasses}">
            ${bookCards.join('')}
        </div>
    `;
}

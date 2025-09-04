// Global Footer Component with Simple Browser Translate
class GlobalFooter {
  constructor() {
    this.init();
  }

  init() {
    // Create footer HTML
    this.createFooter();
  }

  createFooter() {
    // Check if footer already exists
    if (document.getElementById('global-footer')) return;

    const footer = document.createElement('footer');
    footer.id = 'global-footer';
    footer.className = 'bg-forest-card text-white mt-16 border-t border-forest-accent/20';
    footer.innerHTML = `
      <div class="container mx-auto px-6 py-12">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <!-- Brand & Translate -->
          <div class="space-y-4">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-forest-accent rounded-full flex items-center justify-center">
                <span class="text-white font-bold text-sm">NF</span>
              </div>
              <span class="text-xl font-bold notranslate">Noctua Forest</span>
            </div>
            <p class="text-forest-light/80 text-sm">
              Discover books by mood and share authentic reviews that power our community's recommendations.
            </p>
            
            <!-- Simple Browser Translate -->
            <div class="mt-4">
              <div class="text-sm text-forest-light/60 mb-2">Translate this page:</div>
              <div class="flex flex-wrap gap-2">
                <button onclick="window.open('https://translate.google.com/translate?u=' + encodeURIComponent(window.location.href) + '&sl=en&tl=es', '_blank')" 
                        class="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full transition-colors">
                  Español
                </button>
                <button onclick="window.open('https://translate.google.com/translate?u=' + encodeURIComponent(window.location.href) + '&sl=en&tl=fr', '_blank')" 
                        class="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full transition-colors">
                  Français
                </button>
                <button onclick="window.open('https://translate.google.com/translate?u=' + encodeURIComponent(window.location.href) + '&sl=en&tl=de', '_blank')" 
                        class="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full transition-colors">
                  Deutsch
                </button>
                <button onclick="window.open('https://translate.google.com/translate?u=' + encodeURIComponent(window.location.href) + '&sl=en&tl=zh', '_blank')" 
                        class="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full transition-colors">
                  中文
                </button>
                <button onclick="window.open('https://translate.google.com/translate?u=' + encodeURIComponent(window.location.href) + '&sl=en&tl=ja', '_blank')" 
                        class="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full transition-colors">
                  日本語
                </button>
                <button onclick="window.open('https://translate.google.com/translate?u=' + encodeURIComponent(window.location.href) + '&sl=en&tl=auto', '_blank')" 
                        class="text-xs bg-forest-accent hover:bg-[#E0751C] text-white px-3 py-1 rounded-full transition-colors">
                  More Languages →
                </button>
              </div>
            </div>
          </div>

          <!-- Community -->
          <div class="space-y-4">
            <h3 class="font-semibold text-lg">Community</h3>
            <ul class="space-y-2 text-sm">
              <li><a href="forest.html" class="text-forest-light/80 hover:text-forest-accent transition-colors">Discover Books</a></li>
              <li><a href="reviews.html" class="text-forest-light/80 hover:text-forest-accent transition-colors">Write a Review</a></li>
              <li><a href="list.html" class="text-forest-light/80 hover:text-forest-accent transition-colors">Reading Lists</a></li>
              <li><a href="about.html" class="text-forest-light/80 hover:text-forest-accent transition-colors">About</a></li>
            </ul>
          </div>

          <!-- Policies -->
          <div class="space-y-4">
            <h3 class="font-semibold text-lg">Policies</h3>
            <ul class="space-y-2 text-sm">
              <li><a href="review-policy.html" class="text-forest-light/80 hover:text-forest-accent transition-colors">Review Policy</a></li>
              <li><a href="content-policy.html" class="text-forest-light/80 hover:text-forest-accent transition-colors">Content Policy</a></li>
              <li><a href="privacy.html" class="text-forest-light/80 hover:text-forest-accent transition-colors">Privacy</a></li>
              <li><a href="terms.html" class="text-forest-light/80 hover:text-forest-accent transition-colors">Terms</a></li>
            </ul>
          </div>

          <!-- Support -->
          <div class="space-y-4">
            <h3 class="font-semibold text-lg">Support</h3>
            <ul class="space-y-2 text-sm">
              <li><a href="help.html" class="text-forest-light/80 hover:text-forest-accent transition-colors">Help Center</a></li>
              <li><a href="contact.html" class="text-forest-light/80 hover:text-forest-accent transition-colors">Contact</a></li>
              <li><a href="api-docs.html" class="text-forest-light/80 hover:text-forest-accent transition-colors">API</a></li>
            </ul>
            
            <!-- Affiliate Disclosure -->
            <div class="mt-4 pt-4 border-t border-forest-accent/20">
              <p class="text-xs text-forest-light/60">
                As an Amazon Associate, we earn from qualifying purchases. 
                <a href="affiliate-disclosure.html" class="text-forest-accent hover:underline">Learn more</a>
              </p>
            </div>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div class="mt-12 pt-8 border-t border-forest-accent/20 text-center">
          <p class="text-sm text-forest-light/60">
            © ${new Date().getFullYear()} Noctua Forest. All rights reserved.
          </p>
        </div>
      </div>
    `;

    // Insert footer before closing body tag
    const body = document.body;
    if (body) {
      body.appendChild(footer);
    }
  }
}

// Auto-initialize footer on pages that should have it
const shouldShowFooter = () => {
  const currentPath = window.location.pathname;
  const footerPages = ['/', '/welcome.html', '/forest.html', '/book.html', '/list.html', '/about.html', '/contact.html', '/privacy.html', '/terms.html', '/review-policy.html', '/content-policy.html'];
  
  return footerPages.some(page => 
    currentPath === page || 
    currentPath.endsWith(page) || 
    (page === '/' && currentPath === '/index.html')
  );
};

// Initialize footer if this page should have it
if (shouldShowFooter()) {
  document.addEventListener('DOMContentLoaded', () => {
    new GlobalFooter();
  });
}

// Export for manual use
window.GlobalFooter = GlobalFooter;
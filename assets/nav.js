// Mobile-only navigation toggle with accessibility and desktop guard
// Enhanced for Amazon PPC Agency site
(function(){
  function openNav(nav){
    nav.classList.remove('hidden');
    nav.classList.add('mobile-nav-open');
    const overlay = document.getElementById('navOverlay');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Update ARIA attributes
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
      mobileMenuBtn.setAttribute('aria-expanded', 'true');
    }
    
    // Close when clicking a link
    nav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ closeNav(nav); }, { once: true });
    });
  }

  function closeNav(nav){
    nav.classList.add('hidden');
    nav.classList.remove('mobile-nav-open');
    const overlay = document.getElementById('navOverlay');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // Update ARIA attributes
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
  }

  window.toggleMobileMenu = function(){
    if (window.innerWidth >= 768) return; // desktop guard
    const nav = document.getElementById('nav');
    if (!nav) return;
    const isHidden = nav.classList.contains('hidden');
    if (isHidden) openNav(nav); else closeNav(nav);
  }

  document.addEventListener('DOMContentLoaded', function(){
    const nav = document.getElementById('nav');

    // Remove inline handlers (CSP-safe) and bind programmatically
    document.querySelectorAll('button[onclick]')
      .forEach(function(button){
        const handler = button.getAttribute('onclick');
        if (handler && handler.replace(/\s+/g,'') === 'toggleMobileMenu()'){
          button.removeAttribute('onclick');
          button.addEventListener('click', function(){ toggleMobileMenu(); });
          button.addEventListener('touchend', function(e){ 
            if (window.innerWidth < 768){ 
              e.preventDefault(); 
              toggleMobileMenu(); 
            } 
          }, { passive: false });
        }
      });
      
    // Enhanced mobile menu button handling
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', function(){ toggleMobileMenu(); });
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
    
    const overlay = document.getElementById('navOverlay');
    if (overlay){
      overlay.addEventListener('click', function(){ if (nav) closeNav(nav); });
    }
    
    // Close on ESC
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && nav && !nav.classList.contains('hidden')) {
        closeNav(nav);
      }
    });
    
    // Reset on resize to desktop
    window.addEventListener('resize', function(){
      if (window.innerWidth >= 768 && nav){
        closeNav(nav);
      }
    });
    
    // Enhanced keyboard navigation
    nav.addEventListener('keydown', function(e) {
      const focusableElements = nav.querySelectorAll('a, button');
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    });
  });
})();

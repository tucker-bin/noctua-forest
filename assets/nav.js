// Mobile-only navigation toggle with accessibility and desktop guard
(function(){
  function openNav(nav){
    nav.classList.remove('hidden');
    nav.classList.add('mobile-nav-open');
    const overlay = document.getElementById('navOverlay');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
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
  }

  window.toggleMobileMenu = function(){
    if (window.innerWidth >= 768) return; // desktop guard
    const nav = document.getElementById('nav');
    if (!nav) return;
    const isHidden = nav.classList.contains('hidden');
    if (isHidden) openNav(nav); else closeNav(nav);
  }

  document.addEventListener('DOMContentLoaded', function(){
    const btn = document.querySelector('button[onclick="toggleMobileMenu()"]');
    const nav = document.getElementById('nav');
    if (btn){
      btn.addEventListener('touchend', function(e){ if (window.innerWidth < 768){ e.preventDefault(); toggleMobileMenu(); } }, { passive: false });
    }
    const overlay = document.getElementById('navOverlay');
    if (overlay){
      overlay.addEventListener('click', function(){ if (nav) closeNav(nav); });
    }
    // Close on ESC
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && nav && !nav.classList.contains('hidden')) closeNav(nav);
    });
    // Reset on resize to desktop
    window.addEventListener('resize', function(){
      if (window.innerWidth >= 768 && nav){
        closeNav(nav);
      }
    });
  });
})();



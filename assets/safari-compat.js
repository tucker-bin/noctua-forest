/**
 * Safari Compatibility Script
 * Fixes common Safari issues and provides fallbacks
 */

// Safari CSS fixes
(function() {
  'use strict';
  
  // Detect Safari
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  if (isSafari) {
    console.log('Safari detected, applying compatibility fixes');
    
    // Add Safari-specific CSS class
    document.documentElement.classList.add('safari');
    
    // Fix viewport height issues in Safari
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    window.addEventListener('resize', () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    });
  }
  
  // Polyfill for IntersectionObserver if not available
  if (!('IntersectionObserver' in window)) {
    console.warn('IntersectionObserver not supported, loading polyfill');
    const script = document.createElement('script');
    script.src = 'https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver';
    document.head.appendChild(script);
  }
  
  // Fix backdrop-filter support detection
  const testEl = document.createElement('div');
  testEl.style.backdropFilter = 'blur(1px)';
  if (!testEl.style.backdropFilter && !testEl.style.webkitBackdropFilter) {
    document.documentElement.classList.add('no-backdrop-filter');
  }
  
  // Font loading fallback for Safari
  if ('fonts' in document) {
    // Wait for fonts to load, with timeout
    Promise.race([
      document.fonts.ready,
      new Promise(resolve => setTimeout(resolve, 3000))
    ]).then(() => {
      document.documentElement.classList.add('fonts-loaded');
    });
  } else {
    // Fallback for older browsers
    setTimeout(() => {
      document.documentElement.classList.add('fonts-loaded');
    }, 1000);
  }
  
  // Fix iOS Safari scrolling issues
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    document.documentElement.classList.add('ios');
    
    // Fix iOS scroll momentum
    document.body.style.webkitOverflowScrolling = 'touch';
    
    // Fix iOS 100vh issue
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
  }
  
})();

// Enhanced error handling for Safari
window.addEventListener('error', (e) => {
  console.error('JavaScript error in Safari:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection in Safari:', e.reason);
});

/**
 * Simple Cookie Consent for Noctua Forest
 * GDPR/CCPA compliant cookie consent management
 */

(function() {
  'use strict';

  // Wait for DOM to be fully loaded
  function whenDOMReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  // Initialize when DOM is ready
  whenDOMReady(() => {
    // Ensure we have document.body
    if (!document.body) {
      console.warn('Cookie consent: document.body not available, retrying in 100ms');
      setTimeout(initCookieConsent, 100);
      return;
    }
    initCookieConsent();
  });

  function initCookieConsent() {
    // Check if user has already made a choice
    const hasConsent = localStorage.getItem('noctua-cookie-consent');
    
    if (hasConsent) {
      if (hasConsent === 'accepted') {
        enableAnalytics();
      }
      return; // Don't show banner again
    }
    
    // Create and show cookie consent banner
    createConsentBanner();
  }
  
  function createConsentBanner() {
    // Extra safety check for document.body
    if (!document.body) {
      console.warn('Cookie consent: document.body not available for banner');
      return;
    }

    // Check if banner already exists
    if (document.getElementById('cookie-consent-banner')) {
      return;
    }
    
    const banner = document.createElement('div');
    banner.id = 'cookie-consent-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(74, 84, 80, 0.98);
        color: white;
        padding: 16px 20px;
        z-index: 10000;
        border-top: 2px solid #F58220;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
      ">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 300px;">
            <p style="margin: 0; font-size: 14px; line-height: 1.4;">
              🍪 We use essential cookies for functionality and analytics to improve your experience. 
              <a href="privacy.html" style="color: #F9A825; text-decoration: underline;" target="_blank">Learn more</a>
            </p>
          </div>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button id="cookie-accept" style="
              background: #F58220;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              transition: background 0.3s ease;
            ">Accept All</button>
            <button id="cookie-essential" style="
              background: transparent;
              color: #E0E2DB;
              border: 1px solid #E0E2DB;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              transition: all 0.3s ease;
            ">Essential Only</button>
          </div>
        </div>
      </div>
    `;
    
    // Add banner to body
    document.body.appendChild(banner);
    
    // Get buttons after banner is in DOM
    const acceptBtn = document.getElementById('cookie-accept');
    const essentialBtn = document.getElementById('cookie-essential');
    
    if (acceptBtn) {
      acceptBtn.addEventListener('mouseenter', () => {
        acceptBtn.style.background = '#E0751C';
      });
      acceptBtn.addEventListener('mouseleave', () => {
        acceptBtn.style.background = '#F58220';
      });
      
      acceptBtn.addEventListener('click', () => {
        localStorage.setItem('noctua-cookie-consent', 'accepted');
        banner.remove();
        enableAnalytics();
        showConsentMessage('All cookies accepted. Analytics enabled.');
      });
    }
    
    if (essentialBtn) {
      essentialBtn.addEventListener('mouseenter', () => {
        essentialBtn.style.background = 'rgba(224, 226, 219, 0.1)';
      });
      essentialBtn.addEventListener('mouseleave', () => {
        essentialBtn.style.background = 'transparent';
      });
      
      essentialBtn.addEventListener('click', () => {
        localStorage.setItem('noctua-cookie-consent', 'essential');
        banner.remove();
        disableAnalytics();
        showConsentMessage('Only essential cookies enabled. Analytics disabled.');
      });
    }
  }
  
  function enableAnalytics() {
    if (typeof gtag === 'undefined') {
      console.warn('Cookie consent: gtag not available for enabling analytics');
      return;
    }
    gtag('consent', 'update', {
      'analytics_storage': 'granted'
    });
  }
  
  function disableAnalytics() {
    if (typeof gtag === 'undefined') {
      console.warn('Cookie consent: gtag not available for disabling analytics');
      return;
    }
    gtag('consent', 'update', {
      'analytics_storage': 'denied'
    });
  }
  
  function showConsentMessage(message) {
    // Extra safety check for document.body
    if (!document.body) {
      console.warn('Cookie consent: document.body not available for toast message');
      return;
    }
    
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4A5450;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10001;
        border-left: 4px solid #F58220;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 300px;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
      ">
        ${message}
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 300);
      }
    }, 3000);
  }
  
  // Export function to reset consent (for testing/development)
  window.resetCookieConsent = function() {
    localStorage.removeItem('noctua-cookie-consent');
    location.reload();
  };
})();
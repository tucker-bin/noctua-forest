import React, { useEffect } from 'react';
import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';
import { log } from '../../utils/logger';

export const WebVitalsMonitor: React.FC = () => {
  useEffect(() => {
    const sendToAnalytics = (metric: Metric) => {
      // Send to your analytics service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'web_vitals', {
          event_category: 'Performance',
          event_label: metric.name,
          value: Math.round(metric.value),
          custom_map: {
            metric_id: metric.id,
            metric_rating: metric.rating
          }
        });
      }

      // Log performance metrics
      log.performance(`Web Vital: ${metric.name}`, metric.value, {
        rating: metric.rating,
        metricId: metric.id,
        type: 'web_vital'
      });

      // Send to external monitoring service
      fetch('/api/metrics/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          id: metric.id
        })
      }).catch(error => {
        log.warn('Failed to send Web Vitals data to server', {
          metric: metric.name,
          error: error instanceof Error ? error.message : String(error)
        });
      });
    };

    // Measure and report Core Web Vitals
    onCLS(sendToAnalytics);
    onFID(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);

    log.info('Web Vitals monitoring initialized', {
      metrics: ['CLS', 'FID', 'FCP', 'LCP', 'TTFB']
    });

  }, []);

  // Custom performance monitoring
  useEffect(() => {
    const measureCustomMetrics = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          const metrics = {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            firstByte: navigation.responseStart - navigation.requestStart,
            domInteractive: navigation.domInteractive - navigation.fetchStart,
            totalPageLoad: navigation.loadEventEnd - navigation.fetchStart
          };

          // Send custom performance data
          fetch('/api/metrics/performance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...metrics,
              userAgent: navigator.userAgent,
              timestamp: Date.now(),
              url: window.location.pathname
            })
          }).catch(error => {
            log.warn('Failed to send custom performance data', {
              error: error instanceof Error ? error.message : String(error)
            });
          });

          log.performance('Page Load Metrics', metrics.totalPageLoad, {
            domContentLoaded: metrics.domContentLoaded,
            loadComplete: metrics.loadComplete,
            firstByte: metrics.firstByte,
            domInteractive: metrics.domInteractive,
            type: 'page_load'
          });
        }
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measureCustomMetrics();
    } else {
      window.addEventListener('load', measureCustomMetrics);
      return () => window.removeEventListener('load', measureCustomMetrics);
    }
  }, []);

  // Performance observer for additional metrics
  useEffect(() => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'measure') {
              log.performance(`Custom Measure: ${entry.name}`, entry.duration, {
                type: 'custom_measure'
              });
            }
          });
        });

        observer.observe({ entryTypes: ['measure'] });
        
        return () => observer.disconnect();
      } catch (error) {
        log.warn('Performance Observer setup failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }, []);

  return null; // This component doesn't render anything
}; 
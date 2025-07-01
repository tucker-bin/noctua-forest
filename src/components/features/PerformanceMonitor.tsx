import React, { useEffect, useState } from 'react';
import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  
  // Additional metrics
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  
  // Custom metrics
  loadTime: number | null;
  domInteractive: number | null;
  domComplete: number | null;
  
  // Bundle metrics
  bundleSize: number | null;
  chunkCount: number | null;
}

interface PerformanceReport {
  metrics: PerformanceMetrics;
  score: number;
  recommendations: string[];
  timestamp: number;
}

const PERFORMANCE_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 }
};

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    loadTime: null,
    domInteractive: null,
    domComplete: null,
    bundleSize: null,
    chunkCount: null
  });

  const [isCollecting, setIsCollecting] = useState(true);

  useEffect(() => {
    // Collect Core Web Vitals
    const collectMetrics = () => {
      onLCP((metric: Metric) => {
        setMetrics(prev => ({ ...prev, lcp: metric.value }));
      });

      onFID((metric: Metric) => {
        setMetrics(prev => ({ ...prev, fid: metric.value }));
      });

      onCLS((metric: Metric) => {
        setMetrics(prev => ({ ...prev, cls: metric.value }));
      });

      onFCP((metric: Metric) => {
        setMetrics(prev => ({ ...prev, fcp: metric.value }));
      });

      onTTFB((metric: Metric) => {
        setMetrics(prev => ({ ...prev, ttfb: metric.value }));
      });

      // Collect Navigation Timing metrics
      if (performance.timing) {
        const timing = performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domInteractive = timing.domInteractive - timing.navigationStart;
        const domComplete = timing.domComplete - timing.navigationStart;

        setMetrics(prev => ({
          ...prev,
          loadTime,
          domInteractive,
          domComplete
        }));
      }

      // Collect bundle information
      if (performance.getEntriesByType) {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const jsResources = resources.filter(r => r.name.includes('.js'));
        const totalSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
        
        setMetrics(prev => ({
          ...prev,
          bundleSize: totalSize,
          chunkCount: jsResources.length
        }));
      }
    };

    // Collect metrics after page load
    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
    }

    // Set timeout to stop collecting after reasonable time
    const timeout = setTimeout(() => {
      setIsCollecting(false);
    }, 10000); // 10 seconds

    return () => {
      window.removeEventListener('load', collectMetrics);
      clearTimeout(timeout);
    };
  }, []);

  const calculateScore = (metrics: PerformanceMetrics): number => {
    let score = 100;
    let validMetrics = 0;

    // Score LCP
    if (metrics.lcp !== null) {
      validMetrics++;
      if (metrics.lcp > PERFORMANCE_THRESHOLDS.lcp.poor) score -= 25;
      else if (metrics.lcp > PERFORMANCE_THRESHOLDS.lcp.good) score -= 10;
    }

    // Score FID
    if (metrics.fid !== null) {
      validMetrics++;
      if (metrics.fid > PERFORMANCE_THRESHOLDS.fid.poor) score -= 25;
      else if (metrics.fid > PERFORMANCE_THRESHOLDS.fid.good) score -= 10;
    }

    // Score CLS
    if (metrics.cls !== null) {
      validMetrics++;
      if (metrics.cls > PERFORMANCE_THRESHOLDS.cls.poor) score -= 25;
      else if (metrics.cls > PERFORMANCE_THRESHOLDS.cls.good) score -= 10;
    }

    // Score FCP
    if (metrics.fcp !== null) {
      validMetrics++;
      if (metrics.fcp > PERFORMANCE_THRESHOLDS.fcp.poor) score -= 15;
      else if (metrics.fcp > PERFORMANCE_THRESHOLDS.fcp.good) score -= 5;
    }

    return validMetrics > 0 ? Math.max(0, score) : 0;
  };

  const generateRecommendations = (metrics: PerformanceMetrics): string[] => {
    const recommendations: string[] = [];

    if (metrics.lcp && metrics.lcp > PERFORMANCE_THRESHOLDS.lcp.good) {
      recommendations.push('Optimize Largest Contentful Paint by reducing image sizes and improving server response times');
    }

    if (metrics.fid && metrics.fid > PERFORMANCE_THRESHOLDS.fid.good) {
      recommendations.push('Reduce First Input Delay by optimizing JavaScript execution and reducing main thread blocking');
    }

    if (metrics.cls && metrics.cls > PERFORMANCE_THRESHOLDS.cls.good) {
      recommendations.push('Improve Cumulative Layout Shift by adding size attributes to images and avoiding dynamic content insertion');
    }

    if (metrics.bundleSize && metrics.bundleSize > 500000) { // 500KB
      recommendations.push('Reduce bundle size through code splitting and tree shaking');
    }

    if (metrics.chunkCount && metrics.chunkCount > 10) {
      recommendations.push('Consider consolidating small chunks to reduce HTTP requests');
    }

    if (metrics.loadTime && metrics.loadTime > 3000) {
      recommendations.push('Optimize overall load time through caching and CDN usage');
    }

    return recommendations;
  };

  const generateReport = (): PerformanceReport => {
    const score = calculateScore(metrics);
    const recommendations = generateRecommendations(metrics);
    
    return {
      metrics,
      score,
      recommendations,
      timestamp: Date.now()
    };
  };

  // Send metrics to analytics (in production)
  useEffect(() => {
    if (!isCollecting && process.env.NODE_ENV === 'production') {
      const report = generateReport();
      
      // Send to analytics service
      if (window.gtag) {
        window.gtag('event', 'performance_metrics', {
          custom_map: {
            lcp: report.metrics.lcp,
            fid: report.metrics.fid,
            cls: report.metrics.cls,
            score: report.score
          }
        });
      }

      // Log to console in development
      console.log('🚀 Performance Report:', report);
    }
  }, [isCollecting, metrics]);

  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const report = generateReport();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        maxWidth: '300px',
        border: `2px solid ${report.score > 80 ? '#4CAF50' : report.score > 60 ? '#FF9800' : '#F44336'}`
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        Performance Score: {report.score}/100
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <div>LCP: {metrics.lcp ? `${metrics.lcp.toFixed(0)}ms` : 'Measuring...'}</div>
        <div>FID: {metrics.fid ? `${metrics.fid.toFixed(0)}ms` : 'Measuring...'}</div>
        <div>CLS: {metrics.cls ? metrics.cls.toFixed(3) : 'Measuring...'}</div>
        <div>Bundle: {metrics.bundleSize ? `${(metrics.bundleSize / 1024).toFixed(0)}KB` : 'Calculating...'}</div>
      </div>

      {report.recommendations.length > 0 && (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Recommendations:</div>
          {report.recommendations.slice(0, 2).map((rec, index) => (
            <div key={index} style={{ fontSize: '10px', marginBottom: '2px' }}>
              • {rec.substring(0, 50)}...
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor; 
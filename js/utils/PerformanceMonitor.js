/**
 * Performance Monitoring System
 * Tracks and optimizes website performance metrics
 */

export class PerformanceMonitor {
    static instance = null;
    
    constructor() {
        if (PerformanceMonitor.instance) {
            return PerformanceMonitor.instance;
        }
        
        this.metrics = new Map();
        this.observers = new Map();
        this.thresholds = {
            lcp: 2500, // Largest Contentful Paint
            fid: 100,  // First Input Delay
            cls: 0.1,  // Cumulative Layout Shift
            fcp: 1800, // First Contentful Paint
            ttfb: 600  // Time to First Byte
        };
        
        this.init();
        PerformanceMonitor.instance = this;
    }
    
    /**
     * Initialize performance monitoring
     */
    init() {
        if (!this.isSupported()) {
            console.warn('Performance monitoring not supported in this browser');
            return;
        }
        
        this.setupCoreWebVitals();
        this.setupResourceMonitoring();
        this.setupNavigationTiming();
        this.setupMemoryMonitoring();
        this.setupCustomMetrics();
        
        // Report metrics when page is about to unload
        window.addEventListener('beforeunload', () => {
            this.reportMetrics();
        });
        
        // Report metrics on visibility change (for SPA navigation)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.reportMetrics();
            }
        });
    }
    
    /**
     * Check if performance monitoring is supported
     * @returns {boolean} Support status
     */
    isSupported() {
        return 'performance' in window && 'PerformanceObserver' in window;
    }
    
    /**
     * Setup Core Web Vitals monitoring
     */
    setupCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        this.observeMetric('largest-contentful-paint', (entries) => {
            const lcp = entries[entries.length - 1];
            this.recordMetric('lcp', lcp.startTime, {
                element: lcp.element?.tagName || 'unknown',
                url: lcp.url || window.location.href
            });
        });
        
        // First Input Delay (FID)
        this.observeMetric('first-input', (entries) => {
            const fid = entries[0];
            this.recordMetric('fid', fid.processingStart - fid.startTime, {
                eventType: fid.name,
                target: fid.target?.tagName || 'unknown'
            });
        });
        
        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        this.observeMetric('layout-shift', (entries) => {
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            this.recordMetric('cls', clsValue);
        });
        
        // First Contentful Paint (FCP)
        this.observeMetric('paint', (entries) => {
            entries.forEach(entry => {
                if (entry.name === 'first-contentful-paint') {
                    this.recordMetric('fcp', entry.startTime);
                }
            });
        });
    }
    
    /**
     * Setup resource monitoring
     */
    setupResourceMonitoring() {
        this.observeMetric('resource', (entries) => {
            entries.forEach(entry => {
                const resourceType = entry.initiatorType;
                const loadTime = entry.responseEnd - entry.startTime;
                const size = entry.transferSize || 0;
                
                this.recordMetric(`resource_${resourceType}`, loadTime, {
                    name: entry.name,
                    size,
                    cached: entry.transferSize === 0 && entry.decodedBodySize > 0
                });
                
                // Track slow resources
                if (loadTime > 1000) {
                    this.recordMetric('slow_resource', loadTime, {
                        name: entry.name,
                        type: resourceType,
                        size
                    });
                }
            });
        });
    }
    
    /**
     * Setup navigation timing
     */
    setupNavigationTiming() {
        this.observeMetric('navigation', (entries) => {
            const nav = entries[0];
            
            // Time to First Byte
            const ttfb = nav.responseStart - nav.requestStart;
            this.recordMetric('ttfb', ttfb);
            
            // DOM Content Loaded
            const dcl = nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart;
            this.recordMetric('dom_content_loaded', dcl);
            
            // Load Event
            const loadEvent = nav.loadEventEnd - nav.loadEventStart;
            this.recordMetric('load_event', loadEvent);
            
            // Total Page Load Time
            const totalLoad = nav.loadEventEnd - nav.fetchStart;
            this.recordMetric('total_load_time', totalLoad);
        });
    }
    
    /**
     * Setup memory monitoring
     */
    setupMemoryMonitoring() {
        if ('memory' in performance) {
            const checkMemory = () => {
                const memory = performance.memory;
                this.recordMetric('memory_used', memory.usedJSHeapSize, {
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit,
                    usage_percent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
                });
            };
            
            // Check memory every 30 seconds
            setInterval(checkMemory, 30000);
            checkMemory(); // Initial check
        }
    }
    
    /**
     * Setup custom application metrics
     */
    setupCustomMetrics() {
        // Track form interactions
        document.addEventListener('submit', (event) => {
            const formId = event.target.id || 'unknown';
            this.recordMetric('form_submission', performance.now(), {
                form: formId,
                fields: event.target.elements.length
            });
        });
        
        // Track navigation clicks
        document.addEventListener('click', (event) => {
            if (event.target.matches('a[href]')) {
                this.recordMetric('navigation_click', performance.now(), {
                    href: event.target.href,
                    text: event.target.textContent?.trim() || 'no text'
                });
            }
        });
        
        // Track scroll depth
        let maxScrollDepth = 0;
        const trackScrollDepth = () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            if (scrollPercent > maxScrollDepth) {
                maxScrollDepth = scrollPercent;
                this.recordMetric('scroll_depth', maxScrollDepth);
            }
        };
        
        window.addEventListener('scroll', this.throttle(trackScrollDepth, 1000));
    }
    
    /**
     * Observe performance metric
     * @param {string} type - Metric type
     * @param {Function} callback - Callback function
     */
    observeMetric(type, callback) {
        try {
            const observer = new PerformanceObserver((list) => {
                callback(list.getEntries());
            });
            
            observer.observe({ type, buffered: true });
            this.observers.set(type, observer);
        } catch (error) {
            console.warn(`Failed to observe ${type} metrics:`, error);
        }
    }
    
    /**
     * Record a performance metric
     * @param {string} name - Metric name
     * @param {number} value - Metric value
     * @param {Object} metadata - Additional metadata
     */
    recordMetric(name, value, metadata = {}) {
        const metric = {
            name,
            value,
            timestamp: Date.now(),
            url: window.location.href,
            metadata
        };
        
        // Store metric
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name).push(metric);
        
        // Check thresholds and warn if exceeded
        this.checkThreshold(name, value);
        
        // Dispatch custom event
        this.dispatchMetricEvent(metric);
    }
    
    /**
     * Check if metric exceeds threshold
     * @param {string} name - Metric name
     * @param {number} value - Metric value
     */
    checkThreshold(name, value) {
        const threshold = this.thresholds[name];
        if (threshold && value > threshold) {
            console.warn(`Performance threshold exceeded for ${name}: ${value}ms (threshold: ${threshold}ms)`);
            
            this.recordMetric('threshold_exceeded', value, {
                metric: name,
                threshold,
                excess: value - threshold
            });
        }
    }
    
    /**
     * Dispatch metric event for other parts of the application
     * @param {Object} metric - Metric data
     */
    dispatchMetricEvent(metric) {
        const event = new CustomEvent('nf:performance', {
            detail: metric
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Get performance summary
     * @returns {Object} Performance summary
     */
    getSummary() {
        const summary = {};
        
        this.metrics.forEach((values, name) => {
            const numericValues = values.map(v => v.value).filter(v => typeof v === 'number');
            
            if (numericValues.length > 0) {
                summary[name] = {
                    count: values.length,
                    min: Math.min(...numericValues),
                    max: Math.max(...numericValues),
                    avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
                    latest: values[values.length - 1].value,
                    threshold: this.thresholds[name] || null,
                    exceedsThreshold: this.thresholds[name] ? 
                        values[values.length - 1].value > this.thresholds[name] : false
                };
            }
        });
        
        return summary;
    }
    
    /**
     * Get detailed metrics for a specific type
     * @param {string} name - Metric name
     * @returns {Array} Metric entries
     */
    getMetrics(name) {
        return this.metrics.get(name) || [];
    }
    
    /**
     * Report metrics to analytics service
     */
    async reportMetrics() {
        const summary = this.getSummary();
        
        // Send to analytics (replace with your analytics service)
        if (typeof gtag !== 'undefined') {
            Object.entries(summary).forEach(([name, data]) => {
                gtag('event', 'performance_metric', {
                    metric_name: name,
                    metric_value: Math.round(data.latest),
                    exceeds_threshold: data.exceedsThreshold
                });
            });
        }
        
        // Send to custom endpoint
        try {
            await fetch('/api/performance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: window.location.href,
                    timestamp: Date.now(),
                    metrics: summary,
                    userAgent: navigator.userAgent
                })
            });
        } catch (error) {
            console.warn('Failed to report performance metrics:', error);
        }
    }
    
    /**
     * Start timing a custom operation
     * @param {string} name - Operation name
     * @returns {Function} End timing function
     */
    startTiming(name) {
        const startTime = performance.now();
        
        return (metadata = {}) => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            this.recordMetric(`custom_${name}`, duration, metadata);
            return duration;
        };
    }
    
    /**
     * Measure function execution time
     * @param {string} name - Measurement name
     * @param {Function} fn - Function to measure
     * @returns {*} Function result
     */
    async measureFunction(name, fn) {
        const endTiming = this.startTiming(name);
        
        try {
            const result = await fn();
            endTiming({ success: true });
            return result;
        } catch (error) {
            endTiming({ success: false, error: error.message });
            throw error;
        }
    }
    
    /**
     * Throttle function execution
     * @param {Function} func - Function to throttle
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        
        return function (...args) {
            const currentTime = Date.now();
            
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    }
    
    /**
     * Get performance grade based on Core Web Vitals
     * @returns {Object} Performance grade
     */
    getPerformanceGrade() {
        const summary = this.getSummary();
        const grades = {};
        let overallScore = 0;
        let totalMetrics = 0;
        
        // Grade Core Web Vitals
        const coreMetrics = ['lcp', 'fid', 'cls', 'fcp', 'ttfb'];
        
        coreMetrics.forEach(metric => {
            if (summary[metric]) {
                const value = summary[metric].latest;
                const threshold = this.thresholds[metric];
                
                let grade, score;
                if (metric === 'cls') {
                    // CLS is measured differently (lower is better)
                    if (value <= 0.1) { grade = 'A'; score = 90; }
                    else if (value <= 0.25) { grade = 'B'; score = 70; }
                    else { grade = 'C'; score = 50; }
                } else {
                    // Time-based metrics
                    const ratio = value / threshold;
                    if (ratio <= 0.5) { grade = 'A'; score = 90; }
                    else if (ratio <= 1) { grade = 'B'; score = 70; }
                    else if (ratio <= 2) { grade = 'C'; score = 50; }
                    else { grade = 'D'; score = 30; }
                }
                
                grades[metric] = { grade, score, value, threshold };
                overallScore += score;
                totalMetrics++;
            }
        });
        
        const averageScore = totalMetrics > 0 ? overallScore / totalMetrics : 0;
        let overallGrade;
        if (averageScore >= 80) overallGrade = 'A';
        else if (averageScore >= 60) overallGrade = 'B';
        else if (averageScore >= 40) overallGrade = 'C';
        else overallGrade = 'D';
        
        return {
            overall: { grade: overallGrade, score: Math.round(averageScore) },
            metrics: grades
        };
    }
    
    /**
     * Clear all metrics
     */
    clearMetrics() {
        this.metrics.clear();
    }
    
    /**
     * Disconnect all observers
     */
    disconnect() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

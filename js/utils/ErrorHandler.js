/**
 * Centralized Error Handling System
 * Provides consistent error handling, logging, and user feedback
 */

export class ErrorHandler {
    static instance = null;
    
    constructor() {
        if (ErrorHandler.instance) {
            return ErrorHandler.instance;
        }
        
        this.errorQueue = [];
        this.maxQueueSize = 100;
        this.isOnline = navigator.onLine;
        this.retryAttempts = 3;
        
        this.setupGlobalErrorHandling();
        this.setupNetworkMonitoring();
        
        ErrorHandler.instance = this;
    }
    
    /**
     * Setup global error handling
     */
    setupGlobalErrorHandling() {
        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                stack: event.error?.stack
            });
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                error: event.reason,
                stack: event.reason?.stack
            });
        });
        
        // Handle resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError({
                    type: 'resource',
                    message: `Failed to load resource: ${event.target.src || event.target.href}`,
                    element: event.target.tagName,
                    source: event.target.src || event.target.href
                });
            }
        }, true);
    }
    
    /**
     * Setup network monitoring
     */
    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processErrorQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }
    
    /**
     * Handle error with appropriate logging and user feedback
     * @param {Object} errorInfo - Error information
     * @param {Object} options - Handling options
     */
    handleError(errorInfo, options = {}) {
        const {
            showToUser = false,
            userMessage = 'An unexpected error occurred. Please try again.',
            logLevel = 'error',
            category = 'general',
            metadata = {}
        } = options;
        
        // Enhance error info
        const enhancedError = this.enhanceErrorInfo(errorInfo, metadata);
        
        // Log error
        this.logError(enhancedError, logLevel);
        
        // Queue for remote logging if offline
        if (!this.isOnline) {
            this.queueError(enhancedError);
        } else {
            this.sendErrorToRemote(enhancedError);
        }
        
        // Show user feedback if requested
        if (showToUser) {
            this.showUserError(userMessage, enhancedError.severity);
        }
        
        // Trigger error event for other parts of the application
        this.dispatchErrorEvent(enhancedError);
    }
    
    /**
     * Enhance error information with context
     * @param {Object} errorInfo - Original error info
     * @param {Object} metadata - Additional metadata
     * @returns {Object} Enhanced error info
     */
    enhanceErrorInfo(errorInfo, metadata) {
        return {
            ...errorInfo,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            severity: this.determineSeverity(errorInfo),
            sessionId: this.getSessionId(),
            userId: this.getUserId(),
            metadata: {
                ...metadata,
                isOnline: this.isOnline,
                performance: this.getPerformanceMetrics()
            }
        };
    }
    
    /**
     * Determine error severity
     * @param {Object} errorInfo - Error information
     * @returns {string} Severity level
     */
    determineSeverity(errorInfo) {
        if (errorInfo.type === 'resource') {
            return 'warning';
        }
        
        if (errorInfo.message?.includes('Network Error') || 
            errorInfo.message?.includes('Failed to fetch')) {
            return 'warning';
        }
        
        if (errorInfo.type === 'promise' || errorInfo.type === 'javascript') {
            return 'error';
        }
        
        return 'info';
    }
    
    /**
     * Log error to console with appropriate level
     * @param {Object} errorInfo - Error information
     * @param {string} logLevel - Log level
     */
    logError(errorInfo, logLevel) {
        const logMethod = console[logLevel] || console.error;
        
        logMethod.call(console, 
            `[${errorInfo.severity.toUpperCase()}] ${errorInfo.type}: ${errorInfo.message}`,
            errorInfo
        );
    }
    
    /**
     * Queue error for later processing when online
     * @param {Object} errorInfo - Error information
     */
    queueError(errorInfo) {
        if (this.errorQueue.length >= this.maxQueueSize) {
            this.errorQueue.shift(); // Remove oldest error
        }
        
        this.errorQueue.push(errorInfo);
        
        // Store in localStorage for persistence
        try {
            localStorage.setItem('nf_error_queue', JSON.stringify(this.errorQueue));
        } catch (e) {
            console.warn('Failed to store error queue in localStorage:', e);
        }
    }
    
    /**
     * Process queued errors when back online
     */
    async processErrorQueue() {
        if (this.errorQueue.length === 0) return;
        
        const errors = [...this.errorQueue];
        this.errorQueue = [];
        
        try {
            await Promise.all(errors.map(error => this.sendErrorToRemote(error)));
            localStorage.removeItem('nf_error_queue');
        } catch (e) {
            // Re-queue errors if sending fails
            this.errorQueue = [...errors, ...this.errorQueue];
            console.warn('Failed to process error queue:', e);
        }
    }
    
    /**
     * Send error to remote logging service
     * @param {Object} errorInfo - Error information
     */
    async sendErrorToRemote(errorInfo) {
        try {
            // In production, replace with actual error reporting service
            // e.g., Sentry, LogRocket, or custom endpoint
            
            const response = await fetch('/api/errors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(errorInfo)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (e) {
            // Fallback: queue for retry
            this.queueError(errorInfo);
            console.warn('Failed to send error to remote service:', e);
        }
    }
    
    /**
     * Show user-friendly error message
     * @param {string} message - User message
     * @param {string} severity - Error severity
     */
    showUserError(message, severity = 'error') {
        // Create or update error notification
        let notification = document.getElementById('error-notification');
        
        if (!notification) {
            notification = this.createErrorNotification();
        }
        
        const severityClasses = {
            error: 'bg-red-50 text-red-700 border-red-200',
            warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            info: 'bg-blue-50 text-blue-700 border-blue-200'
        };
        
        notification.className = `fixed top-4 right-4 p-4 rounded-lg border z-50 max-w-sm shadow-lg ${severityClasses[severity] || severityClasses.error}`;
        notification.textContent = message;
        notification.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
    }
    
    /**
     * Create error notification element
     * @returns {HTMLElement} Notification element
     */
    createErrorNotification() {
        const notification = document.createElement('div');
        notification.id = 'error-notification';
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        notification.style.display = 'none';
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.className = 'float-right ml-2 text-xl leading-none';
        closeBtn.onclick = () => notification.style.display = 'none';
        closeBtn.setAttribute('aria-label', 'Close notification');
        
        notification.appendChild(closeBtn);
        document.body.appendChild(notification);
        
        return notification;
    }
    
    /**
     * Dispatch custom error event
     * @param {Object} errorInfo - Error information
     */
    dispatchErrorEvent(errorInfo) {
        const event = new CustomEvent('nf:error', {
            detail: errorInfo
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Get session ID (implement based on your session management)
     * @returns {string} Session ID
     */
    getSessionId() {
        return sessionStorage.getItem('nf_session_id') || 'anonymous';
    }
    
    /**
     * Get user ID (implement based on your authentication system)
     * @returns {string} User ID
     */
    getUserId() {
        return localStorage.getItem('nf_user_id') || 'anonymous';
    }
    
    /**
     * Get basic performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        if (!window.performance) return {};
        
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
            loadTime: navigation?.loadEventEnd - navigation?.fetchStart,
            domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.fetchStart,
            memoryUsage: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null
        };
    }
    
    /**
     * Handle API errors specifically
     * @param {Error} error - API error
     * @param {string} endpoint - API endpoint
     * @param {Object} requestData - Request data
     */
    handleAPIError(error, endpoint, requestData = {}) {
        this.handleError({
            type: 'api',
            message: error.message,
            endpoint,
            requestData: this.sanitizeRequestData(requestData),
            status: error.status || 'unknown',
            error
        }, {
            showToUser: true,
            userMessage: this.getAPIErrorMessage(error),
            category: 'api'
        });
    }
    
    /**
     * Sanitize request data for logging (remove sensitive info)
     * @param {Object} data - Request data
     * @returns {Object} Sanitized data
     */
    sanitizeRequestData(data) {
        const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
        const sanitized = { ...data };
        
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });
        
        return sanitized;
    }
    
    /**
     * Get user-friendly API error message
     * @param {Error} error - API error
     * @returns {string} User-friendly message
     */
    getAPIErrorMessage(error) {
        if (error.status === 404) {
            return 'The requested resource was not found.';
        }
        if (error.status === 500) {
            return 'Server error. Please try again later.';
        }
        if (error.status === 429) {
            return 'Too many requests. Please wait a moment and try again.';
        }
        if (!navigator.onLine) {
            return 'You appear to be offline. Please check your connection.';
        }
        
        return 'An error occurred. Please try again.';
    }
    
    /**
     * Handle form validation errors
     * @param {Object} validationErrors - Validation errors
     * @param {HTMLFormElement} form - Form element
     */
    handleValidationErrors(validationErrors, form) {
        Object.entries(validationErrors).forEach(([field, message]) => {
            const fieldElement = form.querySelector(`[name="${field}"]`);
            const errorElement = form.querySelector(`#${field}-error`);
            
            if (fieldElement) {
                fieldElement.classList.add('error');
                fieldElement.setAttribute('aria-invalid', 'true');
            }
            
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.classList.remove('hidden');
            }
        });
    }
    
    /**
     * Clear all error states
     */
    clearErrors() {
        // Clear form errors
        document.querySelectorAll('.error').forEach(element => {
            element.classList.remove('error');
            element.removeAttribute('aria-invalid');
        });
        
        document.querySelectorAll('.error-message').forEach(element => {
            element.classList.add('hidden');
        });
        
        // Hide notification
        const notification = document.getElementById('error-notification');
        if (notification) {
            notification.style.display = 'none';
        }
    }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Load queued errors from localStorage on initialization
try {
    const queuedErrors = localStorage.getItem('nf_error_queue');
    if (queuedErrors) {
        errorHandler.errorQueue = JSON.parse(queuedErrors);
        if (navigator.onLine) {
            errorHandler.processErrorQueue();
        }
    }
} catch (e) {
    console.warn('Failed to load error queue from localStorage:', e);
}

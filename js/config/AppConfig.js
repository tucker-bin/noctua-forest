/**
 * Application Configuration
 * Centralized configuration management for the Noctua Forest website
 */

export class AppConfig {
    static instance = null;
    
    constructor() {
        if (AppConfig.instance) {
            return AppConfig.instance;
        }
        
        this.config = {
            // API Configuration
            api: {
                baseUrl: this.getEnvironmentVariable('API_BASE_URL', 'https://api.noctuaforest.com'),
                timeout: 10000,
                retryAttempts: 3
            },
            
            // Contact Configuration
            contact: {
                email: 'support@noctuaforest.com',
                phone: '+1-555-NOCTUA',
                responseTime: '24 hours'
            },
            
            // Analytics Configuration
            analytics: {
                enabled: this.getEnvironmentVariable('ANALYTICS_ENABLED', 'true') === 'true',
                trackingId: this.getEnvironmentVariable('GA_TRACKING_ID', ''),
                debug: this.getEnvironmentVariable('ANALYTICS_DEBUG', 'false') === 'true'
            },
            
            // Form Configuration
            forms: {
                contactForm: {
                    endpoint: this.getEnvironmentVariable('CONTACT_FORM_ENDPOINT', '/api/contact'),
                    maxFileSize: 5 * 1024 * 1024, // 5MB
                    allowedFileTypes: ['pdf', 'doc', 'docx'],
                    honeypotField: 'website'
                }
            },
            
            // Performance Configuration
            performance: {
                enableServiceWorker: true,
                enableImageLazyLoading: true,
                enableResourcePrefetching: true,
                criticalResourceTimeout: 3000
            },
            
            // Security Configuration
            security: {
                enableCSP: true,
                enableXSSProtection: true,
                enableClickjacking: true,
                trustedDomains: [
                    'noctuaforest.com',
                    'fonts.googleapis.com',
                    'fonts.gstatic.com'
                ]
            },
            
            // Feature Flags
            features: {
                enableChatWidget: this.getEnvironmentVariable('ENABLE_CHAT', 'false') === 'true',
                enableA11yEnhancements: true,
                enablePerformanceMonitoring: true,
                enableErrorTracking: true
            },
            
            // Educational Market Specific Configuration
            education: {
                specializations: [
                    'academic-author',
                    'textbook-author',
                    'k12-educator',
                    'educational-toy-seller',
                    'stem-product-creator',
                    'educational-publisher'
                ],
                complianceStandards: [
                    'COPPA',
                    'CPSC',
                    'ASTM',
                    'Common Core',
                    'NGSS'
                ],
                budgetRanges: [
                    { value: 'under-500', label: 'Under $500/month' },
                    { value: '500-1000', label: '$500 - $1,000/month' },
                    { value: '1000-2500', label: '$1,000 - $2,500/month' },
                    { value: '2500-5000', label: '$2,500 - $5,000/month' },
                    { value: 'over-5000', label: 'Over $5,000/month' }
                ]
            }
        };
        
        AppConfig.instance = this;
    }
    
    /**
     * Get configuration value by path
     * @param {string} path - Dot notation path (e.g., 'api.baseUrl')
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Configuration value
     */
    get(path, defaultValue = null) {
        return this.getNestedValue(this.config, path, defaultValue);
    }
    
    /**
     * Set configuration value by path
     * @param {string} path - Dot notation path
     * @param {*} value - Value to set
     */
    set(path, value) {
        this.setNestedValue(this.config, path, value);
    }
    
    /**
     * Get environment variable with fallback
     * @param {string} name - Environment variable name
     * @param {string} defaultValue - Default value
     * @returns {string} Environment variable value
     */
    getEnvironmentVariable(name, defaultValue = '') {
        // In a real application, this would read from process.env or similar
        // For client-side, we might read from data attributes or global variables
        if (typeof window !== 'undefined' && window.APP_CONFIG) {
            return window.APP_CONFIG[name] || defaultValue;
        }
        return defaultValue;
    }
    
    /**
     * Get nested object value by dot notation path
     * @param {Object} obj - Object to search
     * @param {string} path - Dot notation path
     * @param {*} defaultValue - Default value
     * @returns {*} Found value or default
     */
    getNestedValue(obj, path, defaultValue) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : defaultValue;
        }, obj);
    }
    
    /**
     * Set nested object value by dot notation path
     * @param {Object} obj - Object to modify
     * @param {string} path - Dot notation path
     * @param {*} value - Value to set
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        target[lastKey] = value;
    }
    
    /**
     * Validate configuration
     * @returns {Object} Validation result
     */
    validate() {
        const errors = [];
        const warnings = [];
        
        // Validate required configurations
        if (!this.get('contact.email')) {
            errors.push('Contact email is required');
        }
        
        if (!this.get('api.baseUrl')) {
            errors.push('API base URL is required');
        }
        
        // Validate email format
        const email = this.get('contact.email');
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('Contact email format is invalid');
        }
        
        // Check for development configurations in production
        if (this.isProduction() && this.get('analytics.debug')) {
            warnings.push('Analytics debug mode is enabled in production');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    /**
     * Check if running in production environment
     * @returns {boolean} True if production
     */
    isProduction() {
        return this.getEnvironmentVariable('NODE_ENV', 'development') === 'production';
    }
    
    /**
     * Check if running in development environment
     * @returns {boolean} True if development
     */
    isDevelopment() {
        return !this.isProduction();
    }
    
    /**
     * Get all configuration as read-only object
     * @returns {Object} Configuration object
     */
    getAll() {
        return Object.freeze(JSON.parse(JSON.stringify(this.config)));
    }
    
    /**
     * Reset configuration to defaults
     */
    reset() {
        AppConfig.instance = null;
        return new AppConfig();
    }
}

// Export singleton instance
export const config = new AppConfig();

// Validate configuration on load
const validation = config.validate();
if (!validation.isValid) {
    console.error('Configuration validation failed:', validation.errors);
}
if (validation.warnings.length > 0) {
    console.warn('Configuration warnings:', validation.warnings);
}

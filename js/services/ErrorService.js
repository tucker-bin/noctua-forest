// Error Service
class ErrorService {
    constructor() {
        this.errorContainers = new Map();
        this.loadingContainers = new Map();
    }

    /**
     * Create an error boundary container
     */
    createErrorBoundary(containerId, options = {}) {
        const {
            loadingMessage = 'Loading...',
            errorMessage = 'An error occurred. Please try again.',
            retryButton = true,
            loadingSpinner = true
        } = options;

        const container = document.getElementById(containerId);
        if (!container) return;

        // Create loading state
        const loadingState = document.createElement('div');
        loadingState.className = 'text-center py-8 hidden';
        loadingState.innerHTML = `
            ${loadingSpinner ? `
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-forest-accent mb-4"></div>
            ` : ''}
            <p class="text-forest-text-muted">${loadingMessage}</p>
        `;

        // Create error state
        const errorState = document.createElement('div');
        errorState.className = 'text-center py-8 hidden';
        errorState.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                <h3 class="text-lg font-semibold text-red-800 mb-2">Error</h3>
                <p class="text-red-600 mb-4">${errorMessage}</p>
                ${retryButton ? `
                    <button class="retry-button px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        Try Again
                    </button>
                ` : ''}
            </div>
        `;

        // Store references
        this.errorContainers.set(containerId, errorState);
        this.loadingContainers.set(containerId, loadingState);

        // Add to DOM
        container.appendChild(loadingState);
        container.appendChild(errorState);

        return {
            showLoading: () => this.showLoading(containerId),
            showError: (error) => this.showError(containerId, error),
            hideAll: () => this.hideAll(containerId),
            setRetryHandler: (handler) => this.setRetryHandler(containerId, handler)
        };
    }

    /**
     * Show loading state for a container
     */
    showLoading(containerId) {
        const loadingState = this.loadingContainers.get(containerId);
        const errorState = this.errorContainers.get(containerId);
        
        if (loadingState) {
            loadingState.classList.remove('hidden');
        }
        if (errorState) {
            errorState.classList.add('hidden');
        }
    }

    /**
     * Show error state for a container
     */
    showError(containerId, error) {
        const loadingState = this.loadingContainers.get(containerId);
        const errorState = this.errorContainers.get(containerId);
        
        if (loadingState) {
            loadingState.classList.add('hidden');
        }
        if (errorState) {
            errorState.classList.remove('hidden');
            const message = errorState.querySelector('p');
            if (message && error) {
                message.textContent = error.message || 'An error occurred. Please try again.';
            }
        }
    }

    /**
     * Hide all states for a container
     */
    hideAll(containerId) {
        const loadingState = this.loadingContainers.get(containerId);
        const errorState = this.errorContainers.get(containerId);
        
        if (loadingState) {
            loadingState.classList.add('hidden');
        }
        if (errorState) {
            errorState.classList.add('hidden');
        }
    }

    /**
     * Set retry handler for a container
     */
    setRetryHandler(containerId, handler) {
        const errorState = this.errorContainers.get(containerId);
        if (!errorState) return;

        const retryButton = errorState.querySelector('.retry-button');
        if (retryButton && handler) {
            retryButton.onclick = () => {
                this.hideAll(containerId);
                handler();
            };
        }
    }

    /**
     * Create a loading wrapper for async functions
     */
    async withLoading(containerId, asyncFn) {
        try {
            this.showLoading(containerId);
            const result = await asyncFn();
            this.hideAll(containerId);
            return result;
        } catch (error) {
            this.showError(containerId, error);
            throw error;
        }
    }

    /**
     * Handle errors globally
     */
    handleError(error, context = '') {
        console.error(`${context} Error:`, error);

        // Standardize error messages
        const errorMessages = {
            'permission-denied': 'You do not have permission to perform this action',
            'not-found': 'The requested resource was not found',
            'already-exists': 'This resource already exists',
            'invalid-argument': 'Invalid data provided',
            'failed-precondition': 'Operation cannot be performed in current state',
            'unauthenticated': 'Please sign in to continue',
            'network-error': 'Network error. Please check your connection.',
            'server-error': 'Server error. Please try again later.',
            'unknown': 'An unexpected error occurred. Please try again.'
        };

        return new Error(errorMessages[error.code] || error.message || errorMessages.unknown);
    }
}

// Create singleton instance
const errorService = new ErrorService();
export default errorService;

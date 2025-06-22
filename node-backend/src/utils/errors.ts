export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public isOperational = true,
    public details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// API Errors
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'VALIDATION_ERROR', message, true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(401, 'AUTHENTICATION_ERROR', message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(403, 'AUTHORIZATION_ERROR', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(429, 'RATE_LIMIT_ERROR', message);
  }
}

// Business Logic Errors
export class ObservationError extends AppError {
  constructor(message: string, details?: any) {
    super(422, 'OBSERVATION_ERROR', message, true, details);
  }
}

export class PatternError extends AppError {
  constructor(message: string, details?: any) {
    super(422, 'PATTERN_ERROR', message, true, details);
  }
}

export class BatchProcessingError extends AppError {
  constructor(message: string, details?: any) {
    super(422, 'BATCH_PROCESSING_ERROR', message, true, details);
  }
}

// Integration Errors
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(503, 'EXTERNAL_SERVICE_ERROR', `${service} error: ${message}`, true, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(503, 'DATABASE_ERROR', message, true, details);
  }
}

export class CacheError extends AppError {
  constructor(message: string, details?: any) {
    super(503, 'CACHE_ERROR', message, true, details);
  }
}

// Error Response Interface
export interface ErrorResponse {
  status: 'error';
  code: string;
  message: string;
  details?: any;
  requestId?: string;
  timestamp: string;
}

// Error Factory
export function createErrorResponse(error: AppError, requestId?: string): ErrorResponse {
  return {
    status: 'error',
    code: error.code,
    message: error.message,
    details: error.details,
    requestId,
    timestamp: new Date().toISOString()
  };
}

// Validation Helpers
export function validateText(text: string): void {
  if (!text || typeof text !== 'string') {
    throw new ValidationError('Text must be a non-empty string');
  }

  if (text.length > 5000) {
    throw new ValidationError('Text exceeds maximum length of 5000 characters');
  }

  // Check for potentially malicious content
  const unsafePatterns = [
    '<script>',
    'javascript:',
    'data:',
    'vbscript:',
    'expression(',
    'onload=',
    'onerror='
  ];

  for (const pattern of unsafePatterns) {
    if (text.toLowerCase().includes(pattern)) {
      throw new ValidationError('Text contains potentially unsafe content', { pattern });
    }
  }
}

export function validateBatchInput(texts: any): void {
  if (!Array.isArray(texts)) {
    throw new ValidationError('Input must be an array of texts');
  }

  if (texts.length === 0) {
    throw new ValidationError('Batch cannot be empty');
  }

  if (texts.length > 100) {
    throw new ValidationError('Batch size exceeds maximum limit of 100 texts');
  }

  texts.forEach((text, index) => {
    try {
      validateText(text);
    } catch (error) {
      throw new ValidationError(`Invalid text at index ${index}`, {
        index,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
} 
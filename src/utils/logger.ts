export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env?.MODE !== 'production';
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as any : undefined,
    };
  }

  private output(entry: LogEntry): void {
    if (this.isDevelopment) {
      // Development: Pretty console output with colors
      const emoji = this.getLogEmoji(entry.level);
      
      console.group(`${emoji} ${entry.message}`);
      if (entry.context) {
        console.info('%cContext:', 'font-weight: bold; color: #666;', entry.context);
      }
      if (entry.error) {
        console.error('%cError:', 'font-weight: bold; color: #ff4444;', entry.error instanceof Error ? entry.error : String(entry.error));
      }
      console.info('%cTimestamp:', 'font-weight: bold; color: #888;', entry.timestamp);
      console.groupEnd();
    } else {
      // Production: Structured JSON logging
      console.log(JSON.stringify(entry));
      
      // Send to external logging service in production
      this.sendToExternalLogger(entry);
    }
  }

  private getLogEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.ERROR: return '❌';
      default: return '📝';
    }
  }

  private async sendToExternalLogger(entry: LogEntry): Promise<void> {
    try {
      // In production, send to logging service (e.g., Sentry, LogRocket, etc.)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        // Send errors to Google Analytics
        if (entry.level >= LogLevel.ERROR) {
          (window as any).gtag('event', 'exception', {
            description: entry.message,
            fatal: entry.level === LogLevel.ERROR,
          });
        }
      }
      
      // Could also send to other services:
      // - Sentry for error tracking
      // - LogRocket for session replay
      // - Custom analytics endpoint
    } catch (error) {
      // Fallback to console if external logging fails
      console.error('Failed to send log to external service:', error instanceof Error ? error.message : String(error));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.formatMessage(LogLevel.DEBUG, message, context);
      this.output(entry);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.formatMessage(LogLevel.INFO, message, context);
      this.output(entry);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.formatMessage(LogLevel.WARN, message, context);
      this.output(entry);
    }
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.formatMessage(LogLevel.ERROR, message, context, error);
      this.output(entry);
    }
  }

  // Convenience methods for common use cases
  apiCall(method: string, url: string, duration?: number, success: boolean = true): void {
    this.info('API Call', {
      method,
      url,
      duration,
      success,
      type: 'api_call'
    });
  }

  userAction(action: string, context?: LogContext): void {
    this.info('User Action', {
      action,
      ...context,
      type: 'user_action'
    });
  }

  performance(operation: string, duration: number, context?: LogContext): void {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.INFO;
    const entry = this.formatMessage(level, `Performance: ${operation}`, {
      duration,
      ...context,
      type: 'performance'
    });
    this.output(entry);
  }

  // Method to change log level dynamically
  setLevel(level: LogLevel): void {
    this.level = level;
    this.info('Log level changed', { newLevel: LogLevel[level] });
  }
}

// Create singleton instance
export const logger = new Logger();

// Export convenience functions for easier migration from console
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, context?: LogContext, error?: Error) => logger.error(message, context, error),
  
  // Migration helpers
  apiCall: logger.apiCall.bind(logger),
  userAction: logger.userAction.bind(logger),
  performance: logger.performance.bind(logger),
};

// Global error handler for unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('Unhandled Error', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    }, event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', {
      reason: event.reason,
    });
  });
}

export default logger; 
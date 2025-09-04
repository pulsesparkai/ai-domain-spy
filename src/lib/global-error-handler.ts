/**
 * Global Error Handler for unhandled errors and promise rejections
 * Provides centralized error handling to prevent cascading failures
 */

import { errorHandler } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { showToast } from '@/lib/toast';

interface GlobalErrorConfig {
  enableConsoleLogging: boolean;
  enableToastNotifications: boolean;
  enableSentryLogging: boolean;
  maxErrorsPerSession: number;
  cooldownPeriod: number; // ms
}

class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorCount = 0;
  private lastErrorTime = 0;
  private isInitialized = false;
  
  private config: GlobalErrorConfig = {
    enableConsoleLogging: true,
    enableToastNotifications: true,
    enableSentryLogging: true,
    maxErrorsPerSession: 50,
    cooldownPeriod: 1000, // 1 second
  };

  public static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  /**
   * Initialize global error handlers
   */
  public initialize(config?: Partial<GlobalErrorConfig>): void {
    if (this.isInitialized) {
      return;
    }

    // Merge config
    this.config = { ...this.config, ...config };

    // Handle unhandled JavaScript errors
    window.addEventListener('error', this.handleGlobalError.bind(this));

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

    // Handle React render errors (for older React versions)
    if (typeof window !== 'undefined') {
      const originalConsoleError = console.error;
      console.error = (...args: any[]) => {
        // Check if this is a React error
        const message = args[0];
        if (typeof message === 'string' && message.includes('React')) {
          this.handleReactError(message, args);
        }
        originalConsoleError.apply(console, args);
      };
    }

    this.isInitialized = true;
    logger.info('Global error handler initialized');
  }

  /**
   * Handle global JavaScript errors
   */
  private handleGlobalError(event: ErrorEvent): void {
    if (!this.shouldHandleError()) {
      return;
    }

    const error = {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    };

    logger.error('Global JavaScript error', 'GlobalErrorHandler', error);

    const appError = errorHandler.normalizeError(event.error || new Error(event.message));
    errorHandler.handleError(appError, 'Global Error Handler');

    if (this.config.enableToastNotifications) {
      showToast.error('An unexpected error occurred. The page will continue to work normally.', {
        duration: 5000,
      });
    }

    // Prevent the error from propagating to the browser's default error handler
    event.preventDefault();
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    if (!this.shouldHandleError()) {
      return;
    }

    logger.error('Unhandled promise rejection', 'GlobalErrorHandler', {
      reason: event.reason,
      promise: event.promise,
    });

    const appError = errorHandler.normalizeError(event.reason);
    errorHandler.handleError(appError, 'Unhandled Promise Rejection');

    if (this.config.enableToastNotifications) {
      showToast.error('A background operation failed. Please try again if needed.', {
        duration: 4000,
      });
    }

    // Prevent the unhandled rejection from being logged to console
    event.preventDefault();
  }

  /**
   * Handle React-specific errors
   */
  private handleReactError(message: string, args: any[]): void {
    if (!this.shouldHandleError()) {
      return;
    }

    logger.error('React error detected', 'GlobalErrorHandler', {
      message,
      args,
    });

    const appError = errorHandler.normalizeError(new Error(message));
    errorHandler.handleError(appError, 'React Error');
  }

  /**
   * Check if we should handle this error (rate limiting)
   */
  private shouldHandleError(): boolean {
    const now = Date.now();

    // Check if we're in cooldown period
    if (now - this.lastErrorTime < this.config.cooldownPeriod) {
      return false;
    }

    // Check if we've exceeded max errors per session
    if (this.errorCount >= this.config.maxErrorsPerSession) {
      return false;
    }

    this.errorCount++;
    this.lastErrorTime = now;
    return true;
  }

  /**
   * Manually handle an error
   */
  public handleError(error: unknown, context?: string): void {
    if (!this.shouldHandleError()) {
      return;
    }

    const appError = errorHandler.normalizeError(error);
    errorHandler.handleError(appError, context || 'Manual Error Handler');
  }

  /**
   * Reset error counter (useful for testing or manual reset)
   */
  public reset(): void {
    this.errorCount = 0;
    this.lastErrorTime = 0;
  }

  /**
   * Get current error statistics
   */
  public getStats(): { errorCount: number; lastErrorTime: number; isInitialized: boolean } {
    return {
      errorCount: this.errorCount,
      lastErrorTime: this.lastErrorTime,
      isInitialized: this.isInitialized,
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<GlobalErrorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Cleanup global error handlers (useful for testing)
   */
  public cleanup(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', this.handleGlobalError.bind(this));
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const globalErrorHandler = GlobalErrorHandler.getInstance();

// Convenience functions
export const initializeGlobalErrorHandler = (config?: Partial<GlobalErrorConfig>) => {
  globalErrorHandler.initialize(config);
};

export const handleGlobalError = (error: unknown, context?: string) => {
  globalErrorHandler.handleError(error, context);
};

export const resetGlobalErrorHandler = () => {
  globalErrorHandler.reset();
};

export type { GlobalErrorConfig };
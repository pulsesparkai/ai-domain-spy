// Centralized error handling with type safety

import { AppError, exhaustiveErrorCheck, assertNever } from '@/types/api';
import { showToast } from '@/lib/toast';
import { logger } from '@/lib/logger';
import { kpiTracker } from '@/lib/kpi-tracker';

/**
 * Centralized error handler that provides consistent error handling
 * across the application with proper type safety
 */
export class ErrorHandler {
  private static instance: ErrorHandler;

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle application errors with exhaustive type checking
   */
  public handleError(error: AppError, context?: string): void {
    const contextMessage = context ? `[${context}] ` : '';
    
    switch (error.type) {
      case 'network':
        this.handleNetworkError(error, contextMessage);
        break;
      case 'validation':
        this.handleValidationError(error, contextMessage);
        break;
      case 'authentication':
        this.handleAuthenticationError(error, contextMessage);
        break;
      case 'authorization':
        this.handleAuthorizationError(error, contextMessage);
        break;
      case 'rate_limit':
        this.handleRateLimitError(error, contextMessage);
        break;
      case 'api':
        this.handleApiError(error, contextMessage);
        break;
      case 'unknown':
        this.handleUnknownError(error, contextMessage);
        break;
      default:
        // This will trigger TypeScript error if we miss a case
        assertNever(error);
    }
  }

  private handleNetworkError(error: AppError & { type: 'network' }, context: string): void {
    logger.error(`${context}Network error`, context, error);
    kpiTracker.trackError('network_error', 'medium', { context, error: error.message });
    showToast.error('Network connection failed. Please check your internet connection.');
  }

  private handleValidationError(error: AppError & { type: 'validation' }, context: string): void {
    logger.error(`${context}Validation error`, context, error);
    kpiTracker.trackError('validation_error', 'low', { context, field: error.field });
    const fieldMessage = error.field ? ` (Field: ${error.field})` : '';
    showToast.error(`Invalid data provided${fieldMessage}: ${error.message}`);
  }

  private handleAuthenticationError(error: AppError & { type: 'authentication' }, context: string): void {
    logger.error(`${context}Authentication error`, context, error);
    kpiTracker.trackError('authentication_error', 'high', { context });
    showToast.error('Authentication failed. Please sign in again.');
    
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    }, 2000);
  }

  private handleAuthorizationError(error: AppError & { type: 'authorization' }, context: string): void {
    logger.error(`${context}Authorization error`, context, error);
    kpiTracker.trackError('authorization_error', 'high', { context, resource: error.resource });
    const resourceMessage = error.resource ? ` for ${error.resource}` : '';
    showToast.error(`Access denied${resourceMessage}. Please contact support if this persists.`);
  }

  private handleRateLimitError(error: AppError & { type: 'rate_limit' }, context: string): void {
    logger.warn(`${context}Rate limit error`, context, error);
    kpiTracker.trackError('rate_limit_error', 'medium', { context, retryAfter: error.retryAfter });
    const retryMessage = error.retryAfter 
      ? ` Please try again in ${error.retryAfter} seconds.`
      : ' Please try again later.';
    showToast.error(`Rate limit exceeded.${retryMessage}`);
  }

  private handleApiError(error: AppError & { type: 'api' }, context: string): void {
    logger.error(`${context}API error`, context, error);
    kpiTracker.trackError('api_error', 'medium', { context, code: error.code });
    showToast.error(`Server error: ${error.message} (Code: ${error.code})`);
  }

  private handleUnknownError(error: AppError & { type: 'unknown' }, context: string): void {
    logger.fatal(`${context}Unknown error`, context, error, error.originalError as Error);
    kpiTracker.trackError('unknown_error', 'critical', { context });
    showToast.error('An unexpected error occurred. Please try again.');
  }

  /**
   * Convert unknown errors to AppError with proper type safety
   */
  public normalizeError(error: unknown, context?: string): AppError {
    if (typeof error === 'object' && error !== null && 'type' in error) {
      // Already an AppError
      return error as AppError;
    }

    if (error instanceof Error) {
      // Check for specific error types
      if (error.name === 'ValidationError') {
        return {
          type: 'validation',
          message: error.message,
        };
      }

      if (error.name === 'NetworkError' || error.message.includes('network')) {
        return {
          type: 'network',
          message: error.message,
        };
      }

      return {
        type: 'unknown',
        message: error.message,
        originalError: error,
      };
    }

    if (typeof error === 'string') {
      return {
        type: 'unknown',
        message: error,
      };
    }

    return {
      type: 'unknown',
      message: 'An unexpected error occurred',
      originalError: error,
    };
  }

  /**
   * Handle errors with async operations (e.g., API calls)
   */
  public async handleAsyncError<T>(
    operation: () => Promise<T>,
    context?: string,
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      const appError = this.normalizeError(error, context);
      this.handleError(appError, context);
      return fallback;
    }
  }

  /**
   * Create error boundary handler for React components
   */
  public createErrorBoundaryHandler(componentName: string) {
    return (error: Error, errorInfo: any) => {
      const appError = this.normalizeError(error, `Component: ${componentName}`);
      this.handleError(appError, `React Error Boundary`);
      
      // Log additional React error info
      console.error('React Error Info:', errorInfo);
    };
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions
export const handleError = (error: AppError | unknown, context?: string) => {
  const normalizedError = error instanceof Error || typeof error === 'object' && error !== null && 'type' in error
    ? error as AppError
    : errorHandler.normalizeError(error, context);
  
  errorHandler.handleError(normalizedError, context);
};

export const handleAsyncError = errorHandler.handleAsyncError.bind(errorHandler);
export const normalizeError = errorHandler.normalizeError.bind(errorHandler);
export const createErrorBoundaryHandler = errorHandler.createErrorBoundaryHandler.bind(errorHandler);
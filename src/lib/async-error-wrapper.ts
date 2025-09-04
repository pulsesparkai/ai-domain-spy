/**
 * Async Error Wrapper Utilities
 * Provides consistent error handling for async operations
 */

import { errorHandler } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { AppError } from '@/types/api';

interface AsyncErrorOptions {
  context?: string;
  showToast?: boolean;
  logError?: boolean;
  fallbackValue?: any;
  retryAttempts?: number;
  retryDelay?: number;
  onError?: (error: AppError, attempt?: number) => void;
  onRetry?: (attempt: number, maxAttempts: number) => void;
  onSuccess?: (result: any, attempts: number) => void;
}

/**
 * Wraps an async function with comprehensive error handling
 */
export async function withAsyncErrorHandling<T>(
  operation: () => Promise<T>,
  options: AsyncErrorOptions = {}
): Promise<T | undefined> {
  const {
    context = 'Async Operation',
    showToast = true,
    logError = true,
    fallbackValue,
    retryAttempts = 0,
    retryDelay = 1000,
    onError,
    onRetry,
    onSuccess,
  } = options;

  let lastError: AppError;
  let attempts = 0;
  const maxAttempts = retryAttempts + 1;

  while (attempts < maxAttempts) {
    attempts++;

    try {
      const result = await operation();
      
      if (onSuccess && attempts > 1) {
        onSuccess(result, attempts);
      }

      return result;
    } catch (error) {
      lastError = errorHandler.normalizeError(error, context);

      if (logError) {
        logger.error(`${context} failed (attempt ${attempts}/${maxAttempts})`, context, {
          error: lastError,
          attempt: attempts,
          maxAttempts,
        });
      }

      if (onError) {
        onError(lastError, attempts);
      }

      // If this is the last attempt, handle the error
      if (attempts >= maxAttempts) {
        if (showToast) {
          errorHandler.handleError(lastError, context);
        }
        break;
      }

      // Retry logic
      if (onRetry) {
        onRetry(attempts, maxAttempts);
      }

      // Wait before retry
      if (retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // Return fallback value if operation failed
  return fallbackValue;
}

/**
 * Wraps multiple async operations and handles them gracefully
 */
export async function withBatchAsyncErrorHandling<T>(
  operations: Array<{
    operation: () => Promise<T>;
    context?: string;
    required?: boolean;
  }>,
  options: Omit<AsyncErrorOptions, 'fallbackValue'> & {
    failFast?: boolean;
    minSuccessRequired?: number;
  } = {}
): Promise<{
  results: (T | undefined)[];
  errors: AppError[];
  successCount: number;
  failureCount: number;
}> {
  const {
    failFast = false,
    minSuccessRequired = 0,
    ...asyncOptions
  } = options;

  const results: (T | undefined)[] = [];
  const errors: AppError[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < operations.length; i++) {
    const { operation, context = `Batch Operation ${i + 1}`, required = false } = operations[i];

    try {
      const result = await withAsyncErrorHandling(operation, {
        ...asyncOptions,
        context,
        showToast: required, // Only show toast for required operations
      });

      if (result !== undefined) {
        results[i] = result;
        successCount++;
      } else {
        results[i] = undefined;
        failureCount++;
        if (required && failFast) {
          throw new Error(`Required operation "${context}" failed`);
        }
      }
    } catch (error) {
      const appError = errorHandler.normalizeError(error, context);
      errors.push(appError);
      results[i] = undefined;
      failureCount++;

      if (failFast || (required && failFast)) {
        break;
      }
    }
  }

  // Check if minimum success requirement is met
  if (successCount < minSuccessRequired) {
    const error = errorHandler.normalizeError(
      new Error(`Only ${successCount} of ${minSuccessRequired} required operations succeeded`),
      'Batch Operations'
    );
    errorHandler.handleError(error, 'Batch Operations');
  }

  return {
    results,
    errors,
    successCount,
    failureCount,
  };
}

/**
 * Creates a safe version of any async function
 */
export function createSafeAsyncFunction<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  defaultOptions: AsyncErrorOptions = {}
) {
  return async (...args: TArgs): Promise<TReturn | undefined> => {
    return withAsyncErrorHandling(
      () => fn(...args),
      defaultOptions
    );
  };
}

/**
 * Utility for handling fetch requests with comprehensive error handling
 */
export async function safeFetch(
  url: string,
  options: RequestInit & {
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
  } = {}
): Promise<Response | undefined> {
  const {
    timeout = 10000,
    retryAttempts = 2,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  return withAsyncErrorHandling(
    async () => {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    {
      context: `Fetch: ${url}`,
      retryAttempts,
      retryDelay,
      logError: true,
      showToast: true,
    }
  );
}

/**
 * Utility for handling JSON API requests
 */
export async function safeJsonFetch<T = any>(
  url: string,
  options: RequestInit & {
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
  } = {}
): Promise<T | undefined> {
  const response = await safeFetch(url, options);
  
  if (!response) {
    return undefined;
  }

  return withAsyncErrorHandling(
    async () => {
      const data = await response.json();
      return data as T;
    },
    {
      context: `JSON Parse: ${url}`,
      logError: true,
      showToast: true,
    }
  );
}

/**
 * Debounced async error handling (useful for user input)
 */
export function createDebouncedAsyncHandler<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  delay: number = 300,
  options: AsyncErrorOptions = {}
): (...args: TArgs) => Promise<TReturn | undefined> {
  let timeoutId: NodeJS.Timeout;

  return (...args: TArgs): Promise<TReturn | undefined> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const result = await withAsyncErrorHandling(
          () => fn(...args),
          options
        );
        resolve(result);
      }, delay);
    });
  };
}
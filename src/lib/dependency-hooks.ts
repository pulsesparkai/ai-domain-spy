/**
 * Enhanced dependency validation hooks for specific use cases
 */

import { useState, useEffect } from 'react';
import { dependencyChecker, waitForDependency, checkDependency } from './dependency-checker';

/**
 * Hook to ensure Stripe is loaded before payment operations
 */
export const useStripeReady = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStripe = async () => {
      try {
        await waitForDependency('stripe', 5000);
        setIsReady(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Stripe loading failed');
        setIsReady(false);
      } finally {
        setLoading(false);
      }
    };

    checkStripe();
  }, []);

  const retryStripe = async () => {
    setLoading(true);
    setError(null);
    try {
      await waitForDependency('stripe', 5000);
      setIsReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stripe loading failed');
      setIsReady(false);
    } finally {
      setLoading(false);
    }
  };

  return { isReady, error, loading, retry: retryStripe };
};

/**
 * Hook to ensure Supabase is ready before database operations
 */
export const useSupabaseReady = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSupabase = async () => {
      try {
        await waitForDependency('supabase', 5000);
        setIsReady(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Supabase connection failed');
        setIsReady(false);
      } finally {
        setLoading(false);
      }
    };

    checkSupabase();
  }, []);

  const retrySupabase = async () => {
    setLoading(true);
    setError(null);
    try {
      await waitForDependency('supabase', 5000);
      setIsReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Supabase connection failed');
      setIsReady(false);
    } finally {
      setLoading(false);
    }
  };

  return { isReady, error, loading, retry: retrySupabase };
};

/**
 * Hook to ensure PostHog is ready before analytics operations
 */
export const useAnalyticsReady = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAnalytics = async () => {
      try {
        await checkDependency('posthog');
        setIsReady(true);
        setError(null);
      } catch (err) {
        // Analytics is non-critical, so we don't block the app
        console.warn('Analytics not available:', err);
        setError(err instanceof Error ? err.message : 'Analytics unavailable');
        setIsReady(false);
      }
    };

    checkAnalytics();
  }, []);

  return { isReady, error };
};

/**
 * Utility function to safely execute code that depends on specific dependencies
 */
export async function withDependencyCheck<T>(
  dependencies: string[],
  operation: () => Promise<T> | T,
  options?: {
    timeout?: number;
    fallback?: () => T;
  }
): Promise<T> {
  try {
    // Wait for all required dependencies
    await Promise.all(
      dependencies.map(dep => waitForDependency(dep, options?.timeout || 5000))
    );
    
    // Execute the operation
    return await operation();
  } catch (error) {
    console.error('Dependency check failed:', error);
    
    if (options?.fallback) {
      return options.fallback();
    }
    
    throw error;
  }
}

/**
 * Retry mechanism for dependency-dependent operations
 */
export class DependencyRetry {
  private maxRetries: number;
  private retryDelay: number;
  
  constructor(maxRetries = 3, retryDelay = 1000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  async execute<T>(
    dependencies: string[],
    operation: () => Promise<T> | T,
    options?: { timeout?: number }
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await withDependencyCheck(dependencies, operation, options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.maxRetries) {
          console.warn(`Dependency operation failed (attempt ${attempt + 1}), retrying...`, error);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
        }
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  }
}

// Export a default retry instance
export const dependencyRetry = new DependencyRetry();
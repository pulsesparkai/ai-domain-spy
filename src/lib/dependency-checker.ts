/**
 * Dependency Checker Utility
 * Validates that all critical dependencies are loaded before use
 * Environment-aware and graceful handling of optional services
 */

import { previewUtils, envLogger } from './environment';

interface DependencyStatus {
  name: string;
  loaded: boolean;
  error?: string;
  checkFn: () => Promise<boolean>;
  optional?: boolean; // Mark dependency as optional
  silent?: boolean; // Reduce logging for this dependency
}

interface DependencyCheckResult {
  allLoaded: boolean;
  dependencies: Record<string, { loaded: boolean; error?: string }>;
  errors: string[];
}

class DependencyChecker {
  private static instance: DependencyChecker;
  private dependencies: Map<string, DependencyStatus>;
  private listeners: Array<(result: DependencyCheckResult) => void> = [];

  private constructor() {
    this.dependencies = new Map();
    this.initializeDependencies();
  }

  static getInstance(): DependencyChecker {
    if (!DependencyChecker.instance) {
      DependencyChecker.instance = new DependencyChecker();
    }
    return DependencyChecker.instance;
  }

  private initializeDependencies() {
    // Supabase Client Check (Critical)
    this.dependencies.set('supabase', {
      name: 'Supabase Client',
      loaded: false,
      optional: false,
      checkFn: async () => {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          
          // Test basic connectivity
          const { data, error } = await supabase.auth.getSession();
          
          if (error && error.message !== 'No session found') {
            throw new Error(`Supabase connection failed: ${error.message}`);
          }
          
          return true;
        } catch (error) {
          throw new Error(`Supabase client initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    });

    // Stripe.js Check (Critical for payment features)
    this.dependencies.set('stripe', {
      name: 'Stripe.js',
      loaded: false,
      optional: false,
      checkFn: async () => {
        try {
          // Check if Stripe is available globally
          if (typeof window !== 'undefined' && (window as any).Stripe) {
            return true;
          }
          
          // Try to load Stripe dynamically
          const stripeScript = document.querySelector('script[src*="stripe"]');
          if (!stripeScript) {
            // Load Stripe script if not present
            return new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://js.stripe.com/v3/';
              script.onload = () => {
                if ((window as any).Stripe) {
                  resolve(true);
                } else {
                  reject(new Error('Stripe failed to load'));
                }
              };
              script.onerror = () => reject(new Error('Failed to load Stripe script'));
              document.head.appendChild(script);
            });
          }
          
          // Wait for Stripe to be available
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds timeout
          
          return new Promise((resolve, reject) => {
            const checkStripe = () => {
              if ((window as any).Stripe) {
                resolve(true);
              } else if (attempts >= maxAttempts) {
                reject(new Error('Stripe.js loading timeout'));
              } else {
                attempts++;
                setTimeout(checkStripe, 100);
              }
            };
            checkStripe();
          });
        } catch (error) {
          throw new Error(`Stripe.js loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    });

    // PostHog Check (Optional Analytics - Environment Aware)
    this.dependencies.set('posthog', {
      name: 'PostHog Analytics',
      loaded: false,
      optional: true,
      silent: !previewUtils.shouldEnableService('posthog'),
      checkFn: async () => {
        try {
          // Skip if disabled in current environment
          if (!previewUtils.shouldEnableService('posthog')) {
            envLogger.debug('PostHog disabled in current environment');
            return true;
          }

          if (typeof window === 'undefined') {
            return true; // SSR environment, skip check
          }

          // Check if PostHog environment variables are present
          const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
          if (!posthogKey) {
            return true; // No config provided, gracefully skip
          }

          // Check if PostHog is available
          const posthog = await import('posthog-js');
          
          // Check if PostHog is initialized
          if (posthog.default && typeof posthog.default.capture === 'function') {
            // Test if PostHog is properly configured
            const isInitialized = posthog.default.__loaded;
            return isInitialized || true; // Don't fail if not initialized
          }
          
          return true; // Always pass for optional service
        } catch (error) {
          // PostHog is optional, so we don't log errors unless debug is enabled
          return true; // Return true to not block the app
        }
      }
    });


    // Sentry Check (Optional Error Tracking - Environment Aware)
    this.dependencies.set('sentry', {
      name: 'Sentry Error Tracking',
      loaded: false,
      optional: true,
      silent: !previewUtils.shouldEnableService('sentry'),
      checkFn: async () => {
        try {
          // Skip if disabled in current environment
          if (!previewUtils.shouldEnableService('sentry')) {
            envLogger.debug('Sentry disabled in current environment');
            return true;
          }

          // Check if Sentry environment variables are present
          const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
          if (!sentryDsn) {
            return true; // No config provided, gracefully skip
          }

          const Sentry = await import('@sentry/react');
          
          // Check if Sentry is initialized by looking for any client
          if (Sentry.getClient && Sentry.getClient()) {
            return true;
          }
          
          return true; // Always pass for optional service
        } catch (error) {
          // Sentry is optional, so we don't log errors unless debug is enabled
          return true; // Non-blocking
        }
      }
    });
  }

  /**
   * Check all dependencies
   */
  async checkAll(): Promise<DependencyCheckResult> {
    const results: Record<string, { loaded: boolean; error?: string }> = {};
    const errors: string[] = [];

    for (const [key, dependency] of this.dependencies) {
      try {
        const loaded = await dependency.checkFn();
        dependency.loaded = loaded;
        dependency.error = undefined;
        results[key] = { loaded };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        dependency.loaded = false;
        dependency.error = errorMessage;
        results[key] = { loaded: false, error: errorMessage };
        
        // Only add to errors if dependency is not optional
        if (!dependency.optional) {
          errors.push(`${dependency.name}: ${errorMessage}`);
        } else if (!dependency.silent) {
          envLogger.debug(`Optional dependency ${dependency.name} not available:`, errorMessage);
        }
      }
    }

    // Only consider critical dependencies for allLoaded status
    const criticalDependencies = Array.from(this.dependencies.entries())
      .filter(([, dep]) => !dep.optional);
    
    const allCriticalLoaded = criticalDependencies.every(([key]) => results[key]?.loaded);
    const result = { allLoaded: allCriticalLoaded, dependencies: results, errors };

    // Notify listeners
    this.listeners.forEach(listener => listener(result));

    return result;
  }

  /**
   * Check specific dependency
   */
  async checkDependency(name: string): Promise<boolean> {
    const dependency = this.dependencies.get(name);
    if (!dependency) {
      throw new Error(`Unknown dependency: ${name}`);
    }

    try {
      const loaded = await dependency.checkFn();
      dependency.loaded = loaded;
      dependency.error = undefined;
      return loaded;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dependency.loaded = false;
      dependency.error = errorMessage;
      throw new Error(errorMessage);
    }
  }

  /**
   * Wait for critical dependencies to be ready (ignores optional services)
   */
  async waitForDependencies(timeout: number = 10000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const result = await this.checkAll();
      
      // Only wait for critical dependencies
      if (result.allLoaded) {
        return;
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const result = await this.checkAll();
    if (!result.allLoaded) {
      throw new Error(`Critical dependencies not ready after ${timeout}ms. Errors: ${result.errors.join(', ')}`);
    }
  }

  /**
   * Wait for all dependencies including optional ones
   */
  async waitForAllDependencies(timeout: number = 10000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const results: Record<string, { loaded: boolean; error?: string }> = {};
      let allLoaded = true;

      for (const [key, dependency] of this.dependencies) {
        try {
          const loaded = await dependency.checkFn();
          results[key] = { loaded };
          if (!loaded) allLoaded = false;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results[key] = { loaded: false, error: errorMessage };
          allLoaded = false;
        }
      }
      
      if (allLoaded) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error(`All dependencies not ready after ${timeout}ms`);
  }

  /**
   * Wait for specific dependency
   */
  async waitForDependency(name: string, timeout: number = 5000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const loaded = await this.checkDependency(name);
        if (loaded) {
          return;
        }
      } catch (error) {
        // Continue waiting
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    throw new Error(`Dependency '${name}' not ready after ${timeout}ms`);
  }

  /**
   * Subscribe to dependency status changes
   */
  subscribe(listener: (result: DependencyCheckResult) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current status of all dependencies
   */
  getStatus(): Record<string, { loaded: boolean; error?: string }> {
    const status: Record<string, { loaded: boolean; error?: string }> = {};
    
    for (const [key, dependency] of this.dependencies) {
      status[key] = {
        loaded: dependency.loaded,
        error: dependency.error
      };
    }
    
    return status;
  }

  /**
   * Reset all dependency status
   */
  reset(): void {
    for (const dependency of this.dependencies.values()) {
      dependency.loaded = false;
      dependency.error = undefined;
    }
  }
}

// Export singleton instance
export const dependencyChecker = DependencyChecker.getInstance();

// Convenience functions
export const checkAllDependencies = () => dependencyChecker.checkAll();
export const waitForDependencies = (timeout?: number) => dependencyChecker.waitForDependencies(timeout);
export const waitForAllDependencies = (timeout?: number) => dependencyChecker.waitForAllDependencies(timeout);
export const waitForDependency = (name: string, timeout?: number) => dependencyChecker.waitForDependency(name, timeout);
export const checkDependency = (name: string) => dependencyChecker.checkDependency(name);
export const subscribeToDependencies = (listener: (result: DependencyCheckResult) => void) => 
  dependencyChecker.subscribe(listener);

// Export types
export type { DependencyCheckResult };
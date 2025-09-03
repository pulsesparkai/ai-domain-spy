// Hook for managing lazy component loading with error handling
import { useState, useEffect, ComponentType, LazyExoticComponent } from 'react';

interface UseLazyComponentOptions {
  fallback?: ComponentType<any>;
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>;
  retryDelay?: number;
  maxRetries?: number;
}

interface UseLazyComponentReturn<T> {
  Component: T | null;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
}

export function useLazyComponent<T extends ComponentType<any>>(
  lazyComponent: LazyExoticComponent<T>,
  options: UseLazyComponentOptions = {}
): UseLazyComponentReturn<T> {
  const [Component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const { 
    retryDelay = 1000, 
    maxRetries = 3 
  } = options;

  const loadComponent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Preload the component
      const loadedComponent = await (lazyComponent as any)();
      setComponent(loadedComponent.default);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load component');
      setError(error);
      
      // Retry logic
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff
      }
    } finally {
      setIsLoading(false);
    }
  };

  const retry = () => {
    setRetryCount(0);
    loadComponent();
  };

  useEffect(() => {
    loadComponent();
  }, [retryCount]);

  return {
    Component,
    isLoading,
    error,
    retry
  };
}

// Preload utility for critical components
export const preloadComponent = <T extends ComponentType<any>>(
  lazyComponent: LazyExoticComponent<T>
): Promise<T> => {
  return (lazyComponent as any)();
};

// Higher-order component for lazy loading with error boundaries
export function withLazyLoading<P extends object>(
  lazyComponent: LazyExoticComponent<ComponentType<P>>,
  options: UseLazyComponentOptions = {}
) {
  return function LazyWrapper(props: P) {
    const { Component, isLoading, error, retry } = useLazyComponent(lazyComponent, options);
    
    if (error) {
      const ErrorFallback = options.errorFallback;
      if (ErrorFallback) {
        return <ErrorFallback error={error} retry={retry} />;
      }
      
      return (
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <p className="text-red-800 mb-2">Failed to load component</p>
          <button 
            onClick={retry}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      );
    }
    
    if (isLoading || !Component) {
      const FallbackComponent = options.fallback;
      if (FallbackComponent) {
        return <FallbackComponent />;
      }
      
      return (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}
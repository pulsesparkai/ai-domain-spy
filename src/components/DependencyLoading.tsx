import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { 
  dependencyChecker, 
  type DependencyCheckResult,
  checkAllDependencies 
} from '@/lib/dependency-checker';
import LoadingFallback from '@/components/LoadingFallback';
import { withAsyncErrorHandling } from '@/lib/async-error-wrapper';

interface DependencyLoadingProps {
  onAllLoaded?: () => void;
  onError?: (errors: string[]) => void;
  showProgress?: boolean;
  showDetails?: boolean;
  timeout?: number;
  children?: React.ReactNode;
  retryable?: boolean;
}

export const DependencyLoading: React.FC<DependencyLoadingProps> = ({
  onAllLoaded,
  onError,
  showProgress = true,
  showDetails = false,
  timeout = 10000,
  children,
  retryable = true
}) => {
  const [status, setStatus] = useState<DependencyCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const checkDependencies = async () => {
    setLoading(true);
    setError(null);
    
    await withAsyncErrorHandling(
      async () => {
        // Subscribe to dependency status updates
        const unsubscribe = dependencyChecker.subscribe((result) => {
          setStatus(result);
          
          // Calculate progress based on loaded dependencies
          const totalDeps = Object.keys(result.dependencies).length;
          const loadedDeps = Object.values(result.dependencies).filter(dep => dep.loaded).length;
          setProgress((loadedDeps / totalDeps) * 100);
        });

        // Start checking dependencies
        await dependencyChecker.waitForDependencies(timeout);
        
        // All dependencies loaded successfully
        setLoading(false);
        setProgress(100);
        onAllLoaded?.();
        
        // Cleanup subscription
        unsubscribe();
      },
      {
        context: 'Dependency Loading',
        showToast: false,
        logError: true,
        onError: async (error) => {
          const errorMessage = error.message || 'Unknown dependency error';
          setError(errorMessage);
          setLoading(false);
          
          // Get final status
          const finalStatus = await checkAllDependencies();
          setStatus(finalStatus);
          onError?.(finalStatus.errors);
        },
      }
    );
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    checkDependencies();
  };

  useEffect(() => {
    checkDependencies();
  }, [retryCount]);

  // If all dependencies are loaded and we have children, render them
  if (status?.allLoaded && children) {
    return <>{children}</>;
  }

  // If loading or checking dependencies
  if (loading) {
    const details = status ? Object.entries(status.dependencies).map(([key, dep]) => 
      `${key}: ${dep.loaded ? 'loaded' : 'loading...'}`
    ) : [];

    return (
      <LoadingFallback
        type="app"
        message="Loading Application"
        progress={progress}
        showProgress={showProgress}
        showDetails={showDetails}
        details={details}
        timeout={timeout}
      />
    );
  }

  // If there's an error
  if (error) {
    const details = status ? [
      ...status.errors,
      ...Object.entries(status.dependencies)
        .filter(([, dep]) => dep.error)
        .map(([key, dep]) => `${key}: ${dep.error}`)
    ] : [error];

    return (
      <LoadingFallback
        type="app"
        hasError={true}
        errorMessage="Some dependencies failed to load"
        showDetails={showDetails}
        details={details}
        onRetry={retryable ? handleRetry : undefined}
        onCancel={() => window.location.reload()}
      />
    );
  }

  return null;
};

// Hook for using dependency status in components
export const useDependencyStatus = () => {
  const [status, setStatus] = useState<DependencyCheckResult | null>(null);

  useEffect(() => {
    // Get initial status
    checkAllDependencies().then(setStatus);

    // Subscribe to updates
    const unsubscribe = dependencyChecker.subscribe(setStatus);

    return unsubscribe;
  }, []);

  return status;
};

export default DependencyLoading;
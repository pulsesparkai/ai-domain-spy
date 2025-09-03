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
    
    try {
      // Subscribe to dependency status updates
      const unsubscribe = dependencyChecker.subscribe((result) => {
        setStatus(result);
        
        // Calculate progress based on loaded dependencies
        const totalDeps = Object.keys(result.dependencies).length;
        const loadedDeps = Object.values(result.dependencies).filter(dep => dep.loaded).length;
        setProgress((loadedDeps / totalDeps) * 100);
      });

      // Start checking dependencies
      const result = await dependencyChecker.waitForDependencies(timeout);
      
      // All dependencies loaded successfully
      setLoading(false);
      setProgress(100);
      onAllLoaded?.();
      
      // Cleanup subscription
      unsubscribe();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
      
      // Get final status
      const finalStatus = await checkAllDependencies();
      setStatus(finalStatus);
      onError?.(finalStatus.errors);
    }
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">Loading Application</h3>
                <p className="text-sm text-muted-foreground">
                  Initializing dependencies...
                </p>
              </div>
              
              {showProgress && (
                <div className="w-full space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-xs text-center text-muted-foreground">
                    {Math.round(progress)}% complete
                  </p>
                </div>
              )}

              {showDetails && status && (
                <div className="w-full space-y-2">
                  <h4 className="text-sm font-medium">Dependency Status:</h4>
                  <div className="space-y-1">
                    {Object.entries(status.dependencies).map(([key, dep]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="capitalize">{key}</span>
                        {dep.loaded ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If there's an error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-8 w-8 text-destructive" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">Initialization Failed</h3>
                <p className="text-sm text-muted-foreground">
                  Some dependencies failed to load
                </p>
              </div>

              <Alert className="w-full">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {error}
                </AlertDescription>
              </Alert>

              {showDetails && status && status.errors.length > 0 && (
                <div className="w-full space-y-2">
                  <h4 className="text-sm font-medium">Detailed Errors:</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {status.errors.map((err, index) => (
                      <div key={index} className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                        {err}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showDetails && status && (
                <div className="w-full space-y-2">
                  <h4 className="text-sm font-medium">Dependency Status:</h4>
                  <div className="space-y-1">
                    {Object.entries(status.dependencies).map(([key, dep]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="capitalize">{key}</span>
                        {dep.loaded ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-destructive" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {retryable && (
                <div className="flex space-x-2">
                  <Button onClick={handleRetry} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry ({retryCount})
                  </Button>
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="default" 
                    size="sm"
                  >
                    Refresh Page
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
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
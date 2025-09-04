import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingBar } from '@/components/ui/loading-bar';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadingFallbackProps {
  type?: 'app' | 'page' | 'component' | 'dependency';
  message?: string;
  progress?: number;
  showProgress?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onCancel?: () => void;
  details?: string[];
  timeout?: number;
  showDetails?: boolean;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  type = 'component',
  message,
  progress,
  showProgress = false,
  hasError = false,
  errorMessage,
  onRetry,
  onCancel,
  details = [],
  timeout,
  showDetails = false,
}) => {
  const getDefaultMessage = () => {
    switch (type) {
      case 'app':
        return 'Initializing application...';
      case 'page':
        return 'Loading page...';
      case 'dependency':
        return 'Loading dependencies...';
      default:
        return 'Loading...';
    }
  };

  const getLoadingContent = () => {
    if (hasError) {
      return (
        <div className="flex flex-col items-center space-y-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-foreground">Loading Failed</p>
            {errorMessage && (
              <p className="text-xs text-muted-foreground">{errorMessage}</p>
            )}
            {showDetails && details.length > 0 && (
              <div className="text-xs text-muted-foreground text-left">
                {details.map((detail, index) => (
                  <div key={index}>• {detail}</div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {onRetry && (
              <Button 
                onClick={onRetry} 
                size="sm" 
                variant="outline"
              >
                Retry
              </Button>
            )}
            {onCancel && (
              <Button 
                onClick={onCancel} 
                size="sm" 
                variant="ghost"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-foreground">
            {message || getDefaultMessage()}
          </p>
          
          {showProgress && typeof progress === 'number' && (
            <div className="w-full max-w-xs">
              <LoadingBar progress={progress} />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}
          
          {timeout && (
            <p className="text-xs text-muted-foreground">
              Timeout in {Math.ceil(timeout / 1000)}s
            </p>
          )}
          
          {showDetails && details.length > 0 && (
            <div className="text-xs text-muted-foreground text-left max-w-xs">
              {details.map((detail, index) => (
                <div key={index} className="truncate">• {detail}</div>
              ))}
            </div>
          )}
        </div>
        
        {onCancel && (
          <Button 
            onClick={onCancel} 
            size="sm" 
            variant="ghost"
            className="mt-4"
          >
            Cancel
          </Button>
        )}
      </div>
    );
  };

  // For app-level loading, use full screen
  if (type === 'app') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-6 p-6">
            {getLoadingContent()}
          </CardContent>
        </Card>
      </div>
    );
  }

  // For page-level loading, use substantial space
  if (type === 'page') {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-6 p-6">
            {getLoadingContent()}
          </CardContent>
        </Card>
      </div>
    );
  }

  // For component-level loading, use skeleton pattern
  if (type === 'component') {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="flex justify-center">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{message || getDefaultMessage()}</span>
          </div>
        </div>
      </div>
    );
  }

  // For dependency loading, use simple centered loading
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        {getLoadingContent()}
      </div>
    </div>
  );
};

export default LoadingFallback;
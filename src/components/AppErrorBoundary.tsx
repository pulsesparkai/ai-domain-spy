import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { handleError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showReportButton?: boolean;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
  isReporting: boolean;
}

class AppErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: null,
    isReporting: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = `app_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log error details
    logger.fatal('App-level error caught by boundary', 'AppErrorBoundary', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId,
    });

    // Report to Sentry if available
    const sentryId = Sentry.captureException(error, {
      tags: {
        component: 'AppErrorBoundary',
        errorId,
        retryCount: this.retryCount,
      },
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
        app: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          retryCount: this.retryCount,
        }
      },
      extra: {
        errorInfo,
        props: this.props,
      }
    });

    // Use centralized error handler
    handleError(error, 'App Error Boundary');

    // Update state with error details
    this.setState({
      errorInfo,
      errorId: sentryId || errorId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    if (this.retryCount >= this.maxRetries) {
      logger.warn('Max retry attempts reached for app error boundary', 'AppErrorBoundary');
      return;
    }

    this.retryCount++;
    
    logger.info(`Retrying app after error (attempt ${this.retryCount}/${this.maxRetries})`, 'AppErrorBoundary');

    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });

    // Track retry attempt
    Sentry.addBreadcrumb({
      message: 'App error boundary retry attempted',
      level: 'info',
      data: {
        retryCount: this.retryCount,
        maxRetries: this.maxRetries,
      }
    });
  };

  private handleReportError = async () => {
    if (!this.state.error || this.state.isReporting) {
      return;
    }

    this.setState({ isReporting: true });

    try {
      // Additional error reporting logic can go here
      // For now, we rely on Sentry which is already capturing the error
      
      logger.info('Error report sent successfully', 'AppErrorBoundary', {
        errorId: this.state.errorId,
      });

      // Show success feedback
      setTimeout(() => {
        this.setState({ isReporting: false });
      }, 1000);
      
    } catch (reportError) {
      logger.error('Failed to send error report', 'AppErrorBoundary', reportError);
      this.setState({ isReporting: false });
    }
  };

  private handleGoHome = () => {
    // Clear error state and navigate to home
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
    
    // Navigate to home page
    window.location.href = '/';
  };

  private handleRefreshPage = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isMaxRetriesReached = this.retryCount >= this.maxRetries;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-2xl shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="w-16 h-16 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Application Error
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  The application encountered an unexpected error and needs to be restarted.
                  {this.retryCount > 0 && (
                    <span className="block mt-1 text-sm text-muted-foreground">
                      Retry attempts: {this.retryCount}/{this.maxRetries}
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              {this.state.error && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-foreground">Error Details:</h4>
                  <div className="bg-muted p-3 rounded-md text-sm font-mono">
                    <div className="text-destructive font-semibold">
                      {this.state.error.name}: {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {this.state.errorId && (
                <div className="text-xs text-muted-foreground text-center bg-muted p-2 rounded">
                  Error ID: <code className="font-mono">{this.state.errorId}</code>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {!isMaxRetriesReached && (
                  <Button 
                    onClick={this.handleRetry}
                    variant="default"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again ({this.maxRetries - this.retryCount} left)
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleRefreshPage}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Page
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go to Homepage
                </Button>

                {this.props.showReportButton && (
                  <Button 
                    onClick={this.handleReportError}
                    variant="outline"
                    disabled={this.state.isReporting}
                    className="flex items-center gap-2"
                  >
                    <Bug className="w-4 h-4" />
                    {this.state.isReporting ? 'Reporting...' : 'Report Error'}
                  </Button>
                )}
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  If this problem persists, please contact support with the error ID above.
                </p>
                <p className="text-xs text-muted-foreground">
                  This error has been automatically reported to help us improve the application.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
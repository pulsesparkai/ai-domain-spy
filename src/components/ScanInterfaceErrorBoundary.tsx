import React, { Component, ReactNode } from 'react';
import { showToast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, AlertTriangle, Settings } from 'lucide-react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
  onNavigateToSettings?: () => void;
}

interface State {
  hasError: boolean;
  errorInfo: string | null;
  errorId: string | null;
}

class ScanInterfaceErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorInfo: null,
    errorId: null
  };

  public static getDerivedStateFromError(_: Error): State {
    return { 
      hasError: true, 
      errorInfo: null,
      errorId: null 
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = Date.now().toString();
    console.error('Scan interface error caught by boundary:', error, errorInfo);
    
    // Log to Sentry with scan-specific context
    const sentryId = Sentry.captureException(error, {
      tags: {
        component: 'ScanInterface',
        section: 'scan_error_boundary'
      },
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
        scan: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          errorType: this.categorizeError(error.message)
        }
      },
      extra: {
        errorInfo,
        props: this.props
      }
    });

    this.setState({
      errorInfo: error.message,
      errorId: sentryId || errorId
    });

    // Show error toast with scan context
    showToast.error('Scan interface failed to load. Check your API keys and try again.', {
      style: {
        background: '#FF4D4F',
        color: 'white',
      }
    });
  }

  private categorizeError(errorMessage: string): string {
    if (errorMessage.includes('API') || errorMessage.includes('key')) {
      return 'api_configuration';
    }
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'network_error';
    }
    if (errorMessage.includes('rate') || errorMessage.includes('limit')) {
      return 'rate_limit';
    }
    return 'unknown';
  }

  private handleRetry = () => {
    // Reset error state
    this.setState({ 
      hasError: false, 
      errorInfo: null,
      errorId: null 
    });

    // Call custom retry handler if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }

    // Track retry attempt
    Sentry.addBreadcrumb({
      message: 'Scan interface error boundary retry attempted',
      level: 'info',
      data: {
        timestamp: new Date().toISOString()
      }
    });
  };

  private handleNavigateToSettings = () => {
    if (this.props.onNavigateToSettings) {
      this.props.onNavigateToSettings();
    }
  };

  private handleRefreshPage = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isApiError = this.state.errorInfo?.includes('API') || this.state.errorInfo?.includes('key');
      
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="w-12 h-12 text-destructive" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">
                Scan Interface Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                We encountered an issue with the scan interface. Common causes include:
              </p>
              <ul className="text-sm text-muted-foreground text-left space-y-1">
                <li>• Missing or invalid API keys</li>
                <li>• Rate limit exceeded</li>
                <li>• Network connectivity issues</li>
                <li>• Server configuration problems</li>
              </ul>
              
              {this.state.errorInfo && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  Error: {this.state.errorInfo}
                </div>
              )}

              {this.state.errorId && (
                <div className="text-xs text-muted-foreground">
                  Error ID: {this.state.errorId}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={this.handleRetry}
                    variant="default"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry Scan
                  </Button>
                  <Button 
                    onClick={this.handleRefreshPage}
                    variant="outline"
                    size="sm"
                  >
                    Refresh Page
                  </Button>
                </div>
                
                {isApiError && this.props.onNavigateToSettings && (
                  <Button 
                    onClick={this.handleNavigateToSettings}
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Check API Settings
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                If this problem persists, please contact support with the error ID above.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ScanInterfaceErrorBoundary;
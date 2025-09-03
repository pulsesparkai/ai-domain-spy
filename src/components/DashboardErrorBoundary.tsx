import React, { Component, ReactNode } from 'react';
import { showToast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  errorInfo: string | null;
  errorId: string | null;
}

class DashboardErrorBoundary extends Component<Props, State> {
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
    console.error('Dashboard error caught by boundary:', error, errorInfo);
    
    // Log to Sentry with dashboard-specific context
    const sentryId = Sentry.captureException(error, {
      tags: {
        component: 'Dashboard',
        section: 'dashboard_error_boundary'
      },
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
        dashboard: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
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

    // Show error toast with dashboard context
    showToast.error('Dashboard failed to load. Try refreshing the data.', {
      style: {
        background: '#F44336',
        color: 'white',
      }
    });
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
      message: 'Dashboard error boundary retry attempted',
      level: 'info',
      data: {
        timestamp: new Date().toISOString()
      }
    });
  };

  private handleRefreshPage = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="w-12 h-12 text-destructive" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">
                Dashboard Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                We're having trouble loading your dashboard data. This could be due to:
              </p>
              <ul className="text-sm text-muted-foreground text-left space-y-1">
                <li>• Network connectivity issues</li>
                <li>• Temporary server problems</li>
                <li>• Invalid scan data format</li>
                <li>• Missing API configurations</li>
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

              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={this.handleRetry}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Loading
                </Button>
                <Button 
                  onClick={this.handleRefreshPage}
                  variant="outline"
                  size="sm"
                >
                  Refresh Page
                </Button>
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

export default DashboardErrorBoundary;
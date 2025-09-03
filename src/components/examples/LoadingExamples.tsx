import React, { useState } from 'react';
import { LoadingOverlay, ProgressIndicator } from '@/components/ui/loading-skeletons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Example usage of loading components
export const LoadingExamples = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const simulateLoading = () => {
    setIsLoading(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsLoading(false);
          return 0;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="space-y-8 p-8">
      <h2 className="text-2xl font-bold">Loading States Examples</h2>
      
      {/* Progress Indicator */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Progress Indicators</h3>
        <div className="space-y-4 max-w-md">
          <ProgressIndicator progress={25} label="Data Processing" color="primary" />
          <ProgressIndicator progress={60} label="Building Charts" color="accent" />
          <ProgressIndicator progress={90} label="Almost Done" color="success" />
          <ProgressIndicator progress={100} label="Complete!" color="success" />
        </div>
      </div>

      {/* Loading Overlay */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Loading Overlay</h3>
        <div className="flex gap-4">
          <Button onClick={simulateLoading} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Start Loading'}
          </Button>
        </div>
        
        <LoadingOverlay 
          isLoading={isLoading} 
          message="Processing your data..." 
          progress={progress}
        >
          <Card className="h-64">
            <CardHeader>
              <CardTitle>Sample Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This content will be overlaid with a loading spinner when loading.</p>
              <p>The loading overlay includes a progress bar and custom message.</p>
            </CardContent>
          </Card>
        </LoadingOverlay>
      </div>

      {/* Different Loading States */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Loading States Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before: Basic loading */}
          <div>
            <h4 className="font-medium mb-3">Before: Basic Loading</h4>
            <div className="animate-pulse bg-muted h-32 rounded"></div>
          </div>
          
          {/* After: Enhanced loading */}
          <div>
            <h4 className="font-medium mb-3">After: Enhanced Loading</h4>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="h-32 bg-muted relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
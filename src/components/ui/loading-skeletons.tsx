import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Enhanced Loading Skeleton Components

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button' | 'badge';
  lines?: number;
  width?: 'full' | '3/4' | '1/2' | '1/3' | '1/4';
  height?: string;
  animate?: boolean;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  variant = 'default',
  lines = 1,
  width = 'full',
  height,
  animate = true
}) => {
  const widthClasses = {
    'full': 'w-full',
    '3/4': 'w-3/4',
    '1/2': 'w-1/2', 
    '1/3': 'w-1/3',
    '1/4': 'w-1/4'
  };

  const variantClasses = {
    'default': 'h-4',
    'card': 'h-32',
    'text': 'h-4',
    'avatar': 'w-10 h-10 rounded-full',
    'button': 'h-10 w-24 rounded-md',
    'badge': 'h-6 w-16 rounded-full'
  };

  if (variant === 'card') {
    return (
      <Card className={cn("overflow-hidden", animate && "animate-pulse", className)}>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: lines }).map((_, i) => (
              <Skeleton key={i} className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (lines > 1) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              variantClasses[variant],
              i === lines - 1 ? "w-2/3" : widthClasses[width],
              !animate && "animate-none"
            )}
            style={{ height }}
          />
        ))}
      </div>
    );
  }

  return (
    <Skeleton
      className={cn(
        variantClasses[variant],
        widthClasses[width],
        !animate && "animate-none",
        className
      )}
      style={{ height }}
    />
  );
};

// Dashboard-specific skeleton components

export const DashboardCardSkeleton: React.FC<{ title?: boolean; chart?: boolean }> = ({ 
  title = true, 
  chart = false 
}) => (
  <Card className="overflow-hidden animate-fade-in">
    <CardHeader className="space-y-2">
      {title && (
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded-sm" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="w-4 h-4 rounded-full" />
        </div>
      )}
    </CardHeader>
    <CardContent>
      {chart ? (
        <div className="h-64 flex items-center justify-center">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-16 mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

export const AIVisibilityScoreSkeleton = () => (
  <Card className="overflow-hidden animate-fade-in">
    <CardHeader>
      <div className="flex items-center gap-2">
        <Skeleton className="w-5 h-5 rounded-sm" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="w-4 h-4 rounded-full" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-center space-y-4">
        <div className="relative">
          <Skeleton className="w-32 h-32 rounded-full mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="h-8 w-12" />
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <Skeleton className="h-full w-3/4 rounded-full" />
        </div>
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </CardContent>
  </Card>
);

export const SentimentAnalysisSkeleton = () => (
  <Card className="overflow-hidden animate-fade-in">
    <CardHeader>
      <div className="flex items-center gap-2">
        <Skeleton className="w-5 h-5 rounded-sm" />
        <Skeleton className="h-6 w-36" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="h-64 flex items-center justify-center">
          <Skeleton className="w-40 h-40 rounded-full" />
        </div>
        <div className="flex justify-center space-x-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

export const CitationsTrackingSkeleton = () => (
  <Card className="overflow-hidden animate-fade-in">
    <CardHeader>
      <div className="flex items-center gap-2">
        <Skeleton className="w-5 h-5 rounded-sm" />
        <Skeleton className="h-6 w-36" />
        <Skeleton className="w-4 h-4 rounded-full" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-16 mx-auto" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
        
        {/* Mobile view skeleton */}
        <div className="block sm:hidden space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 border border-border rounded-lg bg-card">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-6 w-8 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop view skeleton */}
        <div className="hidden sm:block space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2 px-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-8 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

export const AIRankingsSkeleton = () => (
  <Card className="overflow-hidden animate-fade-in">
    <CardHeader>
      <div className="flex items-center gap-2">
        <Skeleton className="w-5 h-5 rounded-sm" />
        <Skeleton className="h-6 w-28" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-3 sm:p-4 bg-card">
            <Skeleton className="h-4 w-full mb-3" />
            
            {/* Desktop view skeleton */}
            <div className="hidden sm:grid sm:grid-cols-2 gap-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            </div>

            {/* Mobile view skeleton */}
            <div className="block sm:hidden space-y-2">
              <div className="flex justify-between items-center py-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
              <div className="flex justify-between items-center py-2 border-t border-border">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export const TrendingPagesSkeleton = () => (
  <Card className="overflow-hidden animate-fade-in">
    <CardHeader>
      <div className="flex items-center gap-2">
        <Skeleton className="w-5 h-5 rounded-sm" />
        <Skeleton className="h-6 w-32" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="w-4 h-4" />
            </div>
            {/* Expanded content skeleton */}
            <div className="pl-4 space-y-2">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="border rounded-lg p-3 bg-card">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Progress indicator component
interface ProgressIndicatorProps {
  progress: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'accent';
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  label,
  size = 'md',
  color = 'primary'
}) => {
  const sizeClasses = {
    'sm': 'h-1',
    'md': 'h-2', 
    'lg': 'h-3'
  };

  const colorClasses = {
    'primary': 'bg-primary',
    'success': 'bg-success',
    'warning': 'bg-warning',
    'accent': 'bg-accent'
  };

  return (
    <div className="w-full space-y-2">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
      )}
      <div className={cn("w-full bg-muted rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out rounded-full",
            colorClasses[color]
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

// Loading overlay component
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = "Loading...",
  progress,
  children
}) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-lg">
          <div className="bg-card border border-border rounded-lg p-6 shadow-lg max-w-sm w-full mx-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-6 h-6 rounded-full animate-spin" />
                <span className="text-sm font-medium">{message}</span>
              </div>
              {typeof progress === 'number' && (
                <ProgressIndicator progress={progress} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
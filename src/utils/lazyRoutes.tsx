// Dynamic route imports with proper chunking and preloading
import { lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Route loading skeleton
const RouteLoadingSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Lazy route components with named chunks
export const LazyIndex = lazy(() => 
  import(/* webpackChunkName: "route-index" */ '../pages/Index')
);

export const LazyAuth = lazy(() => 
  import(/* webpackChunkName: "route-auth" */ '../pages/Auth')
);

export const LazyDashboard = lazy(() => 
  import(/* webpackChunkName: "route-dashboard" */ '../pages/Dashboard')
);

export const LazyScan = lazy(() => 
  import(/* webpackChunkName: "route-scan" */ '../pages/Scan')
);

export const LazyPricing = lazy(() => 
  import(/* webpackChunkName: "route-pricing" */ '../pages/Pricing')
);

export const LazySettings = lazy(() => 
  import(/* webpackChunkName: "route-settings" */ '../pages/Settings')
);

export const LazySuccess = lazy(() => 
  import(/* webpackChunkName: "route-success" */ '../pages/Success')
);

export const LazyCancel = lazy(() => 
  import(/* webpackChunkName: "route-cancel" */ '../pages/Cancel')
);

export const LazyNotFound = lazy(() => 
  import(/* webpackChunkName: "route-notfound" */ '../pages/NotFound')
);

export const LazyPasswordReset = lazy(() => 
  import(/* webpackChunkName: "route-password-reset" */ '../components/PasswordReset').then(module => ({
    default: module.PasswordReset
  }))
);

export const LazyPerplexityOptimization = lazy(() => 
  import(/* webpackChunkName: "route-perplexity-optimization" */ '../pages/PerplexityOptimization')
);

// Route preloading utilities
export const preloadCriticalRoutes = () => {
  // Preload routes that users are likely to visit
  const criticalRoutes = [LazyAuth, LazyDashboard, LazyScan];
  
  criticalRoutes.forEach(route => {
    // Preload after a short delay to not block initial render
    setTimeout(() => {
      // @ts-ignore - accessing internal properties for preloading
      route._payload?.();
    }, 100);
  });
};

// Preload routes on user interaction
export const preloadOnHover = (routeName: keyof typeof routeMap) => {
  const route = routeMap[routeName];
  if (route) {
    // @ts-ignore - accessing internal properties for preloading
    route._payload?.();
  }
};

// Route map for easy access
export const routeMap = {
  index: LazyIndex,
  auth: LazyAuth,
  dashboard: LazyDashboard,
  scan: LazyScan,
  pricing: LazyPricing,
  settings: LazySettings,
  success: LazySuccess,
  cancel: LazyCancel,
  notFound: LazyNotFound,
  passwordReset: LazyPasswordReset,
  perplexityOptimization: LazyPerplexityOptimization,
} as const;

// Export loading skeleton for routes
export { RouteLoadingSkeleton };
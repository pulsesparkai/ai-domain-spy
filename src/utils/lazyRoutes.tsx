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

export const LazyAbout = lazy(() => 
  import(/* webpackChunkName: "route-about" */ '../pages/About')
);

export const LazyContact = lazy(() => 
  import(/* webpackChunkName: "route-contact" */ '../pages/Contact')
);

export const LazyNotFound = lazy(() => 
  import(/* webpackChunkName: "route-notfound" */ '../pages/NotFound')
);

export const LazyPasswordReset = lazy(() => 
  import(/* webpackChunkName: "route-password-reset" */ '../components/PasswordReset').then(module => ({
    default: module.PasswordReset
  }))
);


// Route preloading utilities - using proper React patterns
export const preloadCriticalRoutes = () => {
  // Preload routes that users are likely to visit
  const criticalRoutes = [
    () => import('../pages/Auth'),
    () => import('../pages/Dashboard'),
    () => import('../pages/Scan')
  ];
  
  criticalRoutes.forEach(importFn => {
    // Preload after a short delay to not block initial render
    setTimeout(() => {
      try {
        importFn().catch(console.warn);
      } catch (error) {
        console.warn('Failed to preload route:', error);
      }
    }, 100);
  });
};

// Preload routes on user interaction
export const preloadOnHover = (routeName: keyof typeof routeMap) => {
  const routePreloaders: Record<keyof typeof routeMap, () => Promise<any>> = {
    index: () => import('../pages/Index'),
    auth: () => import('../pages/Auth'),
    dashboard: () => import('../pages/Dashboard'),
    scan: () => import('../pages/Scan'),
    pricing: () => import('../pages/Pricing'),
    settings: () => import('../pages/Settings'),
    success: () => import('../pages/Success'),
    cancel: () => import('../pages/Cancel'),
    about: () => import('../pages/About'),
    contact: () => import('../pages/Contact'),
    notFound: () => import('../pages/NotFound'),
    passwordReset: () => import('../components/PasswordReset'),
    
  };
  
  const preloader = routePreloaders[routeName];
  if (preloader) {
    try {
      preloader().catch(console.warn);
    } catch (error) {
      console.warn(`Failed to preload route ${routeName}:`, error);
    }
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
  about: LazyAbout,
  contact: LazyContact,
  notFound: LazyNotFound,
  passwordReset: LazyPasswordReset,
  
} as const;

// Export loading skeleton for routes
export { RouteLoadingSkeleton };
// React Query configuration with Supabase optimization
import { QueryClient } from '@tanstack/react-query';
import { queryCache } from './query-optimization';

// Enhanced QueryClient with optimal defaults
export const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache queries for 5 minutes by default
        staleTime: 5 * 60 * 1000,
        // Keep data in cache for 30 minutes
        gcTime: 30 * 60 * 1000,
        // Retry failed queries up to 3 times
        retry: (failureCount, error: any) => {
          // Don't retry on auth errors
          if (error?.status === 401 || error?.status === 403) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        // Exponential backoff for retries
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Don't refetch on window focus for performance
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect unless data is stale
        refetchOnReconnect: 'always',
        // Enable background refetching for fresh data
        refetchInterval: false,
        // Network mode for better offline handling
        networkMode: 'online',
      },
      mutations: {
        // Retry mutations less aggressively
        retry: 1,
        // Network mode for mutations
        networkMode: 'online',
        // Default mutation options
        onError: (error: any) => {
          console.error('Mutation error:', error);
          // You could add toast notifications here
        },
        onSuccess: () => {
          // Invalidate relevant queries on successful mutations
          // This will be handled per mutation
        },
      },
    },
  });
};

// Query key factories for consistent cache management
export const queryKeyFactory = {
  // User-related queries
  user: {
    all: () => ['user'] as const,
    profile: (userId: string) => ['user', 'profile', userId] as const,
    scans: (userId: string) => ['user', 'scans', userId] as const,
    recentScans: (userId: string) => ['user', 'recent-scans', userId] as const,
    stats: (userId: string) => ['user', 'stats', userId] as const,
  },
  
  // Scan-related queries
  scans: {
    all: () => ['scans'] as const,
    byStatus: (status: string) => ['scans', 'status', status] as const,
    byType: (type: string) => ['scans', 'type', type] as const,
    detail: (scanId: string) => ['scans', 'detail', scanId] as const,
    results: (scanId: string) => ['scans', 'results', scanId] as const,
  },

  // Analytics queries
  analytics: {
    all: () => ['analytics'] as const,
    dashboard: (userId: string, timeRange?: string) => 
      ['analytics', 'dashboard', userId, timeRange] as const,
    trends: (timeRange: string) => ['analytics', 'trends', timeRange] as const,
  },
};

// Cache invalidation patterns
export const cacheInvalidation = {
  // Invalidate user-related data
  invalidateUser: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeyFactory.user.all() });
    // Also invalidate our custom cache
    queryCache.invalidate('profiles');
  },

  // Invalidate scan-related data
  invalidateScans: (queryClient: QueryClient, userId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeyFactory.scans.all() });
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeyFactory.user.scans(userId) });
    }
    // Also invalidate our custom cache
    queryCache.invalidate('scans');
  },

  // Invalidate analytics data
  invalidateAnalytics: (queryClient: QueryClient, userId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeyFactory.analytics.all() });
    if (userId) {
      queryClient.invalidateQueries({ 
        queryKey: queryKeyFactory.analytics.dashboard(userId) 
      });
    }
  },

  // Smart invalidation based on mutation type
  smartInvalidate: (
    queryClient: QueryClient,
    mutationType: 'scan' | 'profile' | 'settings',
    userId: string
  ) => {
    switch (mutationType) {
      case 'scan':
        cacheInvalidation.invalidateScans(queryClient, userId);
        cacheInvalidation.invalidateAnalytics(queryClient, userId);
        break;
      case 'profile':
        cacheInvalidation.invalidateUser(queryClient, userId);
        break;
      case 'settings':
        cacheInvalidation.invalidateUser(queryClient, userId);
        break;
    }
  },
};

// Prefetching strategies
export const prefetchStrategies = {
  // Prefetch user data on login
  prefetchUserData: async (queryClient: QueryClient, userId: string) => {
    const prefetchPromises = [
      // Prefetch user profile
      queryClient.prefetchQuery({
        queryKey: queryKeyFactory.user.profile(userId),
        staleTime: 2 * 60 * 1000, // 2 minutes
      }),
      
      // Prefetch recent scans
      queryClient.prefetchQuery({
        queryKey: queryKeyFactory.user.recentScans(userId),
        staleTime: 60 * 1000, // 1 minute
      }),
    ];

    await Promise.all(prefetchPromises);
  },

  // Prefetch dashboard data
  prefetchDashboard: async (queryClient: QueryClient, userId: string) => {
    const prefetchPromises = [
      // Prefetch user scans
      queryClient.prefetchQuery({
        queryKey: queryKeyFactory.user.scans(userId),
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),
      
      // Prefetch analytics
      queryClient.prefetchQuery({
        queryKey: queryKeyFactory.analytics.dashboard(userId),
        staleTime: 10 * 60 * 1000, // 10 minutes
      }),
    ];

    await Promise.all(prefetchPromises);
  },
};

// Background sync for real-time updates
export const backgroundSync = {
  // Start background sync for user data
  startUserSync: (queryClient: QueryClient, userId: string) => {
    const interval = setInterval(() => {
      // Invalidate and refetch critical data
      queryClient.invalidateQueries({ 
        queryKey: queryKeyFactory.user.recentScans(userId) 
      });
    }, 30 * 1000); // Every 30 seconds

    return () => clearInterval(interval);
  },

  // Start background sync for scan progress
  startScanProgressSync: (queryClient: QueryClient, scanId: string) => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeyFactory.scans.detail(scanId) 
      });
    }, 5 * 1000); // Every 5 seconds

    return () => clearInterval(interval);
  },
};

// Performance monitoring
export const performanceMonitor = {
  // Monitor query performance
  logSlowQueries: (threshold: number = 2000) => {
    const originalQuery = QueryClient.prototype.fetchQuery;
    
    QueryClient.prototype.fetchQuery = async function(...args) {
      const start = performance.now();
      const result = await originalQuery.apply(this, args);
      const duration = performance.now() - start;
      
      if (duration > threshold) {
        console.warn(`Slow query detected (${duration.toFixed(2)}ms):`, args[0]);
      }
      
      return result;
    };
  },

  // Get cache statistics
  getCacheStats: (queryClient: QueryClient) => {
    const cache = queryClient.getQueryCache();
    return {
      totalQueries: cache.getAll().length,
      activeQueries: cache.getAll().filter(q => q.isActive()).length,
      stalequeries: cache.getAll().filter(q => q.isStale()).length,
      customCacheSize: queryCache.size(),
    };
  },
};

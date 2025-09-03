// Optimized hooks for Supabase queries
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  OptimizedQueryBuilder, 
  OptimizedQueries, 
  queryBatcher, 
  connectionManager 
} from '@/lib/query-optimization';
import { 
  queryKeyFactory, 
  cacheInvalidation, 
  prefetchStrategies 
} from '@/lib/react-query-optimization';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useEffect } from 'react';

// Initialize query batcher with supabase client
queryBatcher['supabase'] = supabase;

// Hook for optimized user profile queries
export function useUserProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeyFactory.user.profile(user?.id || ''),
    queryFn: () => OptimizedQueries.getUserProfile(supabase, user?.id || ''),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    select: (data) => data.data, // Extract data from our optimized wrapper
  });
}

// Hook for optimized user scans with filtering and pagination
export function useUserScans(options: {
  status?: string;
  limit?: number;
  enabled?: boolean;
} = {}) {
  const { user } = useAuth();
  const { status, limit = 50, enabled = true } = options;

  return useQuery({
    queryKey: queryKeyFactory.user.scans(user?.id || ''),
    queryFn: () => OptimizedQueries.getUserScans(supabase, user?.id || '', limit, status),
    enabled: !!user?.id && enabled,
    staleTime: 60 * 1000, // 1 minute
    select: (data) => data.data,
  });
}

// Hook for recent scans with aggressive caching
export function useRecentScans() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeyFactory.user.recentScans(user?.id || ''),
    queryFn: () => OptimizedQueries.getRecentScans(supabase, user?.id || ''),
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    select: (data) => data.data,
  });
}

// Hook for scan statistics with caching
export function useScanStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeyFactory.user.stats(user?.id || ''),
    queryFn: () => OptimizedQueries.getScanStats(supabase, user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data.data,
  });
}

// Hook for individual scan details with real-time updates
export function useScanDetail(scanId: string, options: { 
  enabled?: boolean;
  realTime?: boolean;
} = {}) {
  const { enabled = true, realTime = false } = options;
  
  const query = useQuery({
    queryKey: queryKeyFactory.scans.detail(scanId),
    queryFn: async () => {
      const builder = new OptimizedQueryBuilder(supabase, 'scans');
      return builder.selectOptimized(
        'id, scan_type, status, target_url, results, created_at, updated_at',
        { id: scanId },
        { useCache: !realTime }
      );
    },
    enabled: !!scanId && enabled,
    refetchInterval: realTime ? 5000 : false, // Refetch every 5 seconds for real-time
    staleTime: realTime ? 0 : 60 * 1000,
    select: (data) => data.data?.[0],
  });

  return query;
}

// Optimized mutation hooks with smart cache invalidation
export function useCreateScan() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (scanData: {
      scan_type: string;
      target_url?: string;
      queries?: string[];
    }) => {
      return connectionManager.withConnection(async () => {
        const builder = new OptimizedQueryBuilder(supabase, 'scans');
        return builder.insertOptimized({
          ...scanData,
          user_id: user?.id,
          status: 'pending',
        }, {
          returning: 'id, scan_type, status, created_at',
        });
      });
    },
    onSuccess: () => {
      cacheInvalidation.smartInvalidate(queryClient, 'scan', user?.id || '');
    },
    onError: (error) => {
      console.error('Failed to create scan:', error);
    },
  });
}

export function useUpdateScan() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      scanId, 
      updates 
    }: { 
      scanId: string; 
      updates: Record<string, any> 
    }) => {
      return connectionManager.withConnection(async () => {
        const builder = new OptimizedQueryBuilder(supabase, 'scans');
        return builder.updateOptimized(
          updates,
          { id: scanId },
          { returning: 'id, status, updated_at' }
        );
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate specific scan and user scans
      queryClient.invalidateQueries({ 
        queryKey: queryKeyFactory.scans.detail(variables.scanId) 
      });
      cacheInvalidation.invalidateScans(queryClient, user?.id);
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      return connectionManager.withConnection(async () => {
        const builder = new OptimizedQueryBuilder(supabase, 'profiles');
        return builder.updateOptimized(
          updates,
          { user_id: user?.id },
          { returning: 'id, email, full_name, avatar_url' }
        );
      });
    },
    onSuccess: () => {
      cacheInvalidation.smartInvalidate(queryClient, 'profile', user?.id || '');
    },
  });
}

// Hook for batched queries
export function useBatchedScans(scanIds: string[]) {
  return useQuery({
    queryKey: ['scans', 'batch', scanIds.sort().join(',')],
    queryFn: async () => {
      // Use query batcher for efficient batching
      const promises = scanIds.map(id => 
        queryBatcher.batchSelect('scans', 'id, status, scan_type, created_at', { id })
      );
      
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: scanIds.length > 0,
    staleTime: 60 * 1000,
  });
}

// Hook for prefetching strategies
export function usePrefetchStrategies() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const prefetchUserData = useCallback(() => {
    if (user?.id) {
      prefetchStrategies.prefetchUserData(queryClient, user.id);
    }
  }, [queryClient, user?.id]);

  const prefetchDashboard = useCallback(() => {
    if (user?.id) {
      prefetchStrategies.prefetchDashboard(queryClient, user.id);
    }
  }, [queryClient, user?.id]);

  return { prefetchUserData, prefetchDashboard };
}

// Hook for connection monitoring
export function useConnectionStats() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['connection-stats'],
    queryFn: () => ({
      connection: connectionManager.getStats(),
      cache: {
        totalQueries: queryClient.getQueryCache().getAll().length,
        activeQueries: queryClient.getQueryCache().getAll().filter(q => q.isActive()).length,
      },
    }),
    refetchInterval: 5000, // Update every 5 seconds
    staleTime: 1000,
  });
}

// Hook for real-time sync management
export function useRealTimeSync() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Set up real-time subscription for user's scans
    const channel = supabase
      .channel('user-scans')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scans',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time scan update:', payload);
          
          // Invalidate relevant queries
          queryClient.invalidateQueries({ 
            queryKey: queryKeyFactory.user.scans(user.id) 
          });
          
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            queryClient.invalidateQueries({ 
              queryKey: queryKeyFactory.scans.detail(payload.new.id as string) 
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
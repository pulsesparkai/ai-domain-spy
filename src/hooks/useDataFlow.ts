import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStateStore } from '@/store/appStateStore';
import { useScanHistoryStore } from '@/store/scanHistoryStore';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

// Query keys for React Query
export const queryKeys = {
  scans: ['scans'] as const,
  scan: (id: string) => ['scans', id] as const,
  citations: ['citations'] as const,
  metrics: ['metrics'] as const,
  brandProfile: ['brandProfile'] as const,
  competitors: ['competitors'] as const,
  trends: ['trends'] as const
};

// Main data flow hook that coordinates all data operations
export const useDataFlow = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { 
    setLoading, 
    setError, 
    clearError, 
    updateRealtimeMetrics,
    activeScan,
    setActiveScan 
  } = useAppStateStore();
  const { loadScans } = useScanHistoryStore();

  // Fetch user's scan data with React Query
  const {
    data: scansData,
    isLoading: scansLoading,
    error: scansError,
    refetch: refetchScans
  } = useQuery({
    queryKey: queryKeys.scans,
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  // Fetch real-time metrics
  const { data: metricsData } = useQuery({
    queryKey: queryKeys.metrics,
    queryFn: async () => {
      if (!user || !scansData?.length) return null;

      const completedScans = scansData.filter(scan => scan.status === 'completed');
      const totalCitations = completedScans.reduce((acc, scan) => {
        const citations = Array.isArray(scan.citations) ? scan.citations : [];
        return acc + citations.length;
      }, 0);
      
      const platforms = new Set();
      completedScans.forEach(scan => {
        const citations = Array.isArray(scan.citations) ? scan.citations : [];
        citations.forEach((citation: any) => {
          if (citation && typeof citation === 'object' && citation.platform) {
            platforms.add(citation.platform);
          }
        });
      });

      return {
        visibilityScore: completedScans.length > 0 ? 
          Math.round(completedScans.reduce((acc, scan) => {
            const results = scan.results as any;
            return acc + (results?.visibility_score || 0);
          }, 0) / completedScans.length) : 0,
        citationsCount: totalCitations,
        mentionsCount: completedScans.reduce((acc, scan) => {
          const results = scan.results as any;
          return acc + (results?.mentions_count || 0);
        }, 0),
        activePlatforms: Array.from(platforms) as string[]
      };
    },
    enabled: !!user && !!scansData,
    refetchInterval: 60000 // Update every minute
  });

  // Create scan mutation
  const createScanMutation = useMutation({
    mutationFn: async (scanData: any) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('scans')
        .insert({
          user_id: user.id,
          ...scanData,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scans });
      setActiveScan(data);
      toast({
        title: "Scan Created",
        description: "Your scan has been initiated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create scan: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Update scan mutation
  const updateScanMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('scans')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scans });
      queryClient.invalidateQueries({ queryKey: queryKeys.scan(data.id) });
      
      if (activeScan?.id === data.id) {
        setActiveScan(data);
      }
    }
  });

  // Sync global loading state
  useEffect(() => {
    setLoading(scansLoading || createScanMutation.isPending || updateScanMutation.isPending);
  }, [scansLoading, createScanMutation.isPending, updateScanMutation.isPending, setLoading]);

  // Sync global error state
  useEffect(() => {
    if (scansError) {
      setError(scansError.message);
    } else {
      clearError();
    }
  }, [scansError, setError, clearError]);

  // Update real-time metrics
  useEffect(() => {
    if (metricsData) {
      updateRealtimeMetrics(metricsData);
    }
  }, [metricsData, updateRealtimeMetrics]);

  // Real-time subscription for scan updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('scan-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scans',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.scans });
          queryClient.invalidateQueries({ queryKey: queryKeys.metrics });
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedScan = payload.new;
            if (activeScan?.id === updatedScan.id) {
              setActiveScan(updatedScan);
            }
            
            if (updatedScan.status === 'completed') {
              toast({
                title: "Scan Complete",
                description: `Your ${updatedScan.scan_type} scan has finished`
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, activeScan, setActiveScan]);

  // Prefetch strategies
  const prefetchScanDetails = useCallback((scanId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.scan(scanId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('scans')
          .select('*')
          .eq('id', scanId)
          .single();

        if (error) throw error;
        return data;
      },
      staleTime: 60000
    });
  }, [queryClient]);

  return {
    // Data
    scansData,
    metricsData,
    
    // Loading states
    isLoading: scansLoading || createScanMutation.isPending || updateScanMutation.isPending,
    
    // Mutations
    createScan: createScanMutation.mutate,
    updateScan: updateScanMutation.mutate,
    
    // Utilities
    refetchScans,
    prefetchScanDetails,
    
    // Query client for advanced operations
    queryClient
  };
};
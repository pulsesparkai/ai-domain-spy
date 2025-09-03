import { useEffect } from 'react';
import { useScanHistoryStore, useUserPreferencesStore } from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to sync Zustand stores with Supabase data
 * Handles real-time updates and initial data loading
 */
export const useStoreSync = () => {
  const { user } = useAuth();
  const { syncWithBackend, setLoading, setError } = useScanHistoryStore();
  const { updatePreferences } = useUserPreferencesStore();

  // Sync scan history with Supabase
  useEffect(() => {
    if (!user) return;

    const loadScanHistory = async () => {
      setLoading(true);
      try {
        const { data: scans, error } = await supabase
          .from('scans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        if (scans) {
          const formattedScans = scans.map(scan => ({
            id: scan.id,
            userId: scan.user_id,
            scanType: scan.scan_type,
            targetUrl: scan.target_url,
            queries: [], // Would need to be stored separately or parsed
            results: scan.results,
            status: scan.status as 'pending' | 'completed' | 'failed',
            createdAt: scan.created_at,
            updatedAt: scan.updated_at,
          }));

          syncWithBackend(formattedScans);
        }
      } catch (error) {
        console.error('Failed to load scan history:', error);
        setError(error instanceof Error ? error.message : 'Failed to load scan history');
      } finally {
        setLoading(false);
      }
    };

    loadScanHistory();

    // Set up real-time subscription for scans
    const scansChannel = supabase
      .channel('scans-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scans',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Scan change detected:', payload);
          // Reload scan history on any change
          loadScanHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(scansChannel);
    };
  }, [user, syncWithBackend, setLoading, setError]);

  // Sync user preferences with profile data
  useEffect(() => {
    if (!user) return;

    const loadUserPreferences = async () => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
          throw error;
        }

        if (profile) {
          // Map profile data to preferences if available
          // This would depend on how preferences are stored in the profile
          console.log('User profile loaded:', profile);
        }
      } catch (error) {
        console.error('Failed to load user preferences:', error);
      }
    };

    loadUserPreferences();
  }, [user, updatePreferences]);

  return {
    isInitialized: !!user
  };
};
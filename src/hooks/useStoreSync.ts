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
  const { loadScans } = useScanHistoryStore();
  const { updatePreferences } = useUserPreferencesStore();

  // Sync scan history with Supabase using optimized queries
  useEffect(() => {
    if (!user) return;

    loadScans();

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
          loadScans();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(scansChannel);
    };
  }, [user, loadScans]);

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
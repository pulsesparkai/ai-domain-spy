import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface ActivityItem {
  id: string;
  type: 'citation' | 'score_change' | 'mention' | 'scan_complete';
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export interface RealtimeMetrics {
  visibilityScore: number;
  citationsCount: number;
  mentionsCount: number;
  activePlatforms: string[];
}

export const useRealtimeMonitoring = () => {
  const { user } = useAuth();
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    visibilityScore: 0,
    citationsCount: 0,
    mentionsCount: 0,
    activePlatforms: []
  });
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  // Load real data from scans instead of mock data
  useEffect(() => {
    if (!user) return;
    
    // Initialize with empty state - will be populated by real scan data
    setActivityFeed([]);
    setMetrics({
      visibilityScore: 0,
      citationsCount: 0,
      mentionsCount: 0,
      activePlatforms: []
    });
  }, [user]);

  // Real-time subscription to scans table for completed scans
  useEffect(() => {
    if (!user) return;

    const scansChannel = supabase
      .channel('scan-completions')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scans',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const scan = payload.new as any;
          if (scan.status === 'completed') {
            const newActivity: ActivityItem = {
              id: `scan_${scan.id}`,
              type: 'scan_complete',
              title: 'Scan completed',
              description: `Analysis finished for ${scan.target_url || 'your content'}`,
              timestamp: new Date().toISOString(),
              metadata: { scanId: scan.id, url: scan.target_url }
            };

            setActivityFeed(prev => [newActivity, ...prev.slice(0, 19)]);
            setHasNewNotifications(true);

            toast({
              title: "Scan Complete!",
              description: `Your AI visibility scan has finished processing`,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(scansChannel);
    };
  }, [user]);

  const markNotificationsAsRead = () => {
    setHasNewNotifications(false);
  };

  const clearActivityFeed = () => {
    setActivityFeed([]);
    setHasNewNotifications(false);
  };

  return {
    activityFeed,
    metrics,
    hasNewNotifications,
    markNotificationsAsRead,
    clearActivityFeed
  };
};
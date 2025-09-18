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

  // Simulate real-time updates (in production, this would be WebSocket or Server-Sent Events)
  useEffect(() => {
    if (!user) return;

    const simulateRealtimeUpdates = () => {
      const newActivity: ActivityItem = {
        id: `activity_${Date.now()}`,
        type: 'citation',
        title: 'New citation found on Perplexity',
        description: 'Your content was referenced in an AI response about "AI visibility strategies"',
        timestamp: new Date().toISOString(),
        metadata: { platform: 'Perplexity', query: 'AI visibility strategies' }
      };

      setActivityFeed(prev => [newActivity, ...prev.slice(0, 19)]); // Keep last 20 items
      setHasNewNotifications(true);
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        citationsCount: prev.citationsCount + 1,
        visibilityScore: Math.min(100, prev.visibilityScore + Math.floor(Math.random() * 3))
      }));

      // Show toast notification
      toast({
        title: "New Citation Detected!",
        description: "Your content was referenced on Perplexity AI",
        duration: 5000,
      });
    };

    // Simulate updates every 30 seconds
    const interval = setInterval(simulateRealtimeUpdates, 30000);

    // Add initial mock data
    const mockActivities: ActivityItem[] = [
      {
        id: 'activity_1',
        type: 'score_change',
        title: 'Visibility score increased',
        description: 'Your AI visibility score increased by 5 points',
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
        metadata: { change: +5, newScore: 87 }
      },
      {
        id: 'activity_2',
        type: 'citation',
        title: 'New citation found on ChatGPT',
        description: 'Your content was referenced in response about "content marketing"',
        timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min ago
        metadata: { platform: 'ChatGPT', query: 'content marketing' }
      },
      {
        id: 'activity_3',
        type: 'mention',
        title: 'Brand mentioned on Reddit',
        description: 'Your brand was discussed in r/technology',
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        metadata: { platform: 'Reddit', subreddit: 'technology' }
      }
    ];

    setActivityFeed(mockActivities);
    setMetrics({
      visibilityScore: 87,
      citationsCount: 24,
      mentionsCount: 156,
      activePlatforms: ['Perplexity', 'ChatGPT', 'Claude', 'Reddit']
    });

    return () => clearInterval(interval);
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
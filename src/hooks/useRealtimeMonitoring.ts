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

    const activities = [
      {
        type: 'citation' as const,
        title: 'New citation found on Perplexity',
        description: 'Your content was referenced in an AI response about "AI tools comparison"',
        platform: 'Perplexity'
      },
      {
        type: 'score_change' as const,
        title: 'Visibility score increased',
        description: 'Your AI visibility score increased by 2 points',
        change: 2
      },
      {
        type: 'mention' as const,
        title: 'Brand mentioned on Reddit',
        description: 'Your brand was discussed in r/MachineLearning',
        platform: 'Reddit'
      },
      {
        type: 'citation' as const,
        title: 'New ranking on ChatGPT',
        description: 'Your content ranked #1 for "best AI tools"',
        platform: 'ChatGPT'
      },
      {
        type: 'scan_complete' as const,
        title: 'Competitor analysis completed',
        description: 'Analysis finished for competitive landscape scanning'
      },
      {
        type: 'score_change' as const,
        title: 'Visibility score decreased',
        description: 'Your AI visibility score decreased by 1 point',
        change: -1
      },
      {
        type: 'citation' as const,
        title: 'Featured in Claude response',
        description: 'Your content was featured in a Claude AI analysis',
        platform: 'Claude'
      }
    ];

    const simulateRealtimeUpdates = () => {
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      
      const newActivity: ActivityItem = {
        id: `activity_${Date.now()}_${Math.random()}`,
        type: randomActivity.type,
        title: randomActivity.title,
        description: randomActivity.description,
        timestamp: new Date().toISOString(),
        metadata: {
          platform: randomActivity.platform,
          change: randomActivity.change
        }
      };

      setActivityFeed(prev => [newActivity, ...prev.slice(0, 19)]); // Keep last 20 items
      setHasNewNotifications(true);
      
      // Update metrics based on activity type
      if (randomActivity.type === 'citation') {
        setMetrics(prev => ({
          ...prev,
          citationsCount: prev.citationsCount + 1,
          visibilityScore: Math.min(100, prev.visibilityScore + Math.random() * 3)
        }));
      } else if (randomActivity.type === 'score_change') {
        setMetrics(prev => ({
          ...prev,
          visibilityScore: Math.max(0, Math.min(100, prev.visibilityScore + (randomActivity.change || 0)))
        }));
      } else if (randomActivity.type === 'mention') {
        setMetrics(prev => ({
          ...prev,
          mentionsCount: prev.mentionsCount + 1
        }));
      }

      // Show toast notification for important activities
      if (randomActivity.type === 'citation' || randomActivity.type === 'score_change') {
        toast({
          title: randomActivity.title,
          description: randomActivity.description,
          duration: 4000,
        });
      }
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
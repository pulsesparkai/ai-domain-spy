import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface HistoricalData {
  date: string;
  visibilityScore: number;
  citationsCount: number;
  mentionsCount: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface TrendData {
  period: 'daily' | 'weekly' | 'monthly';
  data: HistoricalData[];
  growth: {
    visibilityScore: number;
    citationsCount: number;
    mentionsCount: number;
  };
}

export const useHistoricalTracking = (period: 'daily' | 'weekly' | 'monthly' = 'daily') => {
  const { user } = useAuth();

  // Fetch historical scan data
  const { data: historicalScans, isLoading } = useQuery({
    queryKey: ['historical-scans', user?.id, period],
    queryFn: async () => {
      if (!user) return [];

      const daysBack = period === 'daily' ? 30 : period === 'weekly' ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 300000, // 5 minutes
  });

  // Process historical data into trends
  const trendData = useMemo<TrendData | null>(() => {
    if (!historicalScans || historicalScans.length === 0) return null;

    const groupedData = new Map<string, any[]>();
    
    historicalScans.forEach(scan => {
      const date = new Date(scan.created_at);
      let key: string;
      
      if (period === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!groupedData.has(key)) {
        groupedData.set(key, []);
      }
      groupedData.get(key)!.push(scan);
    });

    const processedData: HistoricalData[] = Array.from(groupedData.entries()).map(([date, scans]) => {
      const avgVisibilityScore = scans.reduce((sum, scan) => 
        sum + (scan.results?.visibility_score || 0), 0) / scans.length;
      
      const totalCitations = scans.reduce((sum, scan) => 
        sum + (scan.citations?.length || 0), 0);
      
      const totalMentions = scans.reduce((sum, scan) => 
        sum + (scan.results?.mentions_count || 0), 0);

      // Calculate average sentiment
      const sentiments = scans.map(scan => scan.sentiment?.overall || 'neutral');
      const sentimentCounts = sentiments.reduce((acc, sentiment) => {
        acc[sentiment] = (acc[sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const dominantSentiment = Object.entries(sentimentCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] as 'positive' | 'negative' | 'neutral' || 'neutral';

      return {
        date,
        visibilityScore: Math.round(avgVisibilityScore),
        citationsCount: totalCitations,
        mentionsCount: totalMentions,
        sentiment: dominantSentiment
      };
    }).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate growth rates
    const calculateGrowth = (values: number[]) => {
      if (values.length < 2) return 0;
      const recent = values.slice(-7).reduce((a: number, b: number) => a + b, 0) / Math.min(7, values.length);
      const previous = values.slice(-14, -7).reduce((a: number, b: number) => a + b, 0) / Math.min(7, values.slice(-14, -7).length);
      return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
    };

    const growth = {
      visibilityScore: calculateGrowth(processedData.map(d => d.visibilityScore)),
      citationsCount: calculateGrowth(processedData.map(d => d.citationsCount)),
      mentionsCount: calculateGrowth(processedData.map(d => d.mentionsCount))
    };

    return {
      period,
      data: processedData,
      growth
    };
  }, [historicalScans, period]);

  // Calculate streak data
  const streakData = useMemo(() => {
    if (!trendData) return null;

    const now = new Date();
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    // Check for daily activity streak
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(now.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const hasActivity = trendData.data.some(d => d.date === dateStr && d.citationsCount > 0);
      
      if (hasActivity) {
        if (i === 0) currentStreak++;
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        if (i === 0) currentStreak = 0;
        tempStreak = 0;
      }
    }

    return {
      currentStreak,
      maxStreak,
      lastActivity: trendData.data.length > 0 ? trendData.data[trendData.data.length - 1].date : null
    };
  }, [trendData]);

  return {
    trendData,
    streakData,
    isLoading,
    rawData: historicalScans
  };
};
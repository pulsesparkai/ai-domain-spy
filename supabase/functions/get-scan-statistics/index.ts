// Database statistics and optimization edge function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StatisticsRequest {
  target_user_id: string;
  include_cache_stats?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { target_user_id, include_cache_stats = false }: StatisticsRequest = await req.json();

    console.log(`Computing statistics for user: ${target_user_id}`);

    // Get scan statistics using optimized queries
    const scanStatsPromise = supabase
      .from('scans')
      .select('status, scan_type, created_at')
      .eq('user_id', target_user_id);

    const profileStatsPromise = supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, created_at')
      .eq('user_id', target_user_id)
      .single();

    // Execute queries in parallel
    const [scanStatsResult, profileStatsResult] = await Promise.all([
      scanStatsPromise,
      profileStatsPromise,
    ]);

    if (scanStatsResult.error) {
      throw scanStatsResult.error;
    }

    const scans = scanStatsResult.data || [];
    const profile = profileStatsResult.data;

    // Compute aggregated statistics
    const stats = {
      scan_statistics: {
        total_scans: scans.length,
        scans_by_status: scans.reduce((acc: any, scan) => {
          acc[scan.status] = (acc[scan.status] || 0) + 1;
          return acc;
        }, {}),
        scans_by_type: scans.reduce((acc: any, scan) => {
          acc[scan.scan_type] = (acc[scan.scan_type] || 0) + 1;
          return acc;
        }, {}),
        recent_activity: {
          last_7_days: scans.filter(scan => {
            const scanDate = new Date(scan.created_at);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return scanDate >= weekAgo;
          }).length,
          last_30_days: scans.filter(scan => {
            const scanDate = new Date(scan.created_at);
            const monthAgo = new Date();
            monthAgo.setDate(monthAgo.getDate() - 30);
            return scanDate >= monthAgo;
          }).length,
        },
        success_rate: scans.length > 0 
          ? (scans.filter(scan => scan.status === 'completed').length / scans.length) * 100 
          : 0,
      },
      user_profile: {
        subscription_status: profile?.subscription_status || 'trial',
        trial_ends_at: profile?.trial_ends_at,
        account_age_days: profile ? 
          Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      },
      performance_metrics: await getPerformanceMetrics(supabase, target_user_id),
      computed_at: new Date().toISOString(),
    };

    // Add cache statistics if requested
    if (include_cache_stats) {
      stats['cache_statistics'] = await getCacheStatistics(supabase);
    }

    return new Response(
      JSON.stringify(stats),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Statistics computation error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

async function getPerformanceMetrics(supabase: any, userId: string) {
  try {
    // Get average scan completion time
    const { data: completedScans } = await supabase
      .from('scans')
      .select('created_at, updated_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!completedScans || completedScans.length === 0) {
      return {
        average_completion_time_minutes: 0,
        fastest_scan_minutes: 0,
        slowest_scan_minutes: 0,
        total_completed_scans: 0,
      };
    }

    const completionTimes = completedScans.map(scan => {
      const start = new Date(scan.created_at);
      const end = new Date(scan.updated_at);
      return (end.getTime() - start.getTime()) / (1000 * 60); // Convert to minutes
    });

    return {
      average_completion_time_minutes: completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length,
      fastest_scan_minutes: Math.min(...completionTimes),
      slowest_scan_minutes: Math.max(...completionTimes),
      total_completed_scans: completedScans.length,
    };
  } catch (error) {
    console.error('Performance metrics error:', error);
    return {
      average_completion_time_minutes: 0,
      fastest_scan_minutes: 0,
      slowest_scan_minutes: 0,
      total_completed_scans: 0,
      error: error.message,
    };
  }
}

async function getCacheStatistics(supabase: any) {
  try {
    // Get table statistics
    const tablesPromise = supabase.rpc('get_table_stats');
    
    // Get index usage statistics
    const indexStatsPromise = supabase.rpc('get_index_usage_stats');

    const [tablesResult, indexStatsResult] = await Promise.all([
      tablesPromise,
      indexStatsResult,
    ]);

    return {
      table_statistics: tablesResult.data || [],
      index_usage: indexStatsResult.data || [],
      computed_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Cache statistics error:', error);
    return {
      error: error.message,
      computed_at: new Date().toISOString(),
    };
  }
}
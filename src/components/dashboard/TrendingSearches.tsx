import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

export const TrendingSearches = () => {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchTrends();
  }, []);
  
  const fetchTrends = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const response = await fetch('https://api.pulsespark.ai/api/trending-searches', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.trends) {
          setTrends(data.trends);
        }
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending Perplexity Searches
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading trends...</p>
        ) : (
          <div className="space-y-2">
            {trends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <span>{trend.query}</span>
                <Badge variant={trend.volumeEst === 'high' ? 'default' : 'secondary'}>
                  {trend.volumeEst}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
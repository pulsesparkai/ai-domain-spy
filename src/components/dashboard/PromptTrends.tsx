import { memo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PromptTrendsProps {
  scanData?: any;
}

export const PromptTrends = memo(({ scanData }: PromptTrendsProps) => {
  const [trendsData, setTrendsData] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTrends = async () => {
      if (!user || !scanData) return;
      
      try {
        // Get previous scan for comparison
        const query = supabase
          .from('scans')
          .select('results')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        // Only add id condition if it exists and is not undefined
        if (scanData.id && scanData.id !== 'undefined') {
          query.neq('id', scanData.id);
        }

        const { data: previousScans } = await query;

        if (previousScans && previousScans.length > 0) {
          const previousResults = previousScans[0].results as any;
          const currentQueries = scanData.results?.map((r: any) => r.query) || [];
          const previousQueries = previousResults?.results?.map((r: any) => r.query) || [];
          
          const gained = currentQueries.filter((q: string) => !previousQueries.includes(q));
          const lost = previousQueries.filter((q: string) => !currentQueries.includes(q));
          
          setTrendsData({ gained, lost });
        }
      } catch (error) {
        console.error('Error fetching trends:', error);
      }
    };

    fetchTrends();
  }, [user, scanData]);

  return (
    <Card className="shadow-card animate-fade-in">
      <CardHeader>
        <CardTitle className="text-h3 flex items-center gap-2">
          <Search className="w-5 h-5 text-accent" />
          Prompt Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        {trendsData ? (
          <div className="space-y-4">
            {trendsData.gained.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 text-green-600 flex items-center">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  Gained Queries
                </h4>
                {trendsData.gained.map((query: string, index: number) => (
                  <div key={index} className="text-sm bg-green-50 p-2 rounded hover-scale">
                    {query}
                  </div>
                ))}
              </div>
            )}
            {trendsData.lost.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 text-red-600 flex items-center">
                  <ArrowDown className="w-4 h-4 mr-1" />
                  Lost Queries
                </h4>
                {trendsData.lost.map((query: string, index: number) => (
                  <div key={index} className="text-sm bg-red-50 p-2 rounded hover-scale">
                    {query}
                  </div>
                ))}
              </div>
            )}
            {trendsData.gained.length === 0 && trendsData.lost.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                No changes from previous scan
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            Run multiple scans to see trends
          </p>
        )}
      </CardContent>
    </Card>
  );
});

PromptTrends.displayName = 'PromptTrends';
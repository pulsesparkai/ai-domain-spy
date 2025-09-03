import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

interface CitationsTrackingProps {
  scanData?: any;
}

export const CitationsTracking = memo(({ scanData }: CitationsTrackingProps) => {
  const domains = scanData?.aggregates?.citationDomains || {};
  const totalCitations = scanData?.aggregates?.totalCitations || 0;
  
  const topDomains = Object.entries(domains)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5);

  return (
    <Card className="shadow-card citations-tracking animate-fade-in">
      <CardHeader>
        <CardTitle className="text-h3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent" />
          Citations Tracking
          <span 
            data-tooltip-id="citations-tooltip"
            className="cursor-help text-muted-foreground"
          >
            ℹ️
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary transition-all duration-300">
              {totalCitations}
            </div>
            <div className="text-sm text-muted-foreground">Total Citations</div>
          </div>
          <div className="space-y-2">
            {topDomains.length > 0 ? topDomains.map(([domain, count], index) => (
              <div key={domain} className="flex justify-between items-center hover-scale">
                <span className="text-sm truncate">{domain}</span>
                <Badge variant={index === 0 ? "default" : "secondary"}>
                  {count as number}
                </Badge>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center">No citations found</p>
            )}
          </div>
        </div>
      </CardContent>
      <Tooltip id="citations-tooltip" place="top">
        Shows domains that cite or mention your brand across AI platforms, with citation counts.
      </Tooltip>
    </Card>
  );
});

CitationsTracking.displayName = 'CitationsTracking';
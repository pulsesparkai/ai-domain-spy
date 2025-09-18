import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, ExternalLink, TrendingUp, MessageCircle, Eye, Trash2 } from 'lucide-react';
import { ActivityItem } from '@/hooks/useRealtimeMonitoring';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  activities: ActivityItem[];
  onClear?: () => void;
  showClearButton?: boolean;
}

export const ActivityFeed = ({ activities, onClear, showClearButton = true }: ActivityFeedProps) => {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'citation':
        return <ExternalLink className="h-4 w-4" />;
      case 'score_change':
        return <TrendingUp className="h-4 w-4" />;
      case 'mention':
        return <MessageCircle className="h-4 w-4" />;
      case 'scan_complete':
        return <Eye className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'citation':
        return 'text-blue-500';
      case 'score_change':
        return 'text-green-500';
      case 'mention':
        return 'text-purple-500';
      case 'scan_complete':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  const getBadgeVariant = (type: ActivityItem['type']) => {
    switch (type) {
      case 'citation':
        return 'default';
      case 'score_change':
        return 'secondary';
      case 'mention':
        return 'outline';
      case 'scan_complete':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        {showClearButton && activities.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClear}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm">New citations and mentions will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className={`p-2 rounded-full bg-background border ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-medium">{activity.title}</h4>
                      <Badge variant={getBadgeVariant(activity.type)} className="text-xs">
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    
                    {activity.metadata && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {activity.metadata.platform && (
                          <Badge variant="outline" className="text-xs">
                            {activity.metadata.platform}
                          </Badge>
                        )}
                        {activity.metadata.change && (
                          <span className="text-green-600">
                            +{activity.metadata.change} points
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
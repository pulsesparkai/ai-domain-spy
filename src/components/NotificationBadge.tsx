import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count?: number;
  hasNotifications?: boolean;
  className?: string;
  showIcon?: boolean;
}

export const NotificationBadge = ({ 
  count, 
  hasNotifications, 
  className, 
  showIcon = true 
}: NotificationBadgeProps) => {
  if (!hasNotifications && !count) return null;

  return (
    <div className={cn("relative inline-flex", className)}>
      {showIcon && <Bell className="h-5 w-5 text-muted-foreground" />}
      
      {(hasNotifications || (count && count > 0)) && (
        <Badge 
          variant="destructive" 
          className={cn(
            "absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs",
            showIcon ? "min-w-5" : "relative top-0 right-0"
          )}
        >
          {count && count > 99 ? '99+' : count || ''}
        </Badge>
      )}
      
      {hasNotifications && !count && (
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
      )}
    </div>
  );
};
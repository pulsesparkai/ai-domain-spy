import { useRateLimit } from '@/hooks/useRateLimit';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RateLimitIndicatorProps {
  operation?: string;
  className?: string;
  showProgress?: boolean;
  compact?: boolean;
}

export function RateLimitIndicator({ 
  operation = 'scan', 
  className,
  showProgress = true,
  compact = false
}: RateLimitIndicatorProps) {
  const { status, userTier } = useRateLimit(operation);

  if (!status) return null;

  const progressValue = (status.remainingTokens / status.maxTokens) * 100;
  
  const getStatusVariant = () => {
    if (status.remainingTokens === 0) return 'destructive';
    if (status.remainingTokens <= 2) return 'secondary';
    return 'default';
  };

  const getStatusIcon = () => {
    if (status.isLimited) return <AlertTriangle className="h-3 w-3" />;
    if (status.remainingTokens <= 2) return <Clock className="h-3 w-3" />;
    return <Zap className="h-3 w-3" />;
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge variant={getStatusVariant()} className="text-xs">
          {getStatusIcon()}
          {status.remainingTokens}/{status.maxTokens}
        </Badge>
        {userTier === 'free' && (
          <span className="text-xs text-muted-foreground">Free</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">
            API Requests
          </span>
          <Badge variant="outline" className="text-xs">
            {userTier}
          </Badge>
        </div>
        <Badge variant={getStatusVariant()}>
          {status.remainingTokens}/{status.maxTokens}
        </Badge>
      </div>
      
      {showProgress && (
        <Progress value={progressValue} className="h-1" />
      )}
      
      {status.queuedRequests > 0 && (
        <div className="text-xs text-muted-foreground">
          {status.queuedRequests} queued
        </div>
      )}
    </div>
  );
}
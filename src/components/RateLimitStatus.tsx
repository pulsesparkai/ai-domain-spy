import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Zap, Users, AlertTriangle } from 'lucide-react';
import { RateLimiter, RateLimitStatus } from '@/lib/rate-limiter';

interface RateLimitStatusProps {
  rateLimiter: RateLimiter;
  className?: string;
}

export function RateLimitStatusWidget({ rateLimiter, className }: RateLimitStatusProps) {
  const [status, setStatus] = useState<RateLimitStatus>(rateLimiter.getStatus());
  const [timeUntilReset, setTimeUntilReset] = useState(0);

  useEffect(() => {
    const unsubscribe = rateLimiter.onStatusChange(setStatus);
    return unsubscribe;
  }, [rateLimiter]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilReset(rateLimiter.getTimeUntilReset());
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimiter]);

  const progressValue = (status.remainingTokens / status.maxTokens) * 100;
  const resetMinutes = Math.ceil(timeUntilReset / (1000 * 60));
  const resetSeconds = Math.ceil((timeUntilReset % (1000 * 60)) / 1000);

  const getStatusColor = () => {
    if (status.remainingTokens === 0) return 'destructive';
    if (status.remainingTokens <= 2) return 'secondary';
    return 'default';
  };

  const getStatusIcon = () => {
    if (status.isLimited) return <AlertTriangle className="h-4 w-4" />;
    if (status.remainingTokens <= 2) return <Clock className="h-4 w-4" />;
    return <Zap className="h-4 w-4" />;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {getStatusIcon()}
          API Rate Limit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Requests Available</span>
            <Badge variant={getStatusColor()}>
              {status.remainingTokens}/{status.maxTokens}
            </Badge>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {status.queuedRequests > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {status.queuedRequests} request{status.queuedRequests !== 1 ? 's' : ''} queued
            </span>
          </div>
        )}

        {status.remainingTokens === 0 && (
          <div className="text-sm text-muted-foreground">
            <Clock className="h-4 w-4 inline mr-1" />
            Reset in {resetMinutes > 0 ? `${resetMinutes}m ` : ''}{resetSeconds}s
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Refills at {rateLimiter.getRefillRate()} requests/minute
        </div>

        {status.queuedRequests > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => rateLimiter.clearQueue()}
            className="w-full"
          >
            Clear Queue
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
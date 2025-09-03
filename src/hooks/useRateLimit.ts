import { useEffect, useState } from 'react';
import { getRateLimiter, RateLimitStatus } from '@/lib/rate-limiter';
import { useAuth } from '@/contexts/AuthContext';

export function useRateLimit(operation: string = 'scan') {
  const { profile } = useAuth();
  const [status, setStatus] = useState<RateLimitStatus | null>(null);
  
  // Determine user tier
  const userTier = profile?.subscription_status === 'active' ? 'paid' : 'free';
  const rateLimiter = getRateLimiter(userTier, operation);

  useEffect(() => {
    const unsubscribe = rateLimiter.onStatusChange(setStatus);
    return unsubscribe;
  }, [rateLimiter]);

  const requestToken = async () => {
    try {
      return await rateLimiter.requestToken();
    } catch (error) {
      console.error('Rate limit error:', error);
      return false;
    }
  };

  const clearQueue = () => {
    rateLimiter.clearQueue();
  };

  const getTimeUntilReset = () => {
    return rateLimiter.getTimeUntilReset();
  };

  return {
    status,
    requestToken,
    clearQueue,
    getTimeUntilReset,
    rateLimiter,
    userTier,
  };
}
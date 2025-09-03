import { toast } from '@/hooks/use-toast';

export interface RateLimitConfig {
  maxTokens: number;
  refillRate: number; // tokens per minute
  windowMs: number; // time window in milliseconds
}

export interface RateLimitStatus {
  remainingTokens: number;
  maxTokens: number;
  resetTime: number;
  isLimited: boolean;
  queuedRequests: number;
}

export interface QueuedRequest {
  id: string;
  timestamp: number;
  resolve: (value: boolean) => void;
  reject: (error: Error) => void;
}

const RATE_LIMIT_CONFIGS = {
  free: {
    maxTokens: 5,
    refillRate: 5, // 5 tokens per minute
    windowMs: 60 * 1000, // 1 minute
  },
  paid: {
    maxTokens: 20,
    refillRate: 20, // 20 tokens per minute
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private config: RateLimitConfig;
  private queue: QueuedRequest[] = [];
  private storageKey: string;
  private listeners: Set<(status: RateLimitStatus) => void> = new Set();

  constructor(userTier: 'free' | 'paid' = 'free', operation: string = 'scan') {
    this.config = RATE_LIMIT_CONFIGS[userTier];
    this.storageKey = `rateLimiter_${operation}_${userTier}`;
    this.lastRefill = Date.now();
    
    // Load state from localStorage
    this.loadState();
    
    // Initialize tokens if first time
    if (this.tokens === undefined) {
      this.tokens = this.config.maxTokens;
    }

    // Start refill timer
    this.startRefillTimer();
    
    // Clean up old data
    this.cleanupOldData();
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.tokens = data.tokens;
        this.lastRefill = data.lastRefill;
        this.queue = data.queue || [];
        
        // Restore queue promises (they won't work after reload, so clear them)
        if (this.queue.length > 0) {
          this.queue = [];
          this.saveState();
        }
      }
    } catch (error) {
      console.warn('Failed to load rate limiter state:', error);
      this.tokens = this.config.maxTokens;
    }
  }

  private saveState(): void {
    try {
      const state = {
        tokens: this.tokens,
        lastRefill: this.lastRefill,
        queue: this.queue.map(req => ({
          id: req.id,
          timestamp: req.timestamp,
        })),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save rate limiter state:', error);
    }
  }

  private cleanupOldData(): void {
    try {
      const keys = Object.keys(localStorage);
      const rateLimiterKeys = keys.filter(key => key.startsWith('rateLimiter_'));
      
      rateLimiterKeys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          const age = Date.now() - (data.lastRefill || 0);
          
          // Remove data older than 1 hour
          if (age > 60 * 60 * 1000) {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup old rate limiter data:', error);
    }
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor((timePassed / this.config.windowMs) * this.config.refillRate);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.config.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
      this.saveState();
      this.notifyListeners();
      
      // Process queued requests
      this.processQueue();
    }
  }

  private startRefillTimer(): void {
    // Refill tokens every second for smooth UX
    setInterval(() => {
      this.refillTokens();
    }, 1000);
  }

  private processQueue(): void {
    while (this.queue.length > 0 && this.tokens > 0) {
      const request = this.queue.shift();
      if (request) {
        this.tokens--;
        this.saveState();
        this.notifyListeners();
        request.resolve(true);
      }
    }
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }

  public async requestToken(): Promise<boolean> {
    this.refillTokens();

    // If tokens available, consume one immediately
    if (this.tokens > 0) {
      this.tokens--;
      this.saveState();
      this.notifyListeners();
      return true;
    }

    // If no tokens available, add to queue
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: `${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        resolve,
        reject,
      };

      this.queue.push(request);
      this.saveState();
      this.notifyListeners();

      // Show toast notification
      toast({
        title: "Rate Limited",
        description: `Request queued. ${this.queue.length} requests ahead of you.`,
        variant: "destructive",
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        const index = this.queue.findIndex(r => r.id === request.id);
        if (index !== -1) {
          this.queue.splice(index, 1);
          this.saveState();
          this.notifyListeners();
          reject(new Error('Request timeout'));
        }
      }, 5 * 60 * 1000);
    });
  }

  public getStatus(): RateLimitStatus {
    this.refillTokens();
    
    const resetTime = this.lastRefill + this.config.windowMs;
    
    return {
      remainingTokens: this.tokens,
      maxTokens: this.config.maxTokens,
      resetTime,
      isLimited: this.tokens === 0,
      queuedRequests: this.queue.length,
    };
  }

  public onStatusChange(listener: (status: RateLimitStatus) => void): () => void {
    this.listeners.add(listener);
    
    // Call immediately with current status
    listener(this.getStatus());
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  public clearQueue(): void {
    this.queue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    this.saveState();
    this.notifyListeners();
  }

  public getTimeUntilReset(): number {
    const resetTime = this.lastRefill + this.config.windowMs;
    return Math.max(0, resetTime - Date.now());
  }

  public getRefillRate(): number {
    return this.config.refillRate;
  }
}

// Global rate limiter instances
const rateLimiters = new Map<string, RateLimiter>();

export function getRateLimiter(userTier: 'free' | 'paid', operation: string = 'scan'): RateLimiter {
  const key = `${userTier}_${operation}`;
  
  if (!rateLimiters.has(key)) {
    rateLimiters.set(key, new RateLimiter(userTier, operation));
  }
  
  return rateLimiters.get(key)!;
}

export function clearAllRateLimiters(): void {
  rateLimiters.forEach(limiter => limiter.clearQueue());
  rateLimiters.clear();
}
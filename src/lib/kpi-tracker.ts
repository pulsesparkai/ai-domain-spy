// Business KPI tracking with automated metrics collection

import { logger } from './logger';

export interface KPIMetric {
  name: string;
  value: number;
  unit?: string;
  category: 'business' | 'technical' | 'user' | 'performance';
  metadata?: Record<string, any>;
}

export interface ConversionFunnel {
  step: string;
  users: number;
  conversionRate?: number;
}

export class KPITracker {
  private static instance: KPITracker;
  private metricsBuffer: KPIMetric[] = [];
  private sessionStartTime: number;
  private pageViews: number = 0;
  private userActions: string[] = [];

  constructor() {
    this.sessionStartTime = Date.now();
    this.setupAutomaticTracking();
  }

  public static getInstance(): KPITracker {
    if (!KPITracker.instance) {
      KPITracker.instance = new KPITracker();
    }
    return KPITracker.instance;
  }

  private setupAutomaticTracking(): void {
    if (typeof window === 'undefined') return;

    // Track page views
    this.trackPageView();
    
    // Track session duration on page unload
    window.addEventListener('beforeunload', () => {
      this.trackSessionDuration();
    });

    // Track user engagement
    this.setupEngagementTracking();
  }

  private setupEngagementTracking(): void {
    if (typeof window === 'undefined') return;

    let isIdle = false;
    let idleTimer: NodeJS.Timeout;
    let activeTime = 0;
    let lastActiveTime = Date.now();

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      
      if (isIdle) {
        isIdle = false;
        lastActiveTime = Date.now();
      } else {
        activeTime += Date.now() - lastActiveTime;
        lastActiveTime = Date.now();
      }

      idleTimer = setTimeout(() => {
        isIdle = true;
        this.trackMetric({
          name: 'user_active_time',
          value: activeTime / 1000, // Convert to seconds
          unit: 'seconds',
          category: 'user',
          metadata: {
            page: window.location.pathname,
            sessionDuration: (Date.now() - this.sessionStartTime) / 1000,
          },
        });
      }, 30000); // 30 seconds idle threshold
    };

    // Track user activity
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });

    resetIdleTimer();
  }

  public trackMetric(metric: KPIMetric): void {
    this.metricsBuffer.push({
      ...metric,
      metadata: {
        ...metric.metadata,
        timestamp: new Date().toISOString(),
        sessionId: this.getSessionId(),
        userId: this.getUserId(),
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
      },
    });

    // Log to main logger
    logger.trackKPI(metric.name, metric.value, {
      unit: metric.unit,
      category: metric.category,
      ...metric.metadata,
    });

    // Auto-flush if buffer is getting large
    if (this.metricsBuffer.length >= 50) {
      this.flush();
    }
  }

  public trackPageView(): void {
    this.pageViews++;
    this.trackMetric({
      name: 'page_view',
      value: 1,
      category: 'user',
      metadata: {
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        viewportWidth: typeof window !== 'undefined' ? window.innerWidth : undefined,
        viewportHeight: typeof window !== 'undefined' ? window.innerHeight : undefined,
      },
    });
  }

  public trackUserAction(action: string, metadata?: Record<string, any>): void {
    this.userActions.push(action);
    this.trackMetric({
      name: 'user_action',
      value: 1,
      category: 'user',
      metadata: {
        action,
        actionCount: this.userActions.length,
        ...metadata,
      },
    });
  }

  public trackConversion(step: string, metadata?: Record<string, any>): void {
    this.trackMetric({
      name: 'conversion',
      value: 1,
      category: 'business',
      metadata: {
        step,
        ...metadata,
      },
    });
  }

  public trackRevenue(amount: number, currency: string = 'USD', metadata?: Record<string, any>): void {
    this.trackMetric({
      name: 'revenue',
      value: amount,
      unit: currency,
      category: 'business',
      metadata,
    });
  }

  public trackFeatureUsage(feature: string, metadata?: Record<string, any>): void {
    this.trackMetric({
      name: 'feature_usage',
      value: 1,
      category: 'user',
      metadata: {
        feature,
        ...metadata,
      },
    });
  }

  public trackError(errorType: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium', metadata?: Record<string, any>): void {
    this.trackMetric({
      name: 'error_count',
      value: 1,
      category: 'technical',
      metadata: {
        errorType,
        severity,
        ...metadata,
      },
    });
  }

  public trackPerformanceMetric(metricName: string, value: number, unit: string = 'ms', metadata?: Record<string, any>): void {
    this.trackMetric({
      name: `performance_${metricName}`,
      value,
      unit,
      category: 'performance',
      metadata,
    });
  }

  public trackAPICall(endpoint: string, duration: number, status: number, metadata?: Record<string, any>): void {
    this.trackMetric({
      name: 'api_call_duration',
      value: duration,
      unit: 'ms',
      category: 'performance',
      metadata: {
        endpoint,
        status,
        ...metadata,
      },
    });

    // Track API success/failure rates
    this.trackMetric({
      name: status >= 200 && status < 300 ? 'api_success' : 'api_failure',
      value: 1,
      category: 'technical',
      metadata: {
        endpoint,
        status,
        ...metadata,
      },
    });
  }

  public trackSessionDuration(): void {
    const duration = (Date.now() - this.sessionStartTime) / 1000; // Convert to seconds
    this.trackMetric({
      name: 'session_duration',
      value: duration,
      unit: 'seconds',
      category: 'user',
      metadata: {
        pageViews: this.pageViews,
        userActions: this.userActions.length,
        endType: 'manual',
      },
    });
  }

  public calculateConversionFunnel(steps: string[]): ConversionFunnel[] {
    const metrics = this.metricsBuffer.filter(m => 
      m.name === 'conversion' && steps.includes(m.metadata?.step)
    );

    const stepCounts = steps.reduce((acc, step) => {
      acc[step] = metrics.filter(m => m.metadata?.step === step).length;
      return acc;
    }, {} as Record<string, number>);

    const funnel: ConversionFunnel[] = [];
    let previousUsers = 0;

    steps.forEach((step, index) => {
      const users = stepCounts[step] || 0;
      const conversionRate = index === 0 ? 100 : previousUsers > 0 ? (users / previousUsers) * 100 : 0;
      
      funnel.push({
        step,
        users,
        conversionRate,
      });
      
      if (index === 0) previousUsers = users;
    });

    return funnel;
  }

  public getMetricsSummary(): Record<string, any> {
    const summary = {
      totalMetrics: this.metricsBuffer.length,
      categories: {} as Record<string, number>,
      topMetrics: {} as Record<string, number>,
      sessionInfo: {
        duration: (Date.now() - this.sessionStartTime) / 1000,
        pageViews: this.pageViews,
        userActions: this.userActions.length,
      },
    };

    // Count by category
    this.metricsBuffer.forEach(metric => {
      summary.categories[metric.category] = (summary.categories[metric.category] || 0) + 1;
      summary.topMetrics[metric.name] = (summary.topMetrics[metric.name] || 0) + metric.value;
    });

    return summary;
  }

  public flush(): void {
    if (this.metricsBuffer.length === 0) return;

    // In a real application, you would send these to your analytics service
    logger.info('KPI Metrics Flush', 'Analytics', {
      metricsCount: this.metricsBuffer.length,
      summary: this.getMetricsSummary(),
    });

    this.metricsBuffer = [];
  }

  public exportMetrics(): KPIMetric[] {
    return [...this.metricsBuffer];
  }

  private getSessionId(): string {
    try {
      return sessionStorage.getItem('session_id') || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private getUserId(): string | undefined {
    try {
      return localStorage.getItem('userId') || undefined;
    } catch {
      return undefined;
    }
  }
}

// Export singleton instance
export const kpiTracker = KPITracker.getInstance();

// Convenience functions
export const trackKPI = (name: string, value: number, metadata?: Record<string, any>) => {
  kpiTracker.trackMetric({
    name,
    value,
    category: 'business',
    metadata,
  });
};

export const trackUserAction = (action: string, metadata?: Record<string, any>) => {
  kpiTracker.trackUserAction(action, metadata);
};

export const trackConversion = (step: string, metadata?: Record<string, any>) => {
  kpiTracker.trackConversion(step, metadata);
};

export const trackFeature = (feature: string, metadata?: Record<string, any>) => {
  kpiTracker.trackFeatureUsage(feature, metadata);
};

export const trackRevenue = (amount: number, currency: string = 'USD', metadata?: Record<string, any>) => {
  kpiTracker.trackRevenue(amount, currency, metadata);
};

export const trackError = (errorType: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium', metadata?: Record<string, any>) => {
  kpiTracker.trackError(errorType, severity, metadata);
};

export const trackPerformance = (metricName: string, value: number, unit: string = 'ms', metadata?: Record<string, any>) => {
  kpiTracker.trackPerformanceMetric(metricName, value, unit, metadata);
};

export const trackAPI = (endpoint: string, duration: number, status: number, metadata?: Record<string, any>) => {
  kpiTracker.trackAPICall(endpoint, duration, status, metadata);
};
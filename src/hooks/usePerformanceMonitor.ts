import { useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface UsePerformanceMonitorOptions {
  trackPageLoad?: boolean;
  trackComponentMount?: boolean;
  trackApiCalls?: boolean;
  trackUserInteractions?: boolean;
}

export const usePerformanceMonitor = (
  componentName?: string,
  options: UsePerformanceMonitorOptions = {}
) => {
  const {
    trackPageLoad = true,
    trackComponentMount = true,
    trackApiCalls = true,
    trackUserInteractions = true,
  } = options;

  const mountTimeRef = useRef<number>();
  const performanceEntries = useRef<Map<string, PerformanceEntry>>(new Map());

  // Track component mount performance
  useEffect(() => {
    if (trackComponentMount && componentName) {
      mountTimeRef.current = performance.now();
      
      return () => {
        if (mountTimeRef.current) {
          const mountDuration = performance.now() - mountTimeRef.current;
          logger.trackPerformance(`Component Mount: ${componentName}`, mountDuration, {
            componentName,
            type: 'component_mount',
          });
        }
      };
    }
  }, [componentName, trackComponentMount]);

  // Track page load performance
  useEffect(() => {
    if (!trackPageLoad) return;

    const trackPageLoadMetrics = () => {
      if (typeof window === 'undefined' || !window.performance) return;

      // Wait for page to fully load
      if (document.readyState === 'complete') {
        trackCurrentPageMetrics();
      } else {
        window.addEventListener('load', trackCurrentPageMetrics);
        return () => window.removeEventListener('load', trackCurrentPageMetrics);
      }
    };

    const trackCurrentPageMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const metrics = {
          dns: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp: navigation.connectEnd - navigation.connectStart,
          request: navigation.responseStart - navigation.requestStart,
          response: navigation.responseEnd - navigation.responseStart,
          domProcessing: navigation.domContentLoadedEventStart - navigation.responseEnd,
          domComplete: navigation.loadEventStart - navigation.domContentLoadedEventStart,
          totalPageLoad: navigation.loadEventEnd - navigation.fetchStart,
        };

        Object.entries(metrics).forEach(([metric, duration]) => {
          logger.trackPerformance(`Page Load: ${metric}`, duration, {
            type: 'page_load',
            metric,
            url: window.location.href,
          });
        });

        // Track Core Web Vitals
        trackCoreWebVitals();
      }
    };

    trackPageLoadMetrics();
  }, [trackPageLoad]);

  // Track Core Web Vitals
  const trackCoreWebVitals = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      logger.trackPerformance('Core Web Vital: LCP', lastEntry.startTime, {
        type: 'core_web_vital',
        metric: 'lcp',
        url: window.location.href,
      });
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: any) => {
        logger.trackPerformance('Core Web Vital: FID', entry.processingStart - entry.startTime, {
          type: 'core_web_vital',
          metric: 'fid',
          url: window.location.href,
        });
      });
    }).observe({ type: 'first-input', buffered: true });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      logger.trackPerformance('Core Web Vital: CLS', clsValue, {
        type: 'core_web_vital',
        metric: 'cls',
        url: window.location.href,
      });
    }).observe({ type: 'layout-shift', buffered: true });
  }, []);

  // Start performance timing
  const startTiming = useCallback((name: string, metadata?: Record<string, any>) => {
    const entry: PerformanceEntry = {
      name,
      startTime: performance.now(),
      metadata,
    };
    
    performanceEntries.current.set(name, entry);
    
    logger.debug(`Performance timing started: ${name}`, 'Performance', metadata);
  }, []);

  // End performance timing
  const endTiming = useCallback((name: string, additionalMetadata?: Record<string, any>) => {
    const entry = performanceEntries.current.get(name);
    
    if (entry) {
      const duration = performance.now() - entry.startTime;
      
      logger.trackPerformance(name, duration, {
        ...entry.metadata,
        ...additionalMetadata,
      });
      
      performanceEntries.current.delete(name);
      return duration;
    }
    
    logger.warn(`Performance timing not found: ${name}`, 'Performance');
    return 0;
  }, []);

  // Track API call performance
  const trackApiCall = useCallback(async <T>(
    url: string,
    apiCall: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    if (!trackApiCalls) return apiCall();

    const startTime = performance.now();
    const apiName = `API Call: ${url}`;
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      logger.trackPerformance(apiName, duration, {
        type: 'api_call',
        url,
        status: 'success',
        ...metadata,
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      logger.trackPerformance(apiName, duration, {
        type: 'api_call',
        url,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        ...metadata,
      });
      
      throw error;
    }
  }, [trackApiCalls]);

  // Track user interaction performance
  const trackInteraction = useCallback((
    interactionType: string,
    elementInfo?: Record<string, any>
  ) => {
    if (!trackUserInteractions) return;

    const startTime = performance.now();
    
    // Use requestIdleCallback to measure after interaction is processed
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        const duration = performance.now() - startTime;
        
        logger.trackPerformance(`User Interaction: ${interactionType}`, duration, {
          type: 'user_interaction',
          interactionType,
          ...elementInfo,
        });
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        const duration = performance.now() - startTime;
        
        logger.trackPerformance(`User Interaction: ${interactionType}`, duration, {
          type: 'user_interaction',
          interactionType,
          ...elementInfo,
        });
      }, 0);
    }
  }, [trackUserInteractions]);

  // Get current performance metrics
  const getCurrentMetrics = useCallback(() => {
    if (typeof window === 'undefined' || !window.performance) {
      return {};
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const memory = (performance as any).memory;

    return {
      navigation: navigation ? {
        type: navigation.type,
        redirectCount: navigation.redirectCount,
        totalTime: navigation.loadEventEnd - navigation.fetchStart,
      } : null,
      memory: memory ? {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      } : null,
      timing: {
        now: performance.now(),
        timeOrigin: performance.timeOrigin,
      },
      activeTimings: Array.from(performanceEntries.current.entries()).map(([name, entry]) => ({
        name,
        elapsed: performance.now() - entry.startTime,
        metadata: entry.metadata,
      })),
    };
  }, []);

  return {
    startTiming,
    endTiming,
    trackApiCall,
    trackInteraction,
    getCurrentMetrics,
  };
};
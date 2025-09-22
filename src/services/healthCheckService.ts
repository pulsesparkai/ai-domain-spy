/**
 * Health Check Service
 * Monitors API and service health status
 */

import { getApiEndpoint } from '@/config';
import { supabase } from '@/integrations/supabase/client';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  timestamp: string;
  details?: any;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'down';
  services: HealthCheckResult[];
  timestamp: string;
}

class HealthCheckService {
  private healthCache = new Map<string, HealthCheckResult>();
  private cacheTimeout = 30000; // 30 seconds

  /**
   * Check Supabase database health
   */
  async checkDatabase(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) throw error;

      return {
        service: 'database',
        status: 'healthy',
        responseTime: Date.now() - start,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'database',
        status: 'down',
        responseTime: Date.now() - start,
        timestamp: new Date().toISOString(),
        details: error
      };
    }
  }

  /**
   * Check authentication service health
   */
  async checkAuth(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      const { data, error } = await supabase.auth.getSession();
      
      return {
        service: 'auth',
        status: error ? 'degraded' : 'healthy',
        responseTime: Date.now() - start,
        timestamp: new Date().toISOString(),
        details: error ? { error: error.message } : { sessionExists: !!data.session }
      };
    } catch (error) {
      return {
        service: 'auth',
        status: 'down',
        responseTime: Date.now() - start,
        timestamp: new Date().toISOString(),
        details: error
      };
    }
  }

  /**
   * Check edge functions health
   */
  async checkEdgeFunctions(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('test-scan', {
        body: { test: true }
      });

      return {
        service: 'edge-functions',
        status: error ? 'degraded' : 'healthy',
        responseTime: Date.now() - start,
        timestamp: new Date().toISOString(),
        details: error ? { error: error.message } : { response: data }
      };
    } catch (error) {
      return {
        service: 'edge-functions',
        status: 'down',
        responseTime: Date.now() - start,
        timestamp: new Date().toISOString(),
        details: error
      };
    }
  }

  /**
   * Check external API health (Perplexity, DeepSeek, etc.)
   */
  async checkExternalAPIs(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      // Test with a simple health check call
      const { data, error } = await supabase.functions.invoke('test-scan', {
        body: { provider: 'perplexity', healthCheck: true }
      });

      return {
        service: 'external-apis',
        status: error ? 'degraded' : 'healthy',
        responseTime: Date.now() - start,
        timestamp: new Date().toISOString(),
        details: error ? { error: error.message } : { response: data }
      };
    } catch (error) {
      return {
        service: 'external-apis',
        status: 'down',
        responseTime: Date.now() - start,
        timestamp: new Date().toISOString(),
        details: error
      };
    }
  }

  /**
   * Perform comprehensive system health check
   */
  async checkSystemHealth(): Promise<SystemHealth> {
    const healthChecks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkAuth(), 
      this.checkEdgeFunctions(),
      this.checkExternalAPIs()
    ]);

    const services: HealthCheckResult[] = healthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const serviceNames = ['database', 'auth', 'edge-functions', 'external-apis'];
        return {
          service: serviceNames[index],
          status: 'down' as const,
          responseTime: 0,
          timestamp: new Date().toISOString(),
          details: result.reason
        };
      }
    });

    // Determine overall health
    const healthyServices = services.filter(s => s.status === 'healthy').length;
    const totalServices = services.length;
    
    let overall: SystemHealth['overall'];
    if (healthyServices === totalServices) {
      overall = 'healthy';
    } else if (healthyServices >= totalServices / 2) {
      overall = 'degraded';
    } else {
      overall = 'down';
    }

    return {
      overall,
      services,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get cached health status or perform new check
   */
  async getCachedHealth(service: string): Promise<HealthCheckResult> {
    const cached = this.healthCache.get(service);
    
    if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.cacheTimeout) {
      return cached;
    }

    let result: HealthCheckResult;
    
    switch (service) {
      case 'database':
        result = await this.checkDatabase();
        break;
      case 'auth':
        result = await this.checkAuth();
        break;
      case 'edge-functions':
        result = await this.checkEdgeFunctions();
        break;
      case 'external-apis':
        result = await this.checkExternalAPIs();
        break;
      default:
        throw new Error(`Unknown service: ${service}`);
    }

    this.healthCache.set(service, result);
    return result;
  }

  /**
   * Clear health cache
   */
  clearCache(): void {
    this.healthCache.clear();
  }
}

export const healthCheckService = new HealthCheckService();
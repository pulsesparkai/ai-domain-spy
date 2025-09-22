/**
 * Application Status and Deployment Verification
 * Ensures all critical components are properly configured and working
 */

import { SUPABASE_CONFIG, API_CONFIG, APP_CONFIG } from '@/config';
import { supabase } from '@/integrations/supabase/client';
import { healthCheckService } from '@/services/healthCheckService';

export interface DeploymentStatus {
  isReady: boolean;
  components: {
    configuration: boolean;
    database: boolean;
    authentication: boolean;
    api: boolean;
    edgeFunctions: boolean;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Verify that all configuration is properly set up
 */
export async function verifyConfiguration(): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Check Supabase configuration
  if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
    errors.push('Supabase configuration is incomplete');
  }

  // Check API configuration
  if (!API_CONFIG.baseUrls.supabase) {
    errors.push('API base URL configuration is missing');
  }

  // Check app configuration
  if (!APP_CONFIG.name || !APP_CONFIG.version) {
    errors.push('Application metadata is incomplete');
  }

  return {
    success: errors.length === 0,
    errors
  };
}

/**
 * Verify database connectivity and basic operations
 */
export async function verifyDatabase(): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Test basic connectivity
    const { error: connectError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (connectError) {
      errors.push(`Database connection failed: ${connectError.message}`);
    }

    // Test authentication context
    const { data: session } = await supabase.auth.getSession();
    // Note: Session might be null if user is not logged in, which is normal

  } catch (error) {
    errors.push(`Database verification failed: ${error}`);
  }

  return {
    success: errors.length === 0,
    errors
  };
}

/**
 * Verify authentication system
 */
export async function verifyAuthentication(): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Test auth client availability
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      errors.push(`Authentication system error: ${error.message}`);
    }

    // Test if auth is properly configured (no error means it's working)
    
  } catch (error) {
    errors.push(`Authentication verification failed: ${error}`);
  }

  return {
    success: errors.length === 0,
    errors
  };
}

/**
 * Verify API endpoints and edge functions
 */
export async function verifyAPI(): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Test edge function availability
    const { data, error } = await supabase.functions.invoke('test-scan', {
      body: { test: true }
    });

    if (error) {
      errors.push(`Edge functions unavailable: ${error.message}`);
    }

  } catch (error) {
    errors.push(`API verification failed: ${error}`);
  }

  return {
    success: errors.length === 0,
    errors
  };
}

/**
 * Perform comprehensive deployment verification
 */
export async function verifyDeployment(): Promise<DeploymentStatus> {
  const [
    configResult,
    dbResult,
    authResult,
    apiResult
  ] = await Promise.all([
    verifyConfiguration(),
    verifyDatabase(),
    verifyAuthentication(),
    verifyAPI()
  ]);

  const allErrors = [
    ...configResult.errors,
    ...dbResult.errors,
    ...authResult.errors,
    ...apiResult.errors
  ];

  const warnings: string[] = [];

  // Add warnings for non-critical issues
  if (!APP_CONFIG.features.realtimeUpdates) {
    warnings.push('Real-time updates are disabled');
  }

  return {
    isReady: allErrors.length === 0,
    components: {
      configuration: configResult.success,
      database: dbResult.success,
      authentication: authResult.success,
      api: apiResult.success,
      edgeFunctions: apiResult.success // Same check for now
    },
    errors: allErrors,
    warnings
  };
}

/**
 * Quick health check for runtime monitoring
 */
export async function quickHealthCheck(): Promise<boolean> {
  try {
    const health = await healthCheckService.checkSystemHealth();
    return health.overall !== 'down';
  } catch {
    return false;
  }
}

/**
 * Get deployment information for debugging
 */
export function getDeploymentInfo() {
  return {
    appName: APP_CONFIG.name,
    version: APP_CONFIG.version,
    supabaseUrl: SUPABASE_CONFIG.url,
    apiBaseUrl: API_CONFIG.baseUrls.supabase,
    features: APP_CONFIG.features,
    timestamp: new Date().toISOString()
  };
}
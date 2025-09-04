/**
 * Environment Detection Utilities
 * 
 * Detects the current environment and provides configuration accordingly:
 * - Lovable.dev preview environment
 * - Local development
 * - Production deployment
 */

export type Environment = 'preview' | 'development' | 'production';

export interface EnvironmentConfig {
  environment: Environment;
  isPreview: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
  enableAnalytics: boolean;
  enableSentry: boolean;
  enableConsoleLogging: boolean;
  enableDebugMode: boolean;
  suppressNonCriticalWarnings: boolean;
}

/**
 * Detects if the app is running in Lovable.dev preview environment
 */
export const isLovablePreview = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname.includes('lovable.dev') || hostname.includes('lovable.app');
};

/**
 * Detects the current environment
 */
export const detectEnvironment = (): Environment => {
  const mode = import.meta.env.MODE;
  
  if (isLovablePreview()) {
    return 'preview';
  }
  
  if (mode === 'development') {
    return 'development';
  }
  
  return 'production';
};

/**
 * Gets environment-specific configuration
 */
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const environment = detectEnvironment();
  const isPreview = environment === 'preview';
  const isDevelopment = environment === 'development';
  const isProduction = environment === 'production';

  return {
    environment,
    isPreview,
    isDevelopment,
    isProduction,
    
    // Analytics: Disabled in preview and development by default
    enableAnalytics: isProduction && import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
    
    // Sentry: Disabled in preview, optional in development, enabled in production
    enableSentry: !isPreview && import.meta.env.VITE_ENABLE_SENTRY !== 'false',
    
    // Console logging: Enabled in development and preview, disabled in production
    enableConsoleLogging: !isProduction || import.meta.env.VITE_DEBUG_MODE === 'true',
    
    // Debug mode: Enabled in development and preview
    enableDebugMode: !isProduction,
    
    // Suppress non-critical warnings in preview environment
    suppressNonCriticalWarnings: isPreview,
  };
};

/**
 * Environment-aware console logger
 */
export const envLogger = {
  info: (message: string, ...args: any[]) => {
    const config = getEnvironmentConfig();
    if (config.enableConsoleLogging) {
      console.info(`[${config.environment.toUpperCase()}] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    const config = getEnvironmentConfig();
    if (config.enableConsoleLogging && !config.suppressNonCriticalWarnings) {
      console.warn(`[${config.environment.toUpperCase()}] ${message}`, ...args);
    }
  },
  
  error: (message: string, ...args: any[]) => {
    const config = getEnvironmentConfig();
    if (config.enableConsoleLogging) {
      console.error(`[${config.environment.toUpperCase()}] ${message}`, ...args);
    }
  },
  
  debug: (message: string, ...args: any[]) => {
    const config = getEnvironmentConfig();
    if (config.enableDebugMode) {
      console.log(`[${config.environment.toUpperCase()}] 🐛 ${message}`, ...args);
    }
  }
};

/**
 * Preview-specific utilities
 */
export const previewUtils = {
  /**
   * Checks if a service should be enabled in the current environment
   */
  shouldEnableService: (serviceName: string): boolean => {
    const config = getEnvironmentConfig();
    
    // Critical services that should always be enabled
    const criticalServices = ['supabase', 'react-query', 'router'];
    if (criticalServices.includes(serviceName.toLowerCase())) {
      return true;
    }
    
    // Optional services disabled in preview
    const optionalServices = ['sentry', 'posthog', 'analytics'];
    if (optionalServices.includes(serviceName.toLowerCase()) && config.isPreview) {
      return false;
    }
    
    return true;
  },
  
  /**
   * Gets preview-specific configuration for a service
   */
  getServiceConfig: (serviceName: string): any => {
    const config = getEnvironmentConfig();
    
    const serviceConfigs: Record<string, any> = {
      sentry: {
        enabled: config.enableSentry,
        debug: config.enableDebugMode,
        tracesSampleRate: config.isProduction ? 0.1 : 1.0,
      },
      posthog: {
        enabled: config.enableAnalytics,
        debug: config.enableDebugMode,
        opt_out_capturing_by_default: !config.enableAnalytics,
      },
      logger: {
        level: config.enableDebugMode ? 'debug' : 'info',
        suppressWarnings: config.suppressNonCriticalWarnings,
      }
    };
    
    return serviceConfigs[serviceName] || {};
  }
};
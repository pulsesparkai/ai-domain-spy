/**
 * Application Configuration
 * Centralized configuration for the PulseSpark AI application
 */

// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: 'https://ljhcqubwczhtwrfpploa.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqaGNxdWJ3Y3podHdyZnBwbG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MzYxNjcsImV4cCI6MjA3MjQxMjE2N30.dNj1uTNLaO3Utk2ilagjS_xKWfQdKSSrbbXNJwjRBWI'
} as const;

// API Configuration
export const API_CONFIG = {
  // Base URLs for different environments
  baseUrls: {
    production: 'https://api.pulsespark.ai',
    staging: 'https://staging-api.pulsespark.ai',
    development: 'http://localhost:3000',
    // Fallback to Supabase edge functions
    supabase: `${SUPABASE_CONFIG.url}/functions/v1`
  },
  
  // API endpoints
  endpoints: {
    // AI Services
    perplexityScan: '/perplexity-scan',
    deepseekScan: '/deepseek-scan', 
    openaiScan: '/openai-scan',
    
    // Data services
    analyzeWebsite: '/analyze-website',
    sentimentAnalysis: '/sentiment-analysis',
    trendsAnalysis: '/trends-analysis',
    
    // Utility services
    health: '/health',
    testScan: '/test-scan'
  },
  
  // Request configuration
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  retryAttempts: 3 // Alias for retries for backward compatibility
} as const;

// Application Configuration
export const APP_CONFIG = {
  name: 'PulseSpark AI',
  version: '1.0.0',
  description: 'AI-powered brand monitoring and citation tracking platform',
  
  // Feature flags
  features: {
    brandMonitoring: true,
    citationExtraction: true,
    domainRanking: true,
    competitorAnalysis: true,
    contentOptimization: true,
    realtimeUpdates: true,
    exportToCSV: true,
    darkMode: true
  },
  
  // Limits and defaults
  limits: {
    maxScansPerMonth: 100,
    maxQueriesPerScan: 10,
    maxHistoryItems: 1000,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    requestTimeout: 30000 // 30 seconds
  },
  
  // UI Configuration
  ui: {
    theme: {
      defaultMode: 'system' as 'light' | 'dark' | 'system',
      enableAnimation: true,
      compactMode: false
    },
    pagination: {
      defaultPageSize: 10,
      pageSizeOptions: [5, 10, 20, 50]
    },
    notifications: {
      position: 'top-right' as const,
      autoClose: 5000,
      enableSound: false
    }
  }
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  // React Query cache times (in milliseconds)
  staleTime: {
    short: 30 * 1000,      // 30 seconds
    medium: 5 * 60 * 1000,  // 5 minutes
    long: 30 * 60 * 1000    // 30 minutes
  },
  
  // Local storage keys
  storageKeys: {
    userPreferences: 'pulsespark-user-preferences',
    appState: 'pulsespark-app-state',
    scanTemplates: 'pulsespark-scan-templates',
    recentSearches: 'pulsespark-recent-searches'
  }
} as const;

// External Services Configuration
export const EXTERNAL_SERVICES = {
  stripe: {
    publicKey: 'pk_test_51QbVn1P6CaXzJG0S3L7nCQ2Cx0PrX8H8M8S8FKJz3uUf7jCbkKz1x1UQgV8YQ3ZeHhiXOE7i3Q0tJ5kJCvNGQ7Ln00mVw0XwEz',
    priceIds: {
      basic: 'price_1QbVn1P6CaXzJG0S3L7nCQ2Cx0PrX8H8M8S8FKJz3uUf7jCbkKz1x1UQgV8YQ3ZeHhiXOE7i3Q0tJ5kJCvNGQ7Ln00mVw0XwEz',
      premium: 'price_1QbVn1P6CaXzJG0S3L7nCQ2Cx0PrX8H8M8S8FKJz3uUf7jCbkKz1x1UQgV8YQ3ZeHhiXOE7i3Q0tJ5kJCvNGQ7Ln00mVw0XwEz'
    }
  },
  
  sentry: {
    dsn: '', // Will be set via Supabase secrets if needed
    environment: 'production'
  },
  
  posthog: {
    apiKey: '', // Will be set via Supabase secrets if needed
    apiHost: 'https://app.posthog.com'
  }
} as const;

/**
 * Get the appropriate API base URL based on environment
 */
export function getApiBaseUrl(): string {
  // Always use Supabase edge functions for API calls
  return API_CONFIG.baseUrls.supabase;
}

/**
 * Legacy support for old API config structure
 */
export const LEGACY_API_CONFIG = {
  ...API_CONFIG,
  retryAttempts: API_CONFIG.retries,
  apiBaseUrl: API_CONFIG.baseUrls.production,
  supabaseUrl: SUPABASE_CONFIG.url
};

/**
 * Get full API endpoint URL
 */
export function getApiEndpoint(endpoint: keyof typeof API_CONFIG.endpoints): string {
  const baseUrl = getApiBaseUrl();
  const path = API_CONFIG.endpoints[endpoint];
  return `${baseUrl}${path}`;
}

/**
 * Environment-aware configuration getter
 */
export function getConfig() {
  return {
    supabase: SUPABASE_CONFIG,
    api: API_CONFIG,
    app: APP_CONFIG,
    cache: CACHE_CONFIG,
    external: EXTERNAL_SERVICES
  };
}
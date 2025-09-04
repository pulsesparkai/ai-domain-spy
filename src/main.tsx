import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import posthog from 'posthog-js'
import * as Sentry from '@sentry/react'
import { initializeGlobalErrorHandler } from '@/lib/global-error-handler'
import { getEnvironmentConfig, envLogger, previewUtils } from '@/lib/environment'

/**
 * Analytics and Error Tracking Configuration
 * 
 * This application supports optional integration with:
 * - Sentry for error tracking and performance monitoring
 * - PostHog for user analytics and feature flags
 * 
 * These services are entirely optional and automatically disabled in preview environments.
 * The app will function normally without them.
 */

// Get environment-specific configuration
const envConfig = getEnvironmentConfig();
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const SENTRY_DEBUG = import.meta.env.VITE_SENTRY_DEBUG === 'true';
const POSTHOG_DEBUG = import.meta.env.VITE_POSTHOG_DEBUG === 'true';

// Helper function to check if a value is a valid configuration
const isValidConfig = (value: string | undefined): boolean => {
  return Boolean(value && value.trim() && !value.includes('your_') && !value.includes('phc_your_'));
};

// Environment-aware service initialization
envLogger.info('Initializing application', {
  environment: envConfig.environment,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
});

/**
 * Initialize Sentry Error Tracking (Optional Service)
 * Only initializes if enabled for current environment and properly configured
 */
if (envConfig.enableSentry && isValidConfig(SENTRY_DSN)) {
  try {
    const sentryConfig = previewUtils.getServiceConfig('sentry');
    
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: sentryConfig.tracesSampleRate,
      environment: envConfig.environment,
      beforeSend(event) {
        // Don't send events in development/preview unless explicitly enabled
        if ((envConfig.isDevelopment || envConfig.isPreview) && !SENTRY_DEBUG) {
          return null;
        }
        return event;
      },
    });
    
    envLogger.info('Sentry error tracking initialized');
  } catch (error) {
    envLogger.error('Failed to initialize Sentry', error);
  }
} else if (envConfig.enableDebugMode) {
  envLogger.debug('Sentry disabled', {
    enableSentry: envConfig.enableSentry,
    hasValidDSN: isValidConfig(SENTRY_DSN),
    environment: envConfig.environment,
  });
}

/**
 * Initialize PostHog Analytics (Optional Service)
 * Only initializes if enabled for current environment and properly configured
 */
if (typeof window !== 'undefined' && envConfig.enableAnalytics && isValidConfig(POSTHOG_KEY)) {
  try {
    const posthogConfig = previewUtils.getServiceConfig('posthog');
    
    posthog.init(POSTHOG_KEY!, {
      api_host: 'https://app.posthog.com',
      autocapture: true,
      opt_out_capturing_by_default: posthogConfig.opt_out_capturing_by_default,
      loaded: (posthog) => {
        envLogger.info('PostHog analytics initialized');
      },
    });
  } catch (error) {
    envLogger.error('Failed to initialize PostHog', error);
  }
} else if (envConfig.enableDebugMode) {
  envLogger.debug('PostHog disabled', {
    enableAnalytics: envConfig.enableAnalytics,
    hasValidKey: isValidConfig(POSTHOG_KEY),
    environment: envConfig.environment,
  });
}

/**
 * Environment Status Logging
 * Shows service status when debug mode is enabled
 */
if (envConfig.enableDebugMode && (SENTRY_DEBUG || POSTHOG_DEBUG)) {
  envLogger.debug('Services Status', {
    environment: envConfig.environment,
    sentry: envConfig.enableSentry && isValidConfig(SENTRY_DSN) ? 'enabled' : 'disabled',
    posthog: envConfig.enableAnalytics && isValidConfig(POSTHOG_KEY) ? 'enabled' : 'disabled',
    preview_mode: envConfig.isPreview,
    debug_mode: envConfig.enableDebugMode,
  });
}

// Initialize global error handlers before rendering the app
initializeGlobalErrorHandler({
  enableConsoleLogging: envConfig.enableConsoleLogging,
  enableToastNotifications: true,
  enableSentryLogging: envConfig.enableSentry && isValidConfig(SENTRY_DSN),
  maxErrorsPerSession: envConfig.isPreview ? 10 : 50, // Reduced for preview
  cooldownPeriod: envConfig.isPreview ? 2000 : 1000, // Longer cooldown for preview
});

createRoot(document.getElementById("root")!).render(<App />);

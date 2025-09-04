import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import posthog from 'posthog-js'
import * as Sentry from '@sentry/react'
import { initializeGlobalErrorHandler } from '@/lib/global-error-handler'

/**
 * Analytics and Error Tracking Configuration
 * 
 * This application supports optional integration with:
 * - Sentry for error tracking and performance monitoring
 * - PostHog for user analytics and feature flags
 * 
 * These services are entirely optional. The app will function normally without them.
 * To enable, add the appropriate environment variables to your .env.local file.
 * See .env.example for all available configuration options.
 */

// Environment variables
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const SENTRY_DEBUG = import.meta.env.VITE_SENTRY_DEBUG === 'true';
const POSTHOG_DEBUG = import.meta.env.VITE_POSTHOG_DEBUG === 'true';
const isDevelopment = import.meta.env.MODE === 'development';
const isDebugMode = isDevelopment && (SENTRY_DEBUG || POSTHOG_DEBUG);

// Helper function to check if a value is a valid configuration
const isValidConfig = (value: string | undefined): boolean => {
  return Boolean(value && value.trim() && !value.includes('your_') && !value.includes('phc_your_'));
};

/**
 * Initialize Sentry Error Tracking (Optional Service)
 * Only initializes if VITE_SENTRY_DSN is provided and valid
 */
if (isValidConfig(SENTRY_DSN)) {
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: isDevelopment ? 1.0 : 0.1,
      environment: import.meta.env.MODE,
      beforeSend(event) {
        // Don't send events in development unless explicitly enabled
        if (isDevelopment && !SENTRY_DEBUG) {
          return null;
        }
        return event;
      },
    });
    
    if (isDevelopment && SENTRY_DEBUG) {
      console.log('✅ Sentry error tracking enabled');
    }
  } catch (error) {
    if (isDevelopment) {
      console.warn('Failed to initialize Sentry:', error);
    }
  }
}

/**
 * Initialize PostHog Analytics (Optional Service)
 * Only initializes if VITE_POSTHOG_KEY is provided and valid
 */
if (typeof window !== 'undefined' && isValidConfig(POSTHOG_KEY)) {
  try {
    posthog.init(POSTHOG_KEY!, {
      api_host: 'https://app.posthog.com',
      autocapture: true,
      // Disable in development unless explicitly enabled
      opt_out_capturing_by_default: isDevelopment && !POSTHOG_DEBUG,
      loaded: (posthog) => {
        if (isDevelopment && POSTHOG_DEBUG) {
          console.log('✅ PostHog analytics enabled');
        }
      },
    });
  } catch (error) {
    if (isDevelopment) {
      console.warn('Failed to initialize PostHog:', error);
    }
  }
}

/**
 * Development Analytics Status (Optional Logging)
 * Only shows when debug flags are enabled to reduce console noise
 */
if (isDevelopment && (SENTRY_DEBUG || POSTHOG_DEBUG)) {
  console.group('📊 Analytics Services Status');
  console.log(`Sentry: ${isValidConfig(SENTRY_DSN) ? '✅ Enabled' : '⚪ Not configured'}`);
  console.log(`PostHog: ${isValidConfig(POSTHOG_KEY) ? '✅ Enabled' : '⚪ Not configured'}`);
  console.log('💡 Tip: These services are optional and can be configured in .env.local');
  console.groupEnd();
}

// Initialize global error handlers before rendering the app
initializeGlobalErrorHandler({
  enableConsoleLogging: isDebugMode,
  enableToastNotifications: true,
  enableSentryLogging: isValidConfig(SENTRY_DSN),
  maxErrorsPerSession: 50,
  cooldownPeriod: 1000,
});

createRoot(document.getElementById("root")!).render(<App />);

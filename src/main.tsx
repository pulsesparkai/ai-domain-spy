import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import posthog from 'posthog-js'
import * as Sentry from '@sentry/react'

// Environment variables
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const isDevelopment = import.meta.env.MODE === 'development';

// Initialize Sentry conditionally
if (SENTRY_DSN && SENTRY_DSN !== 'your_sentry_dsn_here') {
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: isDevelopment ? 1.0 : 0.1,
      environment: import.meta.env.MODE,
      beforeSend(event) {
        // Don't send events in development unless explicitly enabled
        if (isDevelopment && !import.meta.env.VITE_SENTRY_DEBUG) {
          return null;
        }
        return event;
      },
    });
    
    if (isDevelopment) {
      console.log('✅ Sentry initialized successfully');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
  }
} else {
  if (isDevelopment) {
    console.warn('⚠️ Sentry not initialized: VITE_SENTRY_DSN environment variable is missing or invalid');
    console.log('To enable Sentry, set VITE_SENTRY_DSN in your environment variables');
  }
}

// Initialize PostHog conditionally
if (typeof window !== 'undefined' && POSTHOG_KEY && POSTHOG_KEY !== 'phc_your_posthog_key_here') {
  try {
    posthog.init(POSTHOG_KEY, {
      api_host: 'https://app.posthog.com',
      autocapture: true,
      // Disable in development unless explicitly enabled
      opt_out_capturing_by_default: isDevelopment && !import.meta.env.VITE_POSTHOG_DEBUG,
      loaded: (posthog) => {
        if (isDevelopment) {
          console.log('✅ PostHog initialized successfully');
        }
      },
    });
  } catch (error) {
    console.error('❌ Failed to initialize PostHog:', error);
  }
} else {
  if (isDevelopment && typeof window !== 'undefined') {
    console.warn('⚠️ PostHog not initialized: VITE_POSTHOG_KEY environment variable is missing or invalid');
    console.log('To enable PostHog analytics, set VITE_POSTHOG_KEY in your environment variables');
  }
}

// Log analytics status in development
if (isDevelopment) {
  console.log('📊 Analytics Services Status:');
  console.log(`   Sentry: ${SENTRY_DSN ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   PostHog: ${POSTHOG_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log('   Set VITE_SENTRY_DEBUG=true or VITE_POSTHOG_DEBUG=true to enable in development');
}

createRoot(document.getElementById("root")!).render(<App />);

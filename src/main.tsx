import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import posthog from 'posthog-js'
import * as Sentry from '@sentry/react'

// Initialize Sentry
Sentry.init({
  dsn: 'https://your_sentry_dsn_here',
  tracesSampleRate: 1.0,
  environment: import.meta.env.MODE,
});

// Initialize PostHog
if (typeof window !== 'undefined') {
  posthog.init('phc_your_posthog_key_here', {
    api_host: 'https://app.posthog.com',
    autocapture: true,
  })
}

createRoot(document.getElementById("root")!).render(<App />);

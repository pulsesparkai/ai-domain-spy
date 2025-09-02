import posthog from 'posthog-js';

export const analytics = {
  track: (event: string, properties?: Record<string, any>) => {
    try {
      if (typeof window !== 'undefined' && posthog.__loaded) {
        posthog.capture(event, properties);
      }
      
      // Also track with gtag if available
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', event, properties);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  },

  identify: (userId: string, traits?: Record<string, any>) => {
    try {
      if (typeof window !== 'undefined' && posthog.__loaded) {
        posthog.identify(userId, traits);
      }
    } catch (error) {
      console.error('Analytics identify error:', error);
    }
  },

  page: (name?: string, properties?: Record<string, any>) => {
    try {
      if (typeof window !== 'undefined' && posthog.__loaded) {
        posthog.capture('$pageview', { page: name, ...properties });
      }
    } catch (error) {
      console.error('Analytics page tracking error:', error);
    }
  },

  reset: () => {
    try {
      if (typeof window !== 'undefined' && posthog.__loaded) {
        posthog.reset();
      }
    } catch (error) {
      console.error('Analytics reset error:', error);
    }
  }
};
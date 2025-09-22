import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SUPABASE_CONFIG } from '@/config';

// Create Supabase client with centralized configuration
// Note: In Lovable, VITE_ environment variables are not supported
// Use the configuration from our centralized config instead
const supabaseUrl = SUPABASE_CONFIG.url;
const supabaseAnonKey = SUPABASE_CONFIG.anonKey;

// Enhanced client configuration with connection pooling and performance optimizations
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'pulsespark-auth'
  },
  // Connection pooling configuration
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        // Add connection keep-alive for better performance
        keepalive: true,
      });
    },
  },
  // Real-time configuration for optimal performance
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  // Database configuration
  db: {
    schema: 'public',
  },
});

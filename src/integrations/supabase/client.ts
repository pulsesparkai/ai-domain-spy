// Enhanced Supabase client with query optimization features
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ljhcqubwczhtwrfpploa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqaGNxdWJ3Y3podHdyZnBwbG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MzYxNjcsImV4cCI6MjA3MjQxMjE2N30.dNj1uTNLaO3Utk2ilagjS_xKWfQdKSSrbbXNJwjRBWI';

// Enhanced client configuration with connection pooling and performance optimizations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
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

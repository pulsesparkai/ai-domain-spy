import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  base: '/',
  server: {
    host: "::",
    port: 8080,
    // Security headers for development server
    // Note: In production, these should be configured at the hosting/server level
    headers: {
      // Prevent clickjacking attacks
      'X-Frame-Options': 'DENY',
      // Enable XSS protection
      'X-XSS-Protection': '1; mode=block',
      // Content Security Policy for development
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://app.posthog.com https://cdn.jsdelivr.net https://unpkg.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https: https://images.unsplash.com https://*.supabase.co",
        "connect-src 'self' https://api.pulsespark.ai https://pulsespark-api.onrender.com https://api.openai.com https://api.perplexity.ai https://api.stripe.com https://app.posthog.com https://*.supabase.co wss://*.supabase.co",
        "frame-src 'self' https://js.stripe.com https://checkout.stripe.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'"
      ].join('; ')
    }
  },
  plugins: [
    react(),
    // Component tagging for Lovable
    mode === 'development' && componentTagger(),
    // Bundle analyzer for production builds
    mode === 'production' && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
    // PWA plugin for caching
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
            }
          }
        ]
      }
    }),
    // Gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli compression
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize bundle size
    rollupOptions: {
      // Suppress deprecation warnings and dynamic/static import conflicts
      onwarn(warning, warn) {
        // Suppress common deprecation warnings
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.code === 'UNRESOLVED_IMPORT') return;
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        if (warning.code === 'EVAL') return;
        
        // Suppress dynamic/static import conflict for Supabase client
        if (warning.message?.includes('is dynamically imported by') && warning.message?.includes('supabase/client')) {
          return; // Ignore this specific warning
        }
        
        // Suppress sourcemap and dependency warnings
        if (warning.message?.includes('sourcemap-codec')) return;
        if (warning.message?.includes('inflight')) return;
        if (warning.message?.includes('node-domexception')) return;
        if (warning.message?.includes('glob')) return;
        if (warning.message?.includes('popper.js')) return;
        if (warning.message?.includes('source-map')) return;
        
        warn(warning);
      },
      output: {
        // Manual chunks for better code splitting
        manualChunks: (id: string) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('react-router-dom')) {
              return 'router-vendor';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('recharts')) {
              return 'charts';
            }
            if (id.includes('prismjs') && mode === 'production') {
              return 'prism';
            }
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase';
            }
            if (id.includes('posthog-js') || id.includes('@sentry/react')) {
              return 'analytics';
            }
            if (id.includes('date-fns') || id.includes('clsx') || id.includes('class-variance-authority')) {
              return 'utils';
            }
          }
        },
      },
    },
    // Increase chunk size warning limit for better performance
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging
    sourcemap: mode === 'production' ? 'hidden' : true,
    // Optimize for better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query'
    ],
    exclude: [
      // Exclude heavy dependencies from pre-bundling to enable lazy loading
      'recharts',
      'prismjs',
      // Exclude deprecated dependencies to avoid warnings
      'sourcemap-codec',
      'inflight',
      'node-domexception',
      'glob',
      // Exclude beta/deprecated packages
      'source-map'
    ]
  },
}));
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  const isBuild = command === 'build';
  
  return {
    // Server configuration
    server: {
      host: "::",
      port: 8080,
      cors: true,
    },
    
    // Build configuration
    build: {
      target: 'esnext',
      minify: isProduction ? 'esbuild' : false,
      sourcemap: isProduction ? 'hidden' : 'inline',
      cssCodeSplit: true,
      
      // Rollup options for chunk splitting
      rollupOptions: {
        output: {
          // Manual chunk splitting strategy
          manualChunks: {
            // Core React libraries
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            
            // UI Framework
            'ui-vendor': [
              '@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-aspect-ratio',
              '@radix-ui/react-avatar',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-collapsible',
              '@radix-ui/react-context-menu',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-hover-card',
              '@radix-ui/react-label',
              '@radix-ui/react-menubar',
              '@radix-ui/react-navigation-menu',
              '@radix-ui/react-popover',
              '@radix-ui/react-progress',
              '@radix-ui/react-radio-group',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-select',
              '@radix-ui/react-separator',
              '@radix-ui/react-slider',
              '@radix-ui/react-slot',
              '@radix-ui/react-switch',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast',
              '@radix-ui/react-toggle',
              '@radix-ui/react-toggle-group',
              '@radix-ui/react-tooltip',
            ],
            
            // Chart libraries
            'charts-vendor': ['recharts'],
            
            // Form handling
            'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
            
            // API clients
            'api-vendor': ['axios', '@supabase/supabase-js', '@tanstack/react-query'],
            
            // Analytics & Monitoring
            'analytics-vendor': ['posthog-js', '@sentry/react'],
            
            // Payment processing
            'payment-vendor': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
            
            // Utility libraries
            'utils-vendor': [
              'clsx',
              'class-variance-authority',
              'tailwind-merge',
              'date-fns',
              'lodash',
              'url-parse',
            ],
            
            // Icons and assets
            'icons-vendor': ['lucide-react'],
            
            // Large individual libraries
            'openai-vendor': ['openai'],
          },
          
          // Chunk file naming strategy
          chunkFileNames: isProduction
            ? 'assets/js/[name]-[hash].js'
            : 'assets/js/[name].js',
          entryFileNames: isProduction
            ? 'assets/js/[name]-[hash].js'
            : 'assets/js/[name].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            const ext = info[info.length - 1];
            
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/woff2?|eot|ttf|otf/i.test(ext || '')) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[ext]/[name]-[hash][extname]`;
          },
        },
        
        // External dependencies (for CDN)
        external: isProduction && env.VITE_USE_CDN === 'true' 
          ? ['react', 'react-dom'] 
          : [],
      },
      
      // Asset optimization
      assetsInlineLimit: 4096, // 4kb
      cssMinify: isProduction,
      
      // Bundle size warnings
      chunkSizeWarningLimit: 500, // 500kb
    },
    
    // Define for build-time constants
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __IS_PRODUCTION__: isProduction,
    },
    
    // Plugins configuration
    plugins: [
      // React plugin
      react(),
      
      // Development-only plugins
      mode === 'development' && componentTagger(),
      
      // Production optimization plugins
      isProduction && viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024, // Only compress files larger than 1kb
        deleteOriginFile: false,
      }),
      
      // Brotli compression for better compression ratio
      isProduction && viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
        deleteOriginFile: false,
      }),
      
      // Bundle analyzer (only when analyzing)
      isBuild && env.ANALYZE === 'true' && visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap', // 'treemap', 'sunburst', 'network'
      }),
      
      // PWA plugin for production
      isProduction && VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
              },
            },
          ],
        },
        manifest: {
          name: 'AI Visibility Scanner',
          short_name: 'AI Scanner',
          description: 'Track your brand visibility across AI platforms',
          theme_color: '#4F46E5',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: '/favicon.ico',
              sizes: '48x48',
              type: 'image/x-icon',
            },
          ],
        },
      }),
    ].filter(Boolean),
    
    // Path resolution
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    
    // CSS configuration
    css: {
      devSourcemap: !isProduction,
    },
    
    // Environment variables
    envPrefix: 'VITE_',
    
    // Optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
        'axios',
        'recharts',
        'lucide-react',
      ],
      exclude: ['@vite/client', '@vite/env'],
    },
    
    // Preview server configuration
    preview: {
      port: 8080,
      host: true,
    },
    
    // Base URL for deployment
    base: env.VITE_BASE_URL || '/',
    
    // Experimental features
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        if (hostType === 'js') {
          return { js: `${env.VITE_CDN_URL || ''}/${filename}` };
        }
        return { relative: true };
      },
    },
  };
});

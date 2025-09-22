/**
 * Deployment Configuration
 * Contains deployment-specific settings and build optimizations
 */

export interface DeploymentConfig {
  buildTarget: 'static' | 'ssr' | 'edge';
  optimization: {
    bundleAnalysis: boolean;
    treeshaking: boolean;
    minification: boolean;
    compression: boolean;
  };
  performance: {
    preloadCriticalRoutes: boolean;
    lazyLoadComponents: boolean;
    cacheStrategies: boolean;
  };
  security: {
    csp: boolean;
    headers: boolean;
    cors: boolean;
  };
}

// Production deployment configuration
export const DEPLOYMENT_CONFIG: DeploymentConfig = {
  buildTarget: 'static',
  
  optimization: {
    bundleAnalysis: true,
    treeshaking: true,
    minification: true,
    compression: true
  },
  
  performance: {
    preloadCriticalRoutes: true,
    lazyLoadComponents: true,
    cacheStrategies: true
  },
  
  security: {
    csp: true,
    headers: true,
    cors: true
  }
};

// Build-time constants
export const BUILD_INFO = {
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  commit: process.env.COMMIT_SHA || 'unknown'
};

// Asset configuration
export const ASSET_CONFIG = {
  // Image optimization
  images: {
    formats: ['webp', 'avif', 'jpg', 'png'],
    quality: 85,
    sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
  },
  
  // Font optimization
  fonts: {
    preload: ['Inter-Regular.woff2', 'Inter-Medium.woff2', 'Inter-SemiBold.woff2'],
    display: 'swap'
  },
  
  // Icon configuration
  icons: {
    format: 'svg',
    sizes: [16, 32, 48, 64, 128, 256]
  }
};

// CDN and external resource configuration
export const CDN_CONFIG = {
  fonts: {
    google: 'https://fonts.googleapis.com',
    gstatic: 'https://fonts.gstatic.com'
  },
  
  analytics: {
    posthog: 'https://app.posthog.com',
    sentry: 'https://sentry.io'
  },
  
  payments: {
    stripe: 'https://js.stripe.com'
  }
};

/**
 * Get deployment-specific build configuration
 */
export function getBuildConfig() {
  return {
    deployment: DEPLOYMENT_CONFIG,
    build: BUILD_INFO,
    assets: ASSET_CONFIG,
    cdn: CDN_CONFIG
  };
}
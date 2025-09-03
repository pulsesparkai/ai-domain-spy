// Content Security Policy configuration
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite in development
    "'unsafe-eval'", // Required for Vite in development
    'https://js.stripe.com',
    'https://checkout.stripe.com',
    'https://app.posthog.com',
    'https://cdn.jsdelivr.net',
    'https://unpkg.com'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for CSS-in-JS
    'https://fonts.googleapis.com',
    'https://cdn.jsdelivr.net'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'data:'
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
    'https://images.unsplash.com',
    'https://*.supabase.co'
  ],
  'connect-src': [
    "'self'",
    'https://api.openai.com',
    'https://api.perplexity.ai',
    'https://api.stripe.com',
    'https://app.posthog.com',
    'https://*.supabase.co',
    'wss://*.supabase.co',
    process.env.NODE_ENV === 'development' ? 'http://localhost:*' : null,
    process.env.NODE_ENV === 'development' ? 'ws://localhost:*' : null
  ].filter(Boolean),
  'frame-src': [
    "'self'",
    'https://js.stripe.com',
    'https://checkout.stripe.com'
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': process.env.NODE_ENV === 'production' ? [] : null
};

// Generate CSP header value
export const generateCSPHeader = (): string => {
  return Object.entries(CSP_DIRECTIVES)
    .filter(([, value]) => value !== null)
    .map(([directive, sources]) => {
      if (Array.isArray(sources) && sources.length > 0) {
        return `${directive} ${sources.join(' ')}`;
      }
      return directive;
    })
    .join('; ');
};

// Security headers configuration
export const SECURITY_HEADERS = {
  'Content-Security-Policy': generateCSPHeader(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()'
  ].join(', '),
  'Strict-Transport-Security': process.env.NODE_ENV === 'production' 
    ? 'max-age=31536000; includeSubDomains; preload' 
    : undefined
};

// Apply security headers to response
export const applySecurityHeaders = (headers: Record<string, string>): Record<string, string> => {
  return {
    ...headers,
    ...Object.fromEntries(
      Object.entries(SECURITY_HEADERS).filter(([, value]) => value !== undefined)
    )
  };
};

// Validate request origin for CORS
export const isValidOrigin = (origin: string | undefined): boolean => {
  if (!origin) return false;
  
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://ljhcqubwczhtwrfpploa.supabase.co',
    process.env.VITE_APP_URL,
    process.env.VITE_SUPABASE_URL
  ].filter(Boolean);
  
  return allowedOrigins.includes(origin);
};

// Generate nonce for inline scripts
export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};
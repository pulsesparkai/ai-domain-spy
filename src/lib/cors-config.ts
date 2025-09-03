// CORS configuration constants
export const CORS_CONFIG = {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24 hours
  },
  credentials: false, // Don't include credentials for CORS
};

// Preflight request handler
export const handlePreflightRequest = () => {
  return new Response(null, {
    status: 200,
    headers: CORS_CONFIG.headers,
  });
};

// Add CORS headers to response
export const addCorsHeaders = (response: Response): Response => {
  Object.entries(CORS_CONFIG.headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
};
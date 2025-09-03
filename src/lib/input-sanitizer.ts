import DOMPurify from 'dompurify';
import { z } from 'zod';

// URL validation schema
const UrlSchema = z.string().url().refine(
  (url) => {
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },
  { message: 'Only HTTP and HTTPS URLs are allowed' }
);

// Query validation schema
const QuerySchema = z.string()
  .min(1, 'Query cannot be empty')
  .max(500, 'Query too long')
  .refine(
    (query) => {
      // Block potential SQL injection patterns
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
        /(--|\/\*|\*\/|;|'|"|`)/,
        /(\bOR\b|\bAND\b).*?[=<>]/i
      ];
      return !sqlPatterns.some(pattern => pattern.test(query));
    },
    { message: 'Query contains invalid characters or patterns' }
  );

// API Key validation schema
const ApiKeySchema = z.string()
  .min(10, 'API key too short')
  .max(200, 'API key too long')
  .regex(/^[a-zA-Z0-9\-_\.]+$/, 'API key contains invalid characters');

// Email validation schema
const EmailSchema = z.string().email('Invalid email format').max(254, 'Email too long');

// General text sanitization
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  // Remove potentially dangerous characters
  return text
    .replace(/[<>'"&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char] || char;
    })
    .trim()
    .substring(0, 1000); // Limit length
};

// HTML sanitization using DOMPurify
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit']
  });
};

// URL sanitization and validation
export const sanitizeAndValidateUrl = (url: string): { isValid: boolean; sanitizedUrl?: string; error?: string } => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  // Basic sanitization
  const trimmedUrl = url.trim();
  
  // Add protocol if missing
  let fullUrl = trimmedUrl;
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    fullUrl = `https://${trimmedUrl}`;
  }

  try {
    const result = UrlSchema.parse(fullUrl);
    const parsed = new URL(result);
    
    // Additional security checks
    if (parsed.hostname === 'localhost' || parsed.hostname.startsWith('127.') || parsed.hostname.startsWith('192.168.')) {
      return { isValid: false, error: 'Local URLs are not allowed' };
    }
    
    return { isValid: true, sanitizedUrl: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid URL format' };
  }
};

// Query sanitization and validation
export const sanitizeAndValidateQuery = (query: string): { isValid: boolean; sanitizedQuery?: string; error?: string } => {
  if (!query || typeof query !== 'string') {
    return { isValid: false, error: 'Query is required' };
  }

  try {
    // Basic text sanitization first
    const sanitized = sanitizeText(query);
    
    // Then validate against schema
    const result = QuerySchema.parse(sanitized);
    
    return { isValid: true, sanitizedQuery: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid query format' };
  }
};

// API Key sanitization and validation
export const sanitizeAndValidateApiKey = (apiKey: string): { isValid: boolean; sanitizedApiKey?: string; error?: string } => {
  if (!apiKey || typeof apiKey !== 'string') {
    return { isValid: false, error: 'API key is required' };
  }

  try {
    const trimmed = apiKey.trim();
    const result = ApiKeySchema.parse(trimmed);
    
    return { isValid: true, sanitizedApiKey: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid API key format' };
  }
};

// Email sanitization and validation
export const sanitizeAndValidateEmail = (email: string): { isValid: boolean; sanitizedEmail?: string; error?: string } => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  try {
    const trimmed = email.trim().toLowerCase();
    const result = EmailSchema.parse(trimmed);
    
    return { isValid: true, sanitizedEmail: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid email format' };
  }
};

// Sanitize request payload for API calls
export const sanitizeApiPayload = (payload: any): any => {
  if (!payload || typeof payload !== 'object') return payload;
  
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item: any) => 
        typeof item === 'string' ? sanitizeText(item) : item
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeApiPayload(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// XSS protection for rendering user content
export const renderSafeContent = (content: string, allowHtml: boolean = false): string => {
  if (!content || typeof content !== 'string') return '';
  
  if (allowHtml) {
    return sanitizeHtml(content);
  }
  
  return sanitizeText(content);
};

// Validate scan request
export const validateScanRequest = (request: any): { isValid: boolean; errors: string[]; sanitizedRequest?: any } => {
  const errors: string[] = [];
  const sanitizedRequest: any = {};

  // Validate queries
  if (!Array.isArray(request.queries) || request.queries.length === 0) {
    errors.push('At least one query is required');
  } else {
    const sanitizedQueries: string[] = [];
    for (let i = 0; i < request.queries.length; i++) {
      const queryResult = sanitizeAndValidateQuery(request.queries[i]);
      if (!queryResult.isValid) {
        errors.push(`Query ${i + 1}: ${queryResult.error}`);
      } else if (queryResult.sanitizedQuery) {
        sanitizedQueries.push(queryResult.sanitizedQuery);
      }
    }
    sanitizedRequest.queries = sanitizedQueries;
  }

  // Validate scan type
  const allowedScanTypes = ['openai', 'perplexity', 'combined', 'trending', 'brand-monitoring', 'competitor-analysis', 'trend-tracking'];
  if (!request.scanType || !allowedScanTypes.includes(request.scanType)) {
    errors.push('Invalid scan type');
  } else {
    sanitizedRequest.scanType = request.scanType;
  }

  // Validate target URL (optional)
  if (request.targetUrl) {
    const urlResult = sanitizeAndValidateUrl(request.targetUrl);
    if (!urlResult.isValid) {
      errors.push(`Target URL: ${urlResult.error}`);
    } else {
      sanitizedRequest.targetUrl = urlResult.sanitizedUrl;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedRequest: errors.length === 0 ? sanitizedRequest : undefined
  };
};
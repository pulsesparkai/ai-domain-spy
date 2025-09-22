import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/lib/toast';
import { 
  ApiResponse, 
  ScanRequest, 
  ScanResponse, 
  AppError,
  validateApiResponse,
  ScanResponseSchema,
} from '@/types/api';
import { createRequestId, type RequestId } from '@/types/branded';
import { sanitizeApiPayload, validateScanRequest } from '@/lib/input-sanitizer';
import { applySecurityHeaders } from '@/lib/security-headers';
import { withAsyncErrorHandling } from '@/lib/async-error-wrapper';

// API client configuration
const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  supabaseUrl: 'https://ljhcqubwczhtwrfpploa.supabase.co',
  apiBaseUrl: 'https://api.pulsespark.ai',
};

// Custom error class for API errors
class ApiClientError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any,
    public requestId?: RequestId
  ) {
    super(message);
    this.name = 'ApiClientError';
  }

  toAppError(): AppError {
    if (this.status === 401) {
      return { type: 'authentication', message: this.message, code: this.code || 'UNAUTHORIZED' };
    }
    if (this.status === 403) {
      return { type: 'authorization', message: this.message, resource: this.code };
    }
    if (this.status === 429) {
      return { type: 'rate_limit', message: this.message, retryAfter: this.details?.retryAfter };
    }
    if (this.status && this.status >= 400 && this.status < 500) {
      return { type: 'validation', message: this.message, field: this.details?.field };
    }
    if (this.status && this.status >= 500) {
      return { type: 'api', message: this.message, code: this.code || 'SERVER_ERROR', details: this.details };
    }
    return { type: 'unknown', message: this.message, originalError: this };
  }
}

// Extend axios config to include metadata
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  metadata?: {
    requestId: string;
  };
}

// Retry configuration
interface RetryConfig {
  attempts: number;
  delay: number;
  backoff: boolean;
}

// Sleep utility for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Exponential backoff calculation
const calculateBackoffDelay = (attempt: number, baseDelay: number): number => {
  return baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
};

class ApiClient {
  private axiosInstance: AxiosInstance;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor() {
    this.axiosInstance = axios.create({
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Add authentication token
        const session = await supabase.auth.getSession();
        if (session.data.session?.access_token) {
          config.headers.Authorization = `Bearer ${session.data.session.access_token}`;
        }

        // Add CORS headers
        config.headers['Access-Control-Allow-Origin'] = '*';
        config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        config.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';

        // Add request ID for tracking
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        (config as any).metadata = { requestId };

        return config;
      },
      (error) => {
        return Promise.reject(new ApiClientError('Request configuration error', 0, 'REQUEST_CONFIG_ERROR', error));
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Clean up abort controller
        if ((response.config as any).metadata?.requestId) {
          this.abortControllers.delete((response.config as any).metadata.requestId);
        }
        return response;
      },
      async (error: AxiosError) => {
        // Clean up abort controller
        if ((error.config as any)?.metadata?.requestId) {
          this.abortControllers.delete((error.config as any).metadata.requestId);
        }

        // Handle different error types
        if (error.code === 'ECONNABORTED') {
          throw new ApiClientError('Request timeout', 408, 'TIMEOUT', error);
        }

        if (error.response?.status === 401) {
          // Handle authentication errors
          await this.handleAuthError();
          throw new ApiClientError('Authentication failed', 401, 'AUTH_ERROR', error);
        }

        if (error.response?.status === 429) {
          throw new ApiClientError('Rate limit exceeded', 429, 'RATE_LIMIT', error);
        }

        if (!error.response) {
          throw new ApiClientError('Network error', 0, 'NETWORK_ERROR', error);
        }

        // Handle 404 errors with toast
        if (error.response.status === 404) {
          showToast.error('API Not Found', { description: 'Check backend URL' });
        }

        const errorData = error.response.data as any;
        throw new ApiClientError(
          errorData?.message || error.message || 'API request failed',
          error.response.status,
          errorData?.code || 'API_ERROR',
          errorData
        );
      }
    );
  }

  private async handleAuthError() {
    // Try to refresh the session
    try {
      await supabase.auth.refreshSession();
    } catch (refreshError) {
      console.error('Session refresh failed:', refreshError);
      showToast.error('Authentication expired. Please sign in again.');
      // Optionally redirect to login
      window.location.href = '/auth';
    }
  }

  // Retry logic with exponential backoff
  private async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = {
      attempts: API_CONFIG.retryAttempts,
      delay: API_CONFIG.retryDelay,
      backoff: true,
    }
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= config.attempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (error instanceof ApiClientError) {
          if ([400, 401, 403, 404, 422].includes(error.status || 0)) {
            throw error;
          }
        }

        // Don't retry on the last attempt
        if (attempt === config.attempts) {
          break;
        }

        // Calculate delay
        const delay = config.backoff 
          ? calculateBackoffDelay(attempt, config.delay)
          : config.delay;

        console.warn(`API request failed (attempt ${attempt}/${config.attempts}), retrying in ${delay}ms:`, error);
        await sleep(delay);
      }
    }

    throw lastError!;
  }

  // Cancel a request by ID
  public cancelRequest(requestId: string): void {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }

  // Cancel all pending requests
  public cancelAllRequests(): void {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
  }

  // Supabase Edge Function call with query logging
  public async callEdgeFunction<T = any>(
    functionName: string,
    body?: any,
    options?: {
      retryConfig?: Partial<RetryConfig>;
      timeout?: number;
    }
  ): Promise<T> {
    return this.withRetry(async () => {
      console.log(`Query executed: edge-function-${functionName}`, { body, timestamp: Date.now() });
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        console.error(`Edge function ${functionName} error:`, error);
        throw new ApiClientError(
          error.message || `Edge function ${functionName} failed`,
          error.status || 500,
          'EDGE_FUNCTION_ERROR',
          error
        );
      }

      console.log(`Query completed: edge-function-${functionName}`, { success: true, timestamp: Date.now() });
      return data;
    }, {
      attempts: options?.retryConfig?.attempts || API_CONFIG.retryAttempts,
      delay: options?.retryConfig?.delay || API_CONFIG.retryDelay,
      backoff: options?.retryConfig?.backoff ?? true,
    });
  }

  // External API call
  public async call<T = any>(
    config: AxiosRequestConfig & {
      retryConfig?: Partial<RetryConfig>;
    }
  ): Promise<T> {
    const { retryConfig, ...axiosConfig } = config;

    return this.withRetry(async () => {
      // Create abort controller for this request
      const controller = new AbortController();
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      this.abortControllers.set(requestId, controller);

      const response = await this.axiosInstance({
        ...axiosConfig,
        signal: controller.signal,
      } as any);

      return response.data;
    }, {
      attempts: retryConfig?.attempts || API_CONFIG.retryAttempts,
      delay: retryConfig?.delay || API_CONFIG.retryDelay,
      backoff: retryConfig?.backoff ?? true,
    });
  }

  // Convenience methods
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.call<T>({ ...config, method: 'GET', url });
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.call<T>({ ...config, method: 'POST', url, data });
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.call<T>({ ...config, method: 'PUT', url, data });
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.call<T>({ ...config, method: 'DELETE', url });
  }

  // Specific method for scan operations
  public async performScan(data: ScanRequest): Promise<ScanResponse> {
    return withAsyncErrorHandling(
      async () => {
        // Validate and sanitize scan request
        const scanValidation = validateScanRequest(data);
        if (!scanValidation.isValid) {
          throw new ApiClientError(
            `Invalid scan request: ${scanValidation.errors.join(', ')}`,
            400,
            'VALIDATION_ERROR',
            { errors: scanValidation.errors }
          );
        }

        // Use sanitized data
        const sanitizedData = sanitizeApiPayload(scanValidation.sanitizedRequest);
        
        // Call the appropriate edge function based on scan type
        const functionName = `${data.scanType}-scan`;
        console.log(`Calling edge function: ${functionName}`, sanitizedData);
        
        const response = await this.callEdgeFunction(functionName, {
          query: `Analyze ${sanitizedData.targetUrl} for AI visibility and search ranking potential`,
          targetUrl: sanitizedData.targetUrl,
          queries: sanitizedData.queries || [],
          options: sanitizedData.options || {}
        }, {
          retryConfig: {
            attempts: 2,
            delay: 3000,
          }
        });

        // Return the response directly as it matches our expected format
        console.log('Scan completed successfully:', response);
        return response;
      },
      {
        context: 'Scan Operation',
        retryAttempts: 2,
        retryDelay: 1000,
        showToast: true,
        logError: true,
      }
    ) as Promise<ScanResponse>;
  }


  // Health check
  public async healthCheck(): Promise<{ status: string; timestamp: number }> {
    return withAsyncErrorHandling(
      async () => {
        await this.get(`${API_CONFIG.apiBaseUrl}/health`);
        return {
          status: 'healthy',
          timestamp: Date.now(),
        };
      },
      {
        context: 'Health Check',
        showToast: false,
        logError: false,
        fallbackValue: {
          status: 'unhealthy',
          timestamp: Date.now(),
        },
      }
    ) as Promise<{ status: string; timestamp: number }>;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export types
export { ApiClientError as ApiError };
export type { RetryConfig };

// Export convenience functions
export const {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  callEdgeFunction,
  performScan,
  
  cancelRequest,
  cancelAllRequests,
  healthCheck,
} = apiClient;
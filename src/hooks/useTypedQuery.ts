// Type-safe React Query hooks with runtime validation

import { useQuery, useMutation, UseQueryOptions, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { 
  validateApiResponse, 
  AppError, 
  ScanRequest, 
  ScanResponse,
  ApiKeyValidationRequest,
  ApiKeyValidationResult,
  ScanResponseSchema,
  ApiKeyValidationResultSchema
} from '@/types/api';
import { errorHandler } from '@/lib/error-handler';

/**
 * Type-safe query hook with runtime validation
 */
export function useTypedQuery<TData, TError = AppError>(
  key: string[],
  queryFn: () => Promise<unknown>,
  schema: z.ZodSchema<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, TError>({
    queryKey: key,
    queryFn: async () => {
      try {
        const response = await queryFn();
        const validation = validateApiResponse(schema, response);
        
        if (!validation.success) {
          const error = validation.error;
          throw new Error(`Validation failed: ${error.type}: ${error.message}`);
        }
        
        return validation.data;
      } catch (error) {
        const normalizedError = errorHandler.normalizeError(error, `Query: ${key.join('.')}`);
        throw normalizedError;
      }
    },
    ...options,
  });
}

/**
 * Type-safe mutation hook with runtime validation
 */
export function useTypedMutation<TData, TVariables, TError = AppError>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  schema: z.ZodSchema<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
) {
  return useMutation<TData, TError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      try {
        const response = await mutationFn(variables);
        const validation = validateApiResponse(schema, response);
        
        if (!validation.success) {
          const error = validation.error;
          throw new Error(`Validation failed: ${error.type}: ${error.message}`);
        }
        
        return validation.data;
      } catch (error) {
        const normalizedError = errorHandler.normalizeError(error, 'Mutation');
        throw normalizedError;
      }
    },
    ...options,
  });
}

/**
 * Specific hooks for common operations
 */

// Scan operations
export function useScanMutation(
  options?: Omit<UseMutationOptions<ScanResponse, AppError, ScanRequest>, 'mutationFn'>
) {
  return useMutation<ScanResponse, AppError, ScanRequest>({
    mutationFn: async (data: ScanRequest) => {
      const response = await apiClient.performScan(data);
      return response;
    },
    ...options,
    onError: (error, variables, context) => {
      errorHandler.handleError(error, 'Scan Operation');
      options?.onError?.(error, variables, context);
    },
  });
}

// API Key validation
export function useApiKeyValidationMutation(
  options?: Omit<UseMutationOptions<ApiKeyValidationResult, AppError, ApiKeyValidationRequest>, 'mutationFn'>
) {
  return useMutation<ApiKeyValidationResult, AppError, ApiKeyValidationRequest>({
    mutationFn: async (data: ApiKeyValidationRequest) => {
      const response = await apiClient.validateApiKeys(data);
      return response;
    },
    ...options,
    onError: (error, variables, context) => {
      errorHandler.handleError(error, 'API Key Validation');
      options?.onError?.(error, variables, context);
    },
  });
}

// Health check query
export function useHealthCheckQuery(
  options?: Omit<UseQueryOptions<{ status: string; timestamp: number }, AppError>, 'queryKey' | 'queryFn'>
) {
  const HealthCheckSchema = z.object({
    status: z.string(),
    timestamp: z.number(),
  });

  return useTypedQuery(
    ['health-check'],
    () => apiClient.healthCheck(),
    HealthCheckSchema,
    {
      ...options,
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 10000, // Consider stale after 10 seconds
    }
  );
}

/**
 * Query key factories for consistent cache management
 */
export const queryKeys = {
  health: () => ['health-check'] as const,
  scans: {
    all: () => ['scans'] as const,
    lists: () => ['scans', 'list'] as const,
    list: (filters: Record<string, unknown>) => ['scans', 'list', filters] as const,
    details: () => ['scans', 'detail'] as const,
    detail: (id: string) => ['scans', 'detail', id] as const,
  },
  apiKeys: {
    all: () => ['api-keys'] as const,
    validation: (provider: string) => ['api-keys', 'validation', provider] as const,
  },
  users: {
    all: () => ['users'] as const,
    profile: (userId: string) => ['users', 'profile', userId] as const,
  },
} as const;

/**
 * Type-safe query invalidation helpers
 */
export function useQueryInvalidation() {
  const queryClient = useQueryClient();

  return {
    invalidateScans: () => queryClient.invalidateQueries({ queryKey: queryKeys.scans.all() }),
    invalidateScanDetails: (id: string) => 
      queryClient.invalidateQueries({ queryKey: queryKeys.scans.detail(id) }),
    invalidateApiKeys: () => queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all() }),
    invalidateHealth: () => queryClient.invalidateQueries({ queryKey: queryKeys.health() }),
  };
}

/**
 * Optimistic update helpers with type safety
 */
export function useOptimisticUpdates() {
  const queryClient = useQueryClient();

  return {
    updateScanOptimistically: <T>(id: string, updater: (old: T) => T) => {
      queryClient.setQueryData(queryKeys.scans.detail(id), updater);
    },
    
    revertScanUpdate: (id: string, previousData: unknown) => {
      queryClient.setQueryData(queryKeys.scans.detail(id), previousData);
    },
  };
}
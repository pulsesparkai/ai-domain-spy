// API types with discriminated unions and proper error handling

import { z } from 'zod';
import type {
  UserId,
  ScanId,
  OpenAIApiKey,
  PerplexityApiKey,
  TargetUrl,
  ISODateString,
  RequestId
} from './branded';

// =====================
// Error Types
// =====================

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  requestId: z.string().optional(),
  timestamp: z.string(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

// Discriminated union for different error types
export type AppError = 
  | { type: 'network'; message: string; code?: string }
  | { type: 'validation'; message: string; field?: string }
  | { type: 'authentication'; message: string; code: string }
  | { type: 'authorization'; message: string; resource?: string }
  | { type: 'rate_limit'; message: string; retryAfter?: number }
  | { type: 'api'; message: string; code: string; details?: Record<string, unknown> }
  | { type: 'unknown'; message: string; originalError?: unknown };

// =====================
// Base Response Types
// =====================

export const BaseResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string(),
  requestId: z.string().optional(),
});

export const SuccessResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: z.unknown(),
});

export const ErrorResponseSchema = BaseResponseSchema.extend({
  success: z.literal(false),
  error: ApiErrorSchema,
});

export const ApiResponseSchema = z.discriminatedUnion('success', [
  SuccessResponseSchema,
  ErrorResponseSchema,
]);

export type BaseResponse = z.infer<typeof BaseResponseSchema>;
export type SuccessResponse<T = unknown> = Omit<z.infer<typeof SuccessResponseSchema>, 'data'> & { data: T };
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// =====================
// Scan Types
// =====================

export const ScanStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']);
export type ScanStatus = z.infer<typeof ScanStatusSchema>;

export const ScanTypeSchema = z.enum(['openai', 'perplexity', 'combined', 'trending']);
export type ScanType = z.infer<typeof ScanTypeSchema>;

// Discriminated union for scan results based on scan type
export const OpenAIScanResultSchema = z.object({
  type: z.literal('openai'),
  queries: z.array(z.string()),
  responses: z.array(z.object({
    query: z.string(),
    response: z.string(),
    confidence: z.number().min(0).max(1),
    sources: z.array(z.string()).optional(),
  })),
  metadata: z.object({
    model: z.string(),
    totalTokens: z.number(),
    processingTime: z.number(),
  }),
});

export const PerplexityScanResultSchema = z.object({
  type: z.literal('perplexity'),
  queries: z.array(z.string()),
  responses: z.array(z.object({
    query: z.string(),
    response: z.string(),
    citations: z.array(z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
    })),
    followUpQuestions: z.array(z.string()).optional(),
  })),
  metadata: z.object({
    model: z.string(),
    processingTime: z.number(),
  }),
});

export const CombinedScanResultSchema = z.object({
  type: z.literal('combined'),
  openaiResults: OpenAIScanResultSchema.omit({ type: true }),
  perplexityResults: PerplexityScanResultSchema.omit({ type: true }),
  comparison: z.object({
    overlap: z.number().min(0).max(1),
    differences: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
});

export const TrendingScanResultSchema = z.object({
  type: z.literal('trending'),
  queries: z.array(z.string()),
  trends: z.array(z.object({
    query: z.string(),
    volume: z.number(),
    growth: z.number(),
    regions: z.array(z.string()),
    relatedQueries: z.array(z.string()),
  })),
  metadata: z.object({
    timeRange: z.string(),
    dataSource: z.string(),
    processingTime: z.number(),
  }),
});

export const ScanResultSchema = z.discriminatedUnion('type', [
  OpenAIScanResultSchema,
  PerplexityScanResultSchema,
  CombinedScanResultSchema,
  TrendingScanResultSchema,
]);

export type OpenAIScanResult = z.infer<typeof OpenAIScanResultSchema>;
export type PerplexityScanResult = z.infer<typeof PerplexityScanResultSchema>;
export type CombinedScanResult = z.infer<typeof CombinedScanResultSchema>;
export type TrendingScanResult = z.infer<typeof TrendingScanResultSchema>;
export type ScanResult = z.infer<typeof ScanResultSchema>;

// =====================
// Scan Entity
// =====================

export const ScanSchema = z.object({
  id: z.string(),
  userId: z.string(),
  scanType: ScanTypeSchema,
  status: ScanStatusSchema,
  targetUrl: z.string().optional(),
  queries: z.array(z.string()),
  results: ScanResultSchema.optional(),
  error: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  metadata: z.object({
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    estimatedDuration: z.number().optional(),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
  }).optional(),
});

export type Scan = z.infer<typeof ScanSchema>;

// =====================
// API Request/Response Types
// =====================

export const ScanRequestSchema = z.object({
  scanType: ScanTypeSchema,
  queries: z.array(z.string()).min(1),
  targetUrl: z.string().optional(),
  options: z.object({
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
    includeMetadata: z.boolean().default(true),
    timeout: z.number().min(1000).max(300000).default(30000),
  }).optional(),
});

export type ScanRequest = z.infer<typeof ScanRequestSchema>;

export const ScanResponseSchema = SuccessResponseSchema.extend({
  data: ScanSchema,
});

export type ScanResponse = z.infer<typeof ScanResponseSchema>;

// =====================
// API Key Validation
// =====================

export const ApiKeyValidationRequestSchema = z.object({
  query: z.string().min(1),
  openaiKey: z.string().optional(),
  perplexityKey: z.string().optional(),
});

export const ApiKeyValidationResultSchema = z.object({
  openai: z.object({
    valid: z.boolean(),
    error: z.string().optional(),
    model: z.string().optional(),
  }).optional(),
  perplexity: z.object({
    valid: z.boolean(),
    error: z.string().optional(),
    model: z.string().optional(),
  }).optional(),
});

export type ApiKeyValidationRequest = z.infer<typeof ApiKeyValidationRequestSchema>;
export type ApiKeyValidationResult = z.infer<typeof ApiKeyValidationResultSchema>;

// =====================
// User Profile Types
// =====================

export const UserProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  email: z.string().email(),
  fullName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  subscription: z.object({
    status: z.enum(['trial', 'active', 'cancelled', 'expired']),
    tier: z.enum(['free', 'pro', 'enterprise']).optional(),
    stripeCustomerId: z.string().optional(),
    trialEndsAt: z.string().optional(),
  }),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// =====================
// Utility Functions
// =====================

export const validateApiResponse = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: AppError } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          type: 'validation',
          message: 'Invalid response format',
          field: error.errors[0]?.path.join('.'),
        },
      };
    }
    return {
      success: false,
      error: {
        type: 'unknown',
        message: 'Failed to validate response',
        originalError: error,
      },
    };
  }
};

// Type guards for discriminated unions
export const isSuccessResponse = <T>(response: ApiResponse<T>): response is SuccessResponse<T> => {
  return response.success === true;
};

export const isErrorResponse = (response: ApiResponse): response is ErrorResponse => {
  return response.success === false;
};

export const isScanResult = (result: unknown): result is ScanResult => {
  return ScanResultSchema.safeParse(result).success;
};

// Error type exhaustive checking
export const exhaustiveErrorCheck = (error: never): never => {
  throw new Error(`Unhandled error type: ${JSON.stringify(error)}`);
};

// Helper to assert never (for exhaustive checking)
export const assertNever = (value: never): never => {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
};
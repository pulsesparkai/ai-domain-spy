// Central type exports for the application

// Re-export all branded types
export * from './branded';

// Re-export all API types
export * from './api';

// Re-export all store types
export * from './store';

// Additional utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// Common utility types
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Async state types
export type AsyncState<T, E = Error> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E };

// Form state types
export type FormState<T> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
};

// Pagination types
export type PaginationParams = {
  page: number;
  limit: number;
  offset?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

// Sort and filter types
export type SortDirection = 'asc' | 'desc';

export type SortConfig<T> = {
  key: keyof T;
  direction: SortDirection;
};

export type FilterConfig<T> = {
  [K in keyof T]?: T[K] extends string 
    ? string | string[]
    : T[K] extends number
    ? number | { min?: number; max?: number }
    : T[K] extends boolean
    ? boolean
    : unknown;
};

// Event types
export type EventCallback<T = void> = (data: T) => void;
export type AsyncEventCallback<T = void> = (data: T) => Promise<void>;

// Component prop types
export type ComponentWithChildren<T = {}> = T & {
  children?: React.ReactNode;
};

export type ComponentVariant<T extends string> = {
  variant?: T;
};

export type ComponentSize<T extends string> = {
  size?: T;
};

// Common component props
export type BaseComponentProps = {
  className?: string;
  id?: string;
  'data-testid'?: string;
};

// Status types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type RequestStatus = 'pending' | 'fulfilled' | 'rejected';

// Time-related types
export type TimeRange = {
  start: Date;
  end: Date;
};

export type Duration = {
  value: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days';
};

// Configuration types
export type FeatureFlag = boolean;

export type FeatureFlags = {
  enableBetaFeatures: FeatureFlag;
  enableAdvancedAnalytics: FeatureFlag;
  enableRealTimeUpdates: FeatureFlag;
  enableExperimentalUI: FeatureFlag;
};

// Validation types
export type ValidationRule<T> = (value: T) => string | undefined;

export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

export type ColorScheme = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
};

// API response wrapper types
export type APIResponse<T = unknown> = 
  | { success: true; data: T; message?: string }
  | { success: false; error: string; code?: string };

// Environment types
export type Environment = 'development' | 'staging' | 'production' | 'test';

// Metadata types
export type Metadata = Record<string, unknown>;

export type TimestampedEntity = {
  createdAt: string;
  updatedAt: string;
};

export type UserEntity = {
  userId: string;
};

export type IdentifiableEntity = {
  id: string;
};

// Base entity type combining common fields
export type BaseEntity = IdentifiableEntity & TimestampedEntity & UserEntity;
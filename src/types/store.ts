// Store-specific types with proper state management patterns

import { z } from 'zod';
import type { 
  UserId, 
  ScanId, 
  ISODateString 
} from './branded';
import type { Scan, ScanResult, ScanStatus, ScanType } from './api';

// =====================
// Store State Types
// =====================

// User Preferences Store
export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.string().default('en'),
  timezone: z.string().default('UTC'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(false),
    scanComplete: z.boolean().default(true),
    weeklyReport: z.boolean().default(true),
  }).default({}),
  dashboard: z.object({
    defaultView: z.enum(['grid', 'list']).default('grid'),
    itemsPerPage: z.number().min(5).max(100).default(20),
    autoRefresh: z.boolean().default(false),
    showTutorial: z.boolean().default(true),
  }).default({}),
  privacy: z.object({
    analytics: z.boolean().default(true),
    crashReporting: z.boolean().default(true),
    usageStatistics: z.boolean().default(true),
  }).default({}),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;


// Scan History Store
export const ScanHistoryItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  scanType: z.enum(['openai', 'perplexity', 'combined', 'trending']),
  targetUrl: z.string().optional(),
  queries: z.array(z.string()),
  results: z.unknown().optional(), // Use unknown for flexibility, validate with ScanResult when needed
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']),
  createdAt: z.string(),
  updatedAt: z.string(),
  error: z.string().optional(),
  metadata: z.object({
    estimatedDuration: z.number().optional(),
    actualDuration: z.number().optional(),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
    retryCount: z.number().default(0),
  }).optional(),
});

export type ScanHistoryItem = z.infer<typeof ScanHistoryItemSchema>;

// =====================
// Store Action Types
// =====================

// Scan History Actions
export type ScanHistoryActions = {
  // Basic CRUD
  addScan: (scan: Omit<ScanHistoryItem, 'id' | 'createdAt' | 'updatedAt'>) => ScanId;
  updateScan: (id: ScanId, updates: Partial<ScanHistoryItem>) => void;
  deleteScan: (id: ScanId) => void;
  clearHistory: () => void;
  
  // State management
  setCurrentScan: (scan: ScanHistoryItem | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Optimistic updates
  optimisticUpdateScan: (id: ScanId, updates: Partial<ScanHistoryItem>) => void;
  revertOptimisticUpdate: (id: ScanId, originalScan: ScanHistoryItem) => void;
  
  // Backend sync
  syncWithBackend: (scans: ScanHistoryItem[]) => void;
  loadFromBackend: () => Promise<void>;
  
  // Batch operations
  bulkUpdateScans: (updates: Array<{ id: ScanId; updates: Partial<ScanHistoryItem> }>) => void;
  markAsRead: (ids: ScanId[]) => void;
};

// User Preferences Actions
export type UserPreferencesActions = {
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetToDefaults: () => void;
  importPreferences: (preferences: UserPreferences) => void;
  exportPreferences: () => UserPreferences;
  updateTheme: (theme: UserPreferences['theme']) => void;
  updateLanguage: (language: string) => void;
  updateNotifications: (notifications: Partial<UserPreferences['notifications']>) => void;
  updateDashboard: (dashboard: Partial<UserPreferences['dashboard']>) => void;
  updatePrivacy: (privacy: Partial<UserPreferences['privacy']>) => void;
};


// =====================
// Store State Interfaces
// =====================

export interface ScanHistoryState {
  // Data
  scans: ScanHistoryItem[];
  currentScan: ScanHistoryItem | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Filters and sorting
  filters: {
    status?: ScanStatus[];
    type?: ScanType[];
    dateRange?: {
      start: ISODateString;
      end: ISODateString;
    };
    searchQuery?: string;
  };
  sortBy: 'createdAt' | 'updatedAt' | 'status';
  sortOrder: 'asc' | 'desc';
  
  // Pagination
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  
  // Actions
  actions: ScanHistoryActions;
}

export interface UserPreferencesState {
  // Data
  preferences: UserPreferences;
  
  // UI State
  isLoading: boolean;
  isDirty: boolean;
  lastSaved: ISODateString | null;
  error: string | null;
  
  // Actions
  actions: UserPreferencesActions;
}


// =====================
// Derived State Selectors
// =====================

export type ScanHistorySelectors = {
  getLatestScan: () => ScanHistoryItem | null;
  getCompletedScans: () => ScanHistoryItem[];
  getFailedScans: () => ScanHistoryItem[];
  getPendingScans: () => ScanHistoryItem[];
  getScansByType: (type: ScanType) => ScanHistoryItem[];
  getScanStats: () => {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    successRate: number;
  };
  getFilteredScans: () => ScanHistoryItem[];
  getPaginatedScans: () => {
    scans: ScanHistoryItem[];
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};


// =====================
// Store Configuration
// =====================

export interface StoreConfig {
  persistence: {
    enabled: boolean;
    key: string;
    version: number;
    migrate?: (persistedState: unknown, version: number) => unknown;
    partialize?: (state: unknown) => unknown;
  };
  devtools: {
    enabled: boolean;
    name?: string;
  };
}

// =====================
// Store Error Types
// =====================

export type StoreError = 
  | { type: 'persistence'; message: string; key: string }
  | { type: 'validation'; message: string; field: string }
  | { type: 'sync'; message: string; operation: string }
  | { type: 'encryption'; message: string; provider: string }
  | { type: 'network'; message: string; endpoint: string };

// =====================
// Type Guards
// =====================

export const isScanHistoryItem = (item: unknown): item is ScanHistoryItem => {
  return ScanHistoryItemSchema.safeParse(item).success;
};

export const isUserPreferences = (prefs: unknown): prefs is UserPreferences => {
  return UserPreferencesSchema.safeParse(prefs).success;
};

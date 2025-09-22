import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

// Central application state interface
export interface AppState {
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Current active data
  activeScan: any | null;
  activeView: string;
  
  // Real-time data
  realtimeMetrics: {
    visibilityScore: number;
    citationsCount: number;
    mentionsCount: number;
    activePlatforms: string[];
  };
  
  // User input states
  scanInputs: {
    targetUrl: string;
    scanType: string;
    queries: string[];
  };
  
  // Filter states
  filters: {
    dateRange: { from: string; to: string };
    status: string[];
    platforms: string[];
    sentimentType: string[];
  };
}

interface AppStateActions {
  // Global state actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Active data actions
  setActiveScan: (scan: any) => void;
  setActiveView: (view: string) => void;
  
  // Real-time metrics actions
  updateRealtimeMetrics: (metrics: Partial<AppState['realtimeMetrics']>) => void;
  
  // User input actions
  updateScanInputs: (inputs: Partial<AppState['scanInputs']>) => void;
  resetScanInputs: () => void;
  
  // Filter actions
  updateFilters: (filters: Partial<AppState['filters']>) => void;
  resetFilters: () => void;
  
  // Bulk actions
  resetAppState: () => void;
}

const defaultState: AppState = {
  isLoading: false,
  error: null,
  activeScan: null,
  activeView: 'dashboard',
  realtimeMetrics: {
    visibilityScore: 0,
    citationsCount: 0,
    mentionsCount: 0,
    activePlatforms: []
  },
  scanInputs: {
    targetUrl: '',
    scanType: 'brand-monitoring',
    queries: ['']
  },
  filters: {
    dateRange: { from: '', to: '' },
    status: [],
    platforms: [],
    sentimentType: []
  }
};

export const useAppStateStore = create<AppState & AppStateActions>()(
  persist(
    (set, get) => ({
      ...defaultState,
      
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      
      setActiveScan: (scan) => set({ activeScan: scan }),
      setActiveView: (view) => set({ activeView: view }),
      
      updateRealtimeMetrics: (metrics) =>
        set((state) => ({
          realtimeMetrics: { ...state.realtimeMetrics, ...metrics }
        })),
      
      updateScanInputs: (inputs) =>
        set((state) => ({
          scanInputs: { ...state.scanInputs, ...inputs }
        })),
      
      resetScanInputs: () =>
        set({ scanInputs: defaultState.scanInputs }),
      
      updateFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters }
        })),
      
      resetFilters: () =>
        set({ filters: defaultState.filters }),
      
      resetAppState: () => set(defaultState)
    }),
    {
      name: 'app-state-storage',
      version: 1,
      partialize: (state) => ({
        activeView: state.activeView,
        scanInputs: state.scanInputs,
        filters: state.filters
      })
    }
  )
);

// Selectors for derived state
export const useAppLoading = () => useAppStateStore((state) => state.isLoading);
export const useAppError = () => useAppStateStore((state) => state.error);
export const useActiveScan = () => useAppStateStore((state) => state.activeScan);
export const useActiveView = () => useAppStateStore((state) => state.activeView);
export const useRealtimeMetrics = () => useAppStateStore((state) => state.realtimeMetrics);
export const useScanInputs = () => useAppStateStore((state) => state.scanInputs);
export const useAppFilters = () => useAppStateStore((state) => state.filters);
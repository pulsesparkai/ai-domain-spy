import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  ScanHistoryItem, 
  ScanHistoryState, 
  ScanHistoryActions,
  isScanHistoryItem
} from '@/types/store';
import { 
  createScanId, 
  createUserId,
  type ScanId,
  type UserId 
} from '@/types/branded';
import { ScanStatus, ScanType } from '@/types/api';

// Legacy interface for backward compatibility
export interface ScanResult extends ScanHistoryItem {}

interface TypedScanHistoryState {
  // Data
  scans: ScanHistoryItem[];
  currentScan: ScanHistoryItem | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Filters and sorting (simplified for now)
  filters: {
    status?: ScanStatus[];
    type?: ScanType[];
  };
  sortBy: 'createdAt' | 'updatedAt' | 'status';
  sortOrder: 'asc' | 'desc';
  
  // Pagination
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  
  // Actions with proper types
  addScan: (scan: Omit<ScanHistoryItem, 'id' | 'createdAt' | 'updatedAt'>) => ScanId;
  updateScan: (id: ScanId, updates: Partial<ScanHistoryItem>) => void;
  deleteScan: (id: ScanId) => void;
  clearHistory: () => void;
  setCurrentScan: (scan: ScanHistoryItem | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Optimistic updates
  optimisticUpdateScan: (id: ScanId, updates: Partial<ScanHistoryItem>) => void;
  revertOptimisticUpdate: (id: ScanId, originalScan: ScanHistoryItem) => void;
  
  // Sync with backend
  syncWithBackend: (scans: ScanHistoryItem[]) => void;
  loadFromBackend: () => Promise<void>;
}

// Store for rollback functionality
const optimisticUpdates = new Map<ScanId, ScanHistoryItem>();

export const useScanHistoryStore = create<TypedScanHistoryState>()(
  persist(
    (set, get) => ({
      scans: [],
      currentScan: null,
      isLoading: false,
      error: null,
      
      // Filters and sorting defaults
      filters: {},
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
      
      // Pagination defaults
      currentPage: 1,
      itemsPerPage: 20,
      totalItems: 0,
      
      addScan: (scanData) => {
        const scanId = createScanId(crypto.randomUUID());
        const newScan: ScanHistoryItem = {
          ...scanData,
          id: scanId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Validate the scan data
        if (!isScanHistoryItem(newScan)) {
          throw new Error('Invalid scan data provided');
        }
        
        set((state) => ({
          scans: [newScan, ...state.scans],
          currentScan: newScan
        }));
        
        return scanId;
      },
      
      updateScan: (id, updates) =>
        set((state) => ({
          scans: state.scans.map((scan) =>
            scan.id === id
              ? { ...scan, ...updates, updatedAt: new Date().toISOString() }
              : scan
          ),
          currentScan: state.currentScan?.id === id
            ? { ...state.currentScan, ...updates, updatedAt: new Date().toISOString() }
            : state.currentScan
        })),
      
      deleteScan: (id) =>
        set((state) => ({
          scans: state.scans.filter((scan) => scan.id !== id),
          currentScan: state.currentScan?.id === id ? null : state.currentScan
        })),
      
      clearHistory: () =>
        set({
          scans: [],
          currentScan: null,
          error: null
        }),
      
      setCurrentScan: (scan) =>
        set({ currentScan: scan }),
      
      setLoading: (isLoading) =>
        set({ isLoading }),
      
      setError: (error) =>
        set({ error }),
      
      // Optimistic updates for better UX
      optimisticUpdateScan: (id, updates) => {
        const { scans, currentScan } = get();
        const originalScan = scans.find(scan => scan.id === id);
        
        if (originalScan) {
          // Store original for potential rollback
          optimisticUpdates.set(id, originalScan);
          
          // Apply optimistic update
          set((state) => ({
            scans: state.scans.map((scan) =>
              scan.id === id
                ? { ...scan, ...updates, updatedAt: new Date().toISOString() }
                : scan
            ),
            currentScan: state.currentScan?.id === id
              ? { ...state.currentScan, ...updates, updatedAt: new Date().toISOString() }
              : state.currentScan
          }));
        }
      },
      
      revertOptimisticUpdate: (id, originalScan) => {
        const stored = optimisticUpdates.get(id) || originalScan;
        
        set((state) => ({
          scans: state.scans.map((scan) =>
            scan.id === id ? stored : scan
          ),
          currentScan: state.currentScan?.id === id ? stored : state.currentScan
        }));
        
        optimisticUpdates.delete(id);
      },
      
      syncWithBackend: (backendScans) =>
        set((state) => {
          // Merge local and backend scans, preferring backend data
          const mergedScans = [...backendScans];
          
          // Add any local scans that aren't in backend yet
          state.scans.forEach(localScan => {
            if (!backendScans.find(backendScan => backendScan.id === localScan.id)) {
              mergedScans.push(localScan);
            }
          });
          
          // Sort by creation date, newest first
          mergedScans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          return {
            scans: mergedScans,
            currentScan: state.currentScan ? 
              mergedScans.find(scan => scan.id === state.currentScan!.id) || null :
              null
          };
        }),
      
      loadFromBackend: async () => {
        // This would be implemented to load from Supabase
        // For now, it's a placeholder
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          set({ isLoading: false });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to load scan history' 
          });
        }
      }
    }),
    {
      name: 'scan-history-storage',
      version: 1,
      // Only persist non-sensitive scan metadata
      partialize: (state) => ({
        scans: state.scans.map(scan => ({
          ...scan,
          // Don't persist sensitive results in localStorage
          results: undefined
        }))
      }),
    }
  )
);

// Selectors for derived state
export const useLatestScan = () =>
  useScanHistoryStore((state) => 
    state.scans.length > 0 ? state.scans[0] : null
  );

export const useCompletedScans = () =>
  useScanHistoryStore((state) => 
    state.scans.filter(scan => scan.status === 'completed')
  );

export const useFailedScans = () =>
  useScanHistoryStore((state) => 
    state.scans.filter(scan => scan.status === 'failed')
  );

export const usePendingScans = () =>
  useScanHistoryStore((state) => 
    state.scans.filter(scan => scan.status === 'pending')
  );

export const useScansByType = (scanType: string) =>
  useScanHistoryStore((state) => 
    state.scans.filter(scan => scan.scanType === scanType)
  );

export const useScanStats = () =>
  useScanHistoryStore((state) => {
    const total = state.scans.length;
    const completed = state.scans.filter(scan => scan.status === 'completed').length;
    const failed = state.scans.filter(scan => scan.status === 'failed').length;
    const pending = state.scans.filter(scan => scan.status === 'pending').length;
    
    return {
      total,
      completed,
      failed,
      pending,
      successRate: total > 0 ? (completed / total) * 100 : 0
    };
  });
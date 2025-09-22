import React, { createContext, useContext, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDataFlow } from '@/hooks/useDataFlow';
import { useStoreSync } from '@/hooks/useStoreSync';
import { useRealtimeMonitoring } from '@/hooks/useRealtimeMonitoring';

// Create optimized QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 3;
      }
    },
    mutations: {
      retry: 1
    }
  }
});

// Context for sharing data flow state
interface DataFlowContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  refetchData: () => void;
}

const DataFlowContext = createContext<DataFlowContextType | null>(null);

// Hook to use data flow context
export const useDataFlowContext = () => {
  const context = useContext(DataFlowContext);
  if (!context) {
    throw new Error('useDataFlowContext must be used within DataFlowProvider');
  }
  return context;
};

// Internal provider that handles all data coordination
const DataFlowInternalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dataFlow = useDataFlow();
  const storeSync = useStoreSync();
  const realtimeMonitoring = useRealtimeMonitoring();

  const contextValue: DataFlowContextType = {
    isInitialized: storeSync.isInitialized,
    isLoading: dataFlow.isLoading,
    error: null, // Global error state would be managed here
    refetchData: dataFlow.refetchScans
  };

  return (
    <DataFlowContext.Provider value={contextValue}>
      {children}
    </DataFlowContext.Provider>
  );
};

// Main provider that wraps everything
export const DataFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <DataFlowInternalProvider>
        {children}
      </DataFlowInternalProvider>
    </QueryClientProvider>
  );
};

// Hook for components to access coordinated data operations
export const useCoordinatedData = () => {
  const dataFlow = useDataFlow();
  const { activityFeed, metrics, hasNewNotifications } = useRealtimeMonitoring();
  
  return {
    // Data
    scansData: dataFlow.scansData,
    metricsData: dataFlow.metricsData,
    activityFeed,
    realtimeMetrics: metrics,
    
    // States
    isLoading: dataFlow.isLoading,
    hasNewNotifications,
    
    // Operations
    createScan: dataFlow.createScan,
    updateScan: dataFlow.updateScan,
    refetchScans: dataFlow.refetchScans,
    prefetchScanDetails: dataFlow.prefetchScanDetails,
    
    // Advanced
    queryClient: dataFlow.queryClient
  };
};
// Central store exports for easy imports
export { useUserPreferencesStore, useThemePreference, useNotificationPreference, useDashboardLayoutPreference, useScanDefaults } from './userPreferencesStore';

export { useApiKeysStore, useApiKeyStatus, useValidApiKeys, useApiKeysCount, useHasValidApiKeys } from './apiKeysStore';

export { useScanHistoryStore, useLatestScan, useCompletedScans, useFailedScans, usePendingScans, useScansByType, useScanStats } from './scanHistoryStore';

// Combined selectors for complex derived state
import { useUserPreferencesStore } from './userPreferencesStore';
import { useApiKeysStore } from './apiKeysStore';
import { useScanHistoryStore } from './scanHistoryStore';

export const useAppState = () => {
  const preferences = useUserPreferencesStore((state) => state.preferences);
  const apiKeysCount = useApiKeysStore((state) => Object.keys(state.apiKeys).length);
  const validationStatuses = useApiKeysStore((state) => state.validationStatus);
  const scans = useScanHistoryStore((state) => state.scans);
  
  const hasValidApiKeys = Object.values(validationStatuses).some(status => status === 'valid');
  const latestScan = scans.length > 0 ? scans[0] : null;
  const scanStats = {
    total: scans.length,
    completed: scans.filter(scan => scan.status === 'completed').length,
    failed: scans.filter(scan => scan.status === 'failed').length,
    pending: scans.filter(scan => scan.status === 'pending').length,
    successRate: scans.length > 0 ? (scans.filter(scan => scan.status === 'completed').length / scans.length) * 100 : 0
  };
  
  return {
    preferences,
    hasValidApiKeys,
    scanStats,
    latestScan,
    isConfigured: hasValidApiKeys && preferences.scanDefaults.scanType !== '',
  };
};
// Central store exports for easy imports
export { useUserPreferencesStore, useNotificationPreference, useDashboardLayoutPreference, useScanDefaults } from './userPreferencesStore';

export { useScanHistoryStore } from './scanHistoryStore';

// Combined selectors for complex derived state
import { useUserPreferencesStore } from './userPreferencesStore';
import { useScanHistoryStore } from './scanHistoryStore';

export const useAppState = () => {
  const preferences = useUserPreferencesStore((state) => state.preferences);
  const scans = useScanHistoryStore((state) => state.scans);
  
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
    scanStats,
    latestScan,
    isConfigured: preferences.scanDefaults.scanType !== '',
  };
};
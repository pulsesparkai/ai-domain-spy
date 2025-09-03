import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  autoSave: boolean;
  dashboardLayout: 'grid' | 'list';
  scanDefaults: {
    scanType: string;
    queries: string[];
  };
}

interface UserPreferencesState {
  preferences: UserPreferences;
  setTheme: (theme: UserPreferences['theme']) => void;
  setLanguage: (language: string) => void;
  toggleNotifications: () => void;
  toggleAutoSave: () => void;
  setDashboardLayout: (layout: UserPreferences['dashboardLayout']) => void;
  setScanDefaults: (defaults: Partial<UserPreferences['scanDefaults']>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'en',
  notifications: true,
  autoSave: true,
  dashboardLayout: 'grid',
  scanDefaults: {
    scanType: 'brand-monitoring',
    queries: ['']
  }
};

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,
      
      setTheme: (theme) =>
        set((state) => ({
          preferences: { ...state.preferences, theme }
        })),
      
      setLanguage: (language) =>
        set((state) => ({
          preferences: { ...state.preferences, language }
        })),
      
      toggleNotifications: () =>
        set((state) => ({
          preferences: { 
            ...state.preferences, 
            notifications: !state.preferences.notifications 
          }
        })),
      
      toggleAutoSave: () =>
        set((state) => ({
          preferences: { 
            ...state.preferences, 
            autoSave: !state.preferences.autoSave 
          }
        })),
      
      setDashboardLayout: (dashboardLayout) =>
        set((state) => ({
          preferences: { ...state.preferences, dashboardLayout }
        })),
      
      setScanDefaults: (defaults) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            scanDefaults: { ...state.preferences.scanDefaults, ...defaults }
          }
        })),
      
      updatePreferences: (updates) =>
        set((state) => ({
          preferences: { ...state.preferences, ...updates }
        })),
      
      resetPreferences: () =>
        set({ preferences: defaultPreferences })
    }),
    {
      name: 'user-preferences-storage',
      version: 1,
    }
  )
);

// Selectors for derived state
export const useThemePreference = () => 
  useUserPreferencesStore((state) => state.preferences.theme);

export const useNotificationPreference = () => 
  useUserPreferencesStore((state) => state.preferences.notifications);

export const useDashboardLayoutPreference = () => 
  useUserPreferencesStore((state) => state.preferences.dashboardLayout);

export const useScanDefaults = () => 
  useUserPreferencesStore((state) => state.preferences.scanDefaults);
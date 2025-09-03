import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EncryptionService, type EncryptedData } from '@/lib/encryption';

export interface ApiKeys {
  perplexity?: EncryptedData;
  openai?: EncryptedData;
  anthropic?: EncryptedData;
  [key: string]: EncryptedData | undefined;
}

interface ApiKeysState {
  apiKeys: ApiKeys;
  validationStatus: Record<string, 'valid' | 'invalid' | 'pending' | 'unknown'>;
  lastValidated: Record<string, number>;
  
  // Actions
  setApiKey: (provider: string, key: string) => Promise<void>;
  removeApiKey: (provider: string) => void;
  setValidationStatus: (provider: string, status: 'valid' | 'invalid' | 'pending' | 'unknown') => void;
  validateApiKey: (provider: string, key: string) => Promise<boolean>;
  clearAllKeys: () => void;
  getDecryptedKey: (provider: string) => Promise<string | undefined>;
  
  // Optimistic updates
  optimisticSetKey: (provider: string, key: string) => Promise<void>;
  revertOptimisticUpdate: (provider: string) => void;
}

// Store previous state for rollback
let previousState: { apiKeys: ApiKeys; validationStatus: Record<string, any> } | null = null;

export const useApiKeysStore = create<ApiKeysState>()(
  persist(
    (set, get) => ({
      apiKeys: {},
      validationStatus: {},
      lastValidated: {},
      
      setApiKey: async (provider, key) => {
        try {
          // For now, use simple encryption until we have user context
          const encryptedKey = await EncryptionService.encryptApiKey(key, 'temp-user', 'temp-session');
          set((state) => ({
            apiKeys: { ...state.apiKeys, [provider]: encryptedKey },
            validationStatus: { ...state.validationStatus, [provider]: 'unknown' },
            lastValidated: { ...state.lastValidated, [provider]: Date.now() }
          }));
        } catch (error) {
          console.error('Failed to encrypt API key:', error);
          // Fallback to storing unencrypted for now
          set((state) => ({
            apiKeys: { ...state.apiKeys, [provider]: { encryptedData: key, iv: '', salt: '' } },
            validationStatus: { ...state.validationStatus, [provider]: 'unknown' },
            lastValidated: { ...state.lastValidated, [provider]: Date.now() }
          }));
        }
      },
      
      removeApiKey: (provider) =>
        set((state) => {
          const { [provider]: removed, ...remainingKeys } = state.apiKeys;
          const { [provider]: removedStatus, ...remainingStatus } = state.validationStatus;
          const { [provider]: removedValidated, ...remainingValidated } = state.lastValidated;
          
          return {
            apiKeys: remainingKeys,
            validationStatus: remainingStatus,
            lastValidated: remainingValidated
          };
        }),
      
      setValidationStatus: (provider, status) =>
        set((state) => ({
          validationStatus: { ...state.validationStatus, [provider]: status },
          lastValidated: { ...state.lastValidated, [provider]: Date.now() }
        })),
      
      validateApiKey: async (provider, key) => {
        const { setValidationStatus } = get();
        setValidationStatus(provider, 'pending');
        
        try {
          // Simple validation - check if key has proper format
          let isValid = false;
          
          switch (provider) {
            case 'perplexity':
              isValid = key.startsWith('pplx-') && key.length > 20;
              break;
            case 'openai':
              isValid = key.startsWith('sk-') && key.length > 40;
              break;
            case 'anthropic':
              isValid = key.startsWith('sk-ant-') && key.length > 30;
              break;
            default:
              isValid = key.length > 10;
          }
          
          // Simulate API validation delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          setValidationStatus(provider, isValid ? 'valid' : 'invalid');
          return isValid;
        } catch (error) {
          setValidationStatus(provider, 'invalid');
          return false;
        }
      },
      
      clearAllKeys: () =>
        set({
          apiKeys: {},
          validationStatus: {},
          lastValidated: {}
        }),
      
      getDecryptedKey: async (provider) => {
        const { apiKeys } = get();
        const encryptedKey = apiKeys[provider];
        if (!encryptedKey) return undefined;
        
        try {
          return await EncryptionService.decryptApiKey(encryptedKey, 'temp-user', 'temp-session');
        } catch (error) {
          console.error('Failed to decrypt API key:', error);
          // Fallback for unencrypted keys
          return encryptedKey.encryptedData;
        }
      },
      
      // Optimistic updates for better UX
      optimisticSetKey: async (provider, key) => {
        // Store current state for potential rollback
        const currentState = get();
        previousState = {
          apiKeys: currentState.apiKeys,
          validationStatus: currentState.validationStatus
        };
        
        // Immediately update UI
        try {
          const encryptedKey = await EncryptionService.encryptApiKey(key, 'temp-user', 'temp-session');
          set((state) => ({
            apiKeys: { ...state.apiKeys, [provider]: encryptedKey },
            validationStatus: { ...state.validationStatus, [provider]: 'pending' }
          }));
        } catch (error) {
          // Fallback for encryption failure
          set((state) => ({
            apiKeys: { ...state.apiKeys, [provider]: { encryptedData: key, iv: '', salt: '' } },
            validationStatus: { ...state.validationStatus, [provider]: 'pending' }
          }));
        }
      },
      
      revertOptimisticUpdate: (provider) => {
        if (previousState) {
          set((state) => ({
            apiKeys: previousState!.apiKeys,
            validationStatus: previousState!.validationStatus
          }));
          previousState = null;
        }
      }
    }),
    {
      name: 'api-keys-storage',
      version: 1,
      // Don't persist sensitive data in localStorage - use Supabase instead
      partialize: (state) => ({ 
        validationStatus: state.validationStatus,
        lastValidated: state.lastValidated 
      }),
    }
  )
);

// Selectors for derived state
export const useApiKeyStatus = (provider: string) =>
  useApiKeysStore((state) => ({
    hasKey: !!state.apiKeys[provider],
    status: state.validationStatus[provider] || 'unknown',
    lastValidated: state.lastValidated[provider],
    // Note: getDecryptedKey is now async, handle appropriately in components
  }));

export const useValidApiKeys = () =>
  useApiKeysStore((state) => {
    const validKeys: Record<string, string> = {};
    Object.entries(state.apiKeys).forEach(([provider, encryptedKey]) => {
      if (state.validationStatus[provider] === 'valid' && encryptedKey) {
        // Note: This should be async in practice, but for now return placeholder
        validKeys[provider] = 'encrypted-key-placeholder';
      }
    });
    return validKeys;
  });

export const useApiKeysCount = () =>
  useApiKeysStore((state) => Object.keys(state.apiKeys).length);

export const useHasValidApiKeys = () =>
  useApiKeysStore((state) => 
    Object.values(state.validationStatus).some(status => status === 'valid')
  );
import React, { createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useEnhancedAuth, AuthSecuritySettings } from '@/hooks/useEnhancedAuth';

interface EnhancedAuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  securitySettings: AuthSecuritySettings | null;
  isTimedOut: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, metadata?: any) => Promise<any>;
  signOut: (reason?: string) => Promise<void>;
  extendSession: () => void;
  updateSecuritySettings: (settings: Partial<AuthSecuritySettings>) => Promise<boolean>;
  enable2FA: () => Promise<any>;
  verify2FA: (factorId: string, challengeId: string, code: string) => Promise<any>;
  getActiveSessions: () => Promise<any[]>;
  revokeSession: (sessionId: string) => Promise<boolean>;
}

const EnhancedAuthContext = createContext<EnhancedAuthContextType | undefined>(undefined);

export const EnhancedAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const enhancedAuth = useEnhancedAuth();

  return (
    <EnhancedAuthContext.Provider value={enhancedAuth}>
      {children}
    </EnhancedAuthContext.Provider>
  );
};

export const useEnhancedAuthContext = () => {
  const context = useContext(EnhancedAuthContext);
  if (context === undefined) {
    throw new Error('useEnhancedAuthContext must be used within an EnhancedAuthProvider');
  }
  return context;
};
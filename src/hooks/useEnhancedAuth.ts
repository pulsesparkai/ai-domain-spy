import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useDeviceFingerprint, useBruteForceProtection, useSessionTimeout, getClientIP } from './useAuthSecurity';

export interface AuthSecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeoutMinutes: number;
  requireDeviceVerification: boolean;
  suspiciousLoginNotifications: boolean;
}

export const useEnhancedAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [securitySettings, setSecuritySettings] = useState<AuthSecuritySettings | null>(null);
  
  const { fingerprint, deviceInfo } = useDeviceFingerprint();
  const { checkLoginAttempts, logLoginAttempt } = useBruteForceProtection();
  const { isTimedOut, extendSession } = useSessionTimeout(securitySettings?.sessionTimeoutMinutes || 30);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer additional operations
          setTimeout(async () => {
            await loadSecuritySettings(session.user.id);
            await handleSuccessfulLogin(session.user);
          }, 0);
        } else {
          setSecuritySettings(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          await loadSecuritySettings(session.user.id);
        }, 0);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle session timeout
  useEffect(() => {
    if (isTimedOut && session) {
      handleLogout('Session expired due to inactivity');
    }
  }, [isTimedOut, session]);

  const loadSecuritySettings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_security_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading security settings:', error);
        return;
      }

      if (data) {
        setSecuritySettings({
          twoFactorEnabled: data.two_factor_enabled,
          sessionTimeoutMinutes: data.session_timeout_minutes,
          requireDeviceVerification: data.require_device_verification,
          suspiciousLoginNotifications: data.suspicious_login_notifications
        });
      } else {
        // Create default security settings
        await createDefaultSecuritySettings(userId);
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  };

  const createDefaultSecuritySettings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_security_settings')
        .insert({
          user_id: userId,
          two_factor_enabled: false,
          session_timeout_minutes: 30,
          require_device_verification: true,
          suspicious_login_notifications: true
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setSecuritySettings({
          twoFactorEnabled: data.two_factor_enabled,
          sessionTimeoutMinutes: data.session_timeout_minutes,
          requireDeviceVerification: data.require_device_verification,
          suspiciousLoginNotifications: data.suspicious_login_notifications
        });
      }
    } catch (error) {
      console.error('Error creating default security settings:', error);
    }
  };

  const handleSuccessfulLogin = async (user: User) => {
    try {
      const clientIP = await getClientIP();
      
      // Log successful login attempt
      await logLoginAttempt(
        user.id,
        user.email,
        clientIP,
        fingerprint,
        true,
        undefined,
        navigator.userAgent
      );

      // Update device fingerprint
      if (fingerprint && deviceInfo) {
        await supabase.rpc('upsert_device_fingerprint', {
          p_user_id: user.id,
          p_fingerprint_hash: fingerprint,
          p_device_info: deviceInfo
        });
      }
    } catch (error) {
      console.error('Error handling successful login:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const clientIP = await getClientIP();
      
      // Check for brute force attempts before signing in
      const attemptCheck = await checkLoginAttempts(email, clientIP, fingerprint);
      
      if (attemptCheck?.is_blocked) {
        const error = new Error('Too many failed login attempts. Please try again later.');
        await logLoginAttempt(
          undefined,
          email,
          clientIP,
          fingerprint,
          false,
          'Account temporarily blocked',
          navigator.userAgent
        );
        throw error;
      }

      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Log failed attempt
        await logLoginAttempt(
          undefined,
          email,
          clientIP,
          fingerprint,
          false,
          error.message,
          navigator.userAgent
        );
        throw error;
      }

      return data;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setIsLoading(true);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata
        }
      });

      if (error) throw error;

      // Log signup attempt
      const clientIP = await getClientIP();
      if (data.user) {
        await logLoginAttempt(
          data.user.id,
          email,
          clientIP,
          fingerprint,
          true,
          'Account created',
          navigator.userAgent
        );
      }

      return data;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const handleLogout = async (reason?: string) => {
    try {
      if (user) {
        const clientIP = await getClientIP();
        await logLoginAttempt(
          user.id,
          user.email,
          clientIP,
          fingerprint,
          true,
          reason || 'User logout',
          navigator.userAgent
        );
      }

      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateSecuritySettings = async (newSettings: Partial<AuthSecuritySettings>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_security_settings')
        .update({
          two_factor_enabled: newSettings.twoFactorEnabled,
          session_timeout_minutes: newSettings.sessionTimeoutMinutes,
          require_device_verification: newSettings.requireDeviceVerification,
          suspicious_login_notifications: newSettings.suspiciousLoginNotifications
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setSecuritySettings(prev => prev ? { ...prev, ...newSettings } : null);
      return true;
    } catch (error) {
      console.error('Error updating security settings:', error);
      return false;
    }
  };

  const enable2FA = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      return null;
    }
  };

  const verify2FA = async (factorId: string, challengeId: string, code: string) => {
    try {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      return null;
    }
  };

  const getActiveSessions = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return [];
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error revoking session:', error);
      return false;
    }
  };

  return {
    user,
    session,
    isLoading,
    securitySettings,
    isTimedOut,
    signIn,
    signUp,
    signOut: handleLogout,
    extendSession,
    updateSecuritySettings,
    enable2FA,
    verify2FA,
    getActiveSessions,
    revokeSession
  };
};
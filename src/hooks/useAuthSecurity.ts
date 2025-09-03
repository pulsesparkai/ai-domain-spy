import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Device fingerprinting utility
class DeviceFingerprint {
  static generateFingerprint(): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint test', 2, 2);
      }
      
      const canvasFingerprint = canvas.toDataURL();
      
      const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        cookieEnabled: navigator.cookieEnabled,
        canvas: canvasFingerprint,
        timestamp: Date.now()
      };
      
      const fingerprintString = JSON.stringify(fingerprint);
      
      // Simple hash function
      let hash = 0;
      for (let i = 0; i < fingerprintString.length; i++) {
        const char = fingerprintString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      resolve(Math.abs(hash).toString(16));
    });
  }
  
  static getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      cookieEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      deviceMemory: (navigator as any).deviceMemory || 'unknown',
    };
  }
}

// Hook for device fingerprinting
export const useDeviceFingerprint = () => {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    const generateFingerprint = async () => {
      try {
        const fp = await DeviceFingerprint.generateFingerprint();
        const info = DeviceFingerprint.getDeviceInfo();
        
        setFingerprint(fp);
        setDeviceInfo(info);
        
        // Store in localStorage for consistency
        localStorage.setItem('device_fingerprint', fp);
        localStorage.setItem('device_info', JSON.stringify(info));
      } catch (error) {
        console.error('Failed to generate device fingerprint:', error);
      }
    };

    // Check if fingerprint already exists
    const existingFingerprint = localStorage.getItem('device_fingerprint');
    const existingDeviceInfo = localStorage.getItem('device_info');
    
    if (existingFingerprint && existingDeviceInfo) {
      setFingerprint(existingFingerprint);
      setDeviceInfo(JSON.parse(existingDeviceInfo));
    } else {
      generateFingerprint();
    }
  }, []);

  return { fingerprint, deviceInfo };
};

// Session timeout hook
export const useSessionTimeout = (timeoutMinutes: number = 30) => {
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimeout = () => {
      setLastActivity(Date.now());
      setIsTimedOut(false);
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsTimedOut(true);
      }, timeoutMinutes * 60 * 1000);
    };

    const handleActivity = () => {
      resetTimeout();
    };

    // Activity event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initialize timeout
    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [timeoutMinutes]);

  const extendSession = () => {
    setIsTimedOut(false);
    setLastActivity(Date.now());
  };

  return { isTimedOut, lastActivity, extendSession };
};

// Brute force protection hook
export const useBruteForceProtection = () => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockUntil, setBlockUntil] = useState<Date | null>(null);
  const [attempts, setAttempts] = useState({ email: 0, ip: 0, fingerprint: 0 });

  const checkLoginAttempts = async (email?: string, ipAddress?: string, fingerprintHash?: string) => {
    try {
      const { data, error } = await supabase.rpc('check_login_attempts', {
        p_email: email,
        p_ip_address: ipAddress,
        p_fingerprint_hash: fingerprintHash
      });

      if (error) throw error;

      if (data) {
        setIsBlocked(data.is_blocked);
        setBlockUntil(data.block_until ? new Date(data.block_until) : null);
        setAttempts({
          email: data.email_attempts,
          ip: data.ip_attempts,
          fingerprint: data.fingerprint_attempts
        });
      }

      return data;
    } catch (error) {
      console.error('Error checking login attempts:', error);
      return null;
    }
  };

  const logLoginAttempt = async (
    userId?: string, 
    email?: string, 
    ipAddress?: string, 
    fingerprintHash?: string,
    success: boolean = false,
    failureReason?: string,
    userAgent?: string
  ) => {
    try {
      const { data, error } = await supabase.rpc('log_login_attempt', {
        p_user_id: userId,
        p_email: email,
        p_ip_address: ipAddress,
        p_fingerprint_hash: fingerprintHash,
        p_success: success,
        p_failure_reason: failureReason,
        p_user_agent: userAgent || navigator.userAgent
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging login attempt:', error);
      return null;
    }
  };

  const getRemainingBlockTime = (): number => {
    if (!blockUntil) return 0;
    const remaining = blockUntil.getTime() - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  };

  return {
    isBlocked,
    blockUntil,
    attempts,
    checkLoginAttempts,
    logLoginAttempt,
    getRemainingBlockTime
  };
};

// IP address detection utility
export const getClientIP = async (): Promise<string | null> => {
  try {
    // Try multiple IP detection services
    const services = [
      'https://api.ipify.org?format=json',
      'https://httpbin.org/ip',
      'https://jsonip.com'
    ];

    for (const service of services) {
      try {
        const response = await fetch(service);
        const data = await response.json();
        
        if (service.includes('ipify')) return data.ip;
        if (service.includes('httpbin')) return data.origin;
        if (service.includes('jsonip')) return data.ip;
      } catch (e) {
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get client IP:', error);
    return null;
  }
};

// Device verification utility
export const useDeviceVerification = () => {
  const { fingerprint, deviceInfo } = useDeviceFingerprint();

  const verifyDevice = async (userId: string) => {
    if (!fingerprint || !deviceInfo) return false;

    try {
      const { data, error } = await supabase.rpc('upsert_device_fingerprint', {
        p_user_id: userId,
        p_fingerprint_hash: fingerprint,
        p_device_info: deviceInfo
      });

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error verifying device:', error);
      return false;
    }
  };

  const getTrustedDevices = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('device_fingerprints')
        .select('*')
        .eq('user_id', userId)
        .eq('is_trusted', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting trusted devices:', error);
      return [];
    }
  };

  const markDeviceAsTrusted = async (userId: string, fingerprintHash: string) => {
    try {
      const { error } = await supabase
        .from('device_fingerprints')
        .update({ is_trusted: true })
        .eq('user_id', userId)
        .eq('fingerprint_hash', fingerprintHash);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking device as trusted:', error);
      return false;
    }
  };

  return {
    fingerprint,
    deviceInfo,
    verifyDevice,
    getTrustedDevices,
    markDeviceAsTrusted
  };
};
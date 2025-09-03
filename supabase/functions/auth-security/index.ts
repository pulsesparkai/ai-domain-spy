import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

interface AuthSecurityRequest {
  action: 'check_attempts' | 'log_attempt' | 'cleanup_sessions' | 'verify_device';
  email?: string;
  ip_address?: string;
  fingerprint_hash?: string;
  user_id?: string;
  success?: boolean;
  failure_reason?: string;
  user_agent?: string;
  device_info?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, ...params }: AuthSecurityRequest = await req.json();

    let result;

    switch (action) {
      case 'check_attempts':
        result = await checkLoginAttempts(supabase, params);
        break;
      case 'log_attempt':
        result = await logLoginAttempt(supabase, params);
        break;
      case 'cleanup_sessions':
        result = await cleanupExpiredSessions(supabase);
        break;
      case 'verify_device':
        result = await verifyDevice(supabase, params);
        break;
      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Auth security service error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function checkLoginAttempts(supabase: any, params: AuthSecurityRequest) {
  const { email, ip_address, fingerprint_hash } = params;

  // Input validation
  if (email && (typeof email !== 'string' || email.length > 254)) {
    throw new Error('Invalid email format');
  }
  
  if (fingerprint_hash && (typeof fingerprint_hash !== 'string' || fingerprint_hash.length > 100)) {
    throw new Error('Invalid fingerprint hash');
  }

  const { data, error } = await supabase.rpc('check_login_attempts', {
    p_email: email,
    p_ip_address: ip_address,
    p_fingerprint_hash: fingerprint_hash
  });

  if (error) throw error;

  return {
    success: true,
    data: data || {
      is_blocked: false,
      email_attempts: 0,
      ip_attempts: 0,
      fingerprint_attempts: 0,
      block_until: null
    }
  };
}

async function logLoginAttempt(supabase: any, params: AuthSecurityRequest) {
  const { 
    user_id, 
    email, 
    ip_address, 
    fingerprint_hash, 
    success = false, 
    failure_reason, 
    user_agent 
  } = params;

  // Input validation and sanitization
  const sanitizedData = {
    p_user_id: user_id,
    p_email: email ? email.toLowerCase().trim() : null,
    p_ip_address: ip_address,
    p_fingerprint_hash: fingerprint_hash,
    p_success: Boolean(success),
    p_failure_reason: failure_reason ? failure_reason.substring(0, 500) : null,
    p_user_agent: user_agent ? user_agent.substring(0, 1000) : null
  };

  const { data, error } = await supabase.rpc('log_login_attempt', sanitizedData);

  if (error) throw error;

  return {
    success: true,
    attempt_id: data
  };
}

async function cleanupExpiredSessions(supabase: any) {
  const { data, error } = await supabase.rpc('cleanup_expired_sessions');

  if (error) throw error;

  return {
    success: true,
    cleaned_sessions: data || 0
  };
}

async function verifyDevice(supabase: any, params: AuthSecurityRequest) {
  const { user_id, fingerprint_hash, device_info } = params;

  if (!user_id || !fingerprint_hash) {
    throw new Error('User ID and fingerprint hash are required');
  }

  // Validate and sanitize device info
  const sanitizedDeviceInfo = device_info ? {
    userAgent: device_info.userAgent?.substring(0, 1000),
    platform: device_info.platform?.substring(0, 100),
    language: device_info.language?.substring(0, 20),
    timezone: device_info.timezone?.substring(0, 100),
    screenResolution: device_info.screenResolution?.substring(0, 50),
    colorDepth: typeof device_info.colorDepth === 'number' ? device_info.colorDepth : null,
    cookieEnabled: typeof device_info.cookieEnabled === 'boolean' ? device_info.cookieEnabled : null,
    onlineStatus: typeof device_info.onlineStatus === 'boolean' ? device_info.onlineStatus : null,
    hardwareConcurrency: typeof device_info.hardwareConcurrency === 'number' ? device_info.hardwareConcurrency : null,
    deviceMemory: device_info.deviceMemory
  } : {};

  const { data, error } = await supabase.rpc('upsert_device_fingerprint', {
    p_user_id: user_id,
    p_fingerprint_hash: fingerprint_hash,
    p_device_info: sanitizedDeviceInfo
  });

  if (error) throw error;

  // Check if this is a new device
  const { data: existingDevice, error: deviceError } = await supabase
    .from('device_fingerprints')
    .select('is_trusted, first_seen')
    .eq('user_id', user_id)
    .eq('fingerprint_hash', fingerprint_hash)
    .single();

  if (deviceError && deviceError.code !== 'PGRST116') {
    throw deviceError;
  }

  const isNewDevice = !existingDevice || 
    (new Date().getTime() - new Date(existingDevice.first_seen).getTime()) < 60000; // Less than 1 minute old

  return {
    success: true,
    device_id: data,
    is_new_device: isNewDevice,
    is_trusted: existingDevice?.is_trusted || false
  };
}

// Cleanup function that runs periodically
async function performScheduledCleanup(supabase: any) {
  try {
    // Clean up expired sessions
    await supabase.rpc('cleanup_expired_sessions');
    
    // Clean up old login attempts (older than 7 days)
    await supabase
      .from('login_attempts')
      .delete()
      .lt('attempt_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    console.log('Scheduled cleanup completed successfully');
  } catch (error) {
    console.error('Scheduled cleanup failed:', error);
  }
}
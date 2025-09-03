-- Create device fingerprints table for tracking user devices
CREATE TABLE public.device_fingerprints (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint_hash text NOT NULL,
  device_info jsonb NOT NULL DEFAULT '{}',
  first_seen timestamp with time zone NOT NULL DEFAULT now(),
  last_seen timestamp with time zone NOT NULL DEFAULT now(),
  is_trusted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, fingerprint_hash)
);

-- Create login attempts table for brute force protection
CREATE TABLE public.login_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  ip_address inet,
  fingerprint_hash text,
  success boolean NOT NULL,
  failure_reason text,
  attempt_time timestamp with time zone NOT NULL DEFAULT now(),
  user_agent text,
  location_data jsonb DEFAULT '{}'
);

-- Create sessions table for enhanced session management
CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  fingerprint_hash text,
  ip_address inet,
  user_agent text,
  expires_at timestamp with time zone NOT NULL,
  last_activity timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user security settings table
CREATE TABLE public.user_security_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  two_factor_enabled boolean NOT NULL DEFAULT false,
  totp_secret text,
  backup_codes text[],
  session_timeout_minutes integer NOT NULL DEFAULT 30,
  require_device_verification boolean NOT NULL DEFAULT true,
  suspicious_login_notifications boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;
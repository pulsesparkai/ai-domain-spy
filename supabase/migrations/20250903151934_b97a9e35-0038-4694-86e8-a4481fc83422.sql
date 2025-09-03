-- RLS policies for device_fingerprints
CREATE POLICY "Users can view their own device fingerprints"
  ON public.device_fingerprints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device fingerprints"
  ON public.device_fingerprints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device fingerprints"
  ON public.device_fingerprints FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for login_attempts
CREATE POLICY "Users can view their own login attempts"
  ON public.login_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert login attempts"
  ON public.login_attempts FOR INSERT
  WITH CHECK (true); -- Allows system to log attempts

-- RLS policies for user_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.user_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for user_security_settings
CREATE POLICY "Users can view their own security settings"
  ON public.user_security_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own security settings"
  ON public.user_security_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own security settings"
  ON public.user_security_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create functions for enhanced authentication
CREATE OR REPLACE FUNCTION public.check_login_attempts(
  p_email text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_fingerprint_hash text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_attempts integer := 0;
  ip_attempts integer := 0;
  fingerprint_attempts integer := 0;
  is_blocked boolean := false;
  block_until timestamp with time zone;
BEGIN
  -- Check failed attempts in last hour by email
  IF p_email IS NOT NULL THEN
    SELECT COUNT(*) INTO email_attempts
    FROM public.login_attempts
    WHERE email = p_email
      AND success = false
      AND attempt_time > now() - interval '1 hour';
  END IF;

  -- Check failed attempts in last hour by IP
  IF p_ip_address IS NOT NULL THEN
    SELECT COUNT(*) INTO ip_attempts
    FROM public.login_attempts
    WHERE ip_address = p_ip_address
      AND success = false
      AND attempt_time > now() - interval '1 hour';
  END IF;

  -- Check failed attempts in last hour by fingerprint
  IF p_fingerprint_hash IS NOT NULL THEN
    SELECT COUNT(*) INTO fingerprint_attempts
    FROM public.login_attempts
    WHERE fingerprint_hash = p_fingerprint_hash
      AND success = false
      AND attempt_time > now() - interval '1 hour';
  END IF;

  -- Determine if blocked (more than 5 attempts in any category)
  IF email_attempts >= 5 OR ip_attempts >= 10 OR fingerprint_attempts >= 5 THEN
    is_blocked := true;
    -- Exponential backoff: 2^attempts minutes
    block_until := now() + (interval '1 minute' * power(2, GREATEST(email_attempts, fingerprint_attempts)));
  END IF;

  RETURN jsonb_build_object(
    'is_blocked', is_blocked,
    'email_attempts', email_attempts,
    'ip_attempts', ip_attempts,
    'fingerprint_attempts', fingerprint_attempts,
    'block_until', block_until
  );
END;
$$;

-- Create function to log login attempts
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_user_id uuid DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_fingerprint_hash text DEFAULT NULL,
  p_success boolean DEFAULT false,
  p_failure_reason text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempt_id uuid;
BEGIN
  INSERT INTO public.login_attempts (
    user_id,
    email,
    ip_address,
    fingerprint_hash,
    success,
    failure_reason,
    user_agent
  ) VALUES (
    p_user_id,
    p_email,
    p_ip_address,
    p_fingerprint_hash,
    p_success,
    p_failure_reason,
    p_user_agent
  ) RETURNING id INTO attempt_id;

  RETURN attempt_id;
END;
$$;

-- Create function to manage device fingerprints
CREATE OR REPLACE FUNCTION public.upsert_device_fingerprint(
  p_user_id uuid,
  p_fingerprint_hash text,
  p_device_info jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  device_id uuid;
BEGIN
  INSERT INTO public.device_fingerprints (
    user_id,
    fingerprint_hash,
    device_info,
    last_seen
  ) VALUES (
    p_user_id,
    p_fingerprint_hash,
    p_device_info,
    now()
  )
  ON CONFLICT (user_id, fingerprint_hash)
  DO UPDATE SET
    last_seen = now(),
    device_info = p_device_info,
    updated_at = now()
  RETURNING id INTO device_id;

  RETURN device_id;
END;
$$;

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned_count integer;
BEGIN
  UPDATE public.user_sessions
  SET is_active = false,
      updated_at = now()
  WHERE is_active = true
    AND (expires_at < now() OR last_activity < now() - interval '24 hours');
    
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user_id ON public.device_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_hash ON public.device_fingerprints(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON public.login_attempts(email, attempt_time DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON public.login_attempts(ip_address, attempt_time DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON public.user_sessions(user_id, is_active) WHERE is_active = true;
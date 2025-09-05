-- Remove api_keys column and add subscription management columns to profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS api_keys;

-- Add subscription management columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
ADD COLUMN IF NOT EXISTS monthly_scans_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_scans_limit integer DEFAULT 100,
ADD COLUMN IF NOT EXISTS billing_cycle_start timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Update existing records to have proper defaults
UPDATE public.profiles 
SET 
  subscription_tier = COALESCE(subscription_tier, 'free'),
  monthly_scans_used = COALESCE(monthly_scans_used, 0),
  monthly_scans_limit = CASE 
    WHEN subscription_status = 'active' AND subscription_tier = 'pro' THEN 1000
    WHEN subscription_status = 'active' AND subscription_tier = 'starter' THEN 500
    WHEN subscription_status = 'active' AND subscription_tier = 'enterprise' THEN 5000
    ELSE 100
  END,
  billing_cycle_start = COALESCE(billing_cycle_start, now())
WHERE subscription_tier IS NULL OR monthly_scans_used IS NULL OR monthly_scans_limit IS NULL OR billing_cycle_start IS NULL;
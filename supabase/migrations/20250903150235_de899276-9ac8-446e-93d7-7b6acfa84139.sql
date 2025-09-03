-- Add indexes for frequently queried columns to improve query performance

-- Profiles table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_trial_ends_at ON public.profiles(trial_ends_at) WHERE trial_ends_at IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at DESC);

-- Scans table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_status ON public.scans(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_scan_type ON public.scans(scan_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_updated_at ON public.scans(updated_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_target_url ON public.scans(target_url) WHERE target_url IS NOT NULL;

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_user_status_created ON public.scans(user_id, status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_user_type_created ON public.scans(user_id, scan_type, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_user_created ON public.scans(user_id, created_at DESC);

-- GIN index for JSONB columns to improve queries on nested data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_encrypted_api_keys_gin ON public.profiles USING GIN(encrypted_api_keys);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_api_keys_gin ON public.profiles USING GIN(api_keys);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_results_gin ON public.scans USING GIN(results);

-- Function-based indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_subscription_active 
ON public.profiles((subscription_status = 'active')) 
WHERE subscription_status = 'active';

-- Partial indexes for better performance on filtered queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_pending 
ON public.scans(user_id, created_at DESC) 
WHERE status = 'pending';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_completed 
ON public.scans(user_id, created_at DESC) 
WHERE status = 'completed';

-- Add statistics for better query planning
CREATE OR REPLACE FUNCTION public.refresh_table_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ANALYZE public.profiles;
  ANALYZE public.scans;
END;
$$;

-- Optimize JSONB queries with expression indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_sentiment_positive 
ON public.scans((results->>'sentiment')) 
WHERE results->>'sentiment' IS NOT NULL;
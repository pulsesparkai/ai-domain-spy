-- Add missing queries field to scans table
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS queries jsonb DEFAULT '[]'::jsonb;

-- Add api_keys column to profiles table (keeping encrypted_api_keys for backward compatibility)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS api_keys jsonb DEFAULT '{}'::jsonb;

-- Update triggers for updated_at columns if they don't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Ensure triggers exist for updated_at automation
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_scans_updated_at ON public.scans;
CREATE TRIGGER update_scans_updated_at
  BEFORE UPDATE ON public.scans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure RLS is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_searches ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies if they don't exist

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Scans policies
DROP POLICY IF EXISTS "Users can view their own scans" ON public.scans;
CREATE POLICY "Users can view their own scans" ON public.scans
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own scans" ON public.scans;
CREATE POLICY "Users can create their own scans" ON public.scans
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own scans" ON public.scans;
CREATE POLICY "Users can update their own scans" ON public.scans
  FOR UPDATE USING (user_id = auth.uid());

-- Trending searches policies (public read access, system insert)
DROP POLICY IF EXISTS "Anyone can view trending searches" ON public.trending_searches;
CREATE POLICY "Anyone can view trending searches" ON public.trending_searches
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can insert trending searches" ON public.trending_searches;
CREATE POLICY "System can insert trending searches" ON public.trending_searches
  FOR INSERT WITH CHECK (true);
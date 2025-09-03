-- Fix security warning for function search path
CREATE OR REPLACE FUNCTION public.refresh_table_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  ANALYZE public.profiles;
  ANALYZE public.scans;
END;
$$;
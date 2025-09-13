-- Create function to increment monthly scans used
CREATE OR REPLACE FUNCTION public.increment_monthly_scans(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles 
  SET 
    monthly_scans_used = COALESCE(monthly_scans_used, 0) + 1,
    updated_at = now()
  WHERE profiles.user_id = increment_monthly_scans.user_id;
END;
$function$;
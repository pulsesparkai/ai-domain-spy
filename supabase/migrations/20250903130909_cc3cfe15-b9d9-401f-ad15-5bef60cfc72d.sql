-- Add encrypted_api_keys column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN encrypted_api_keys JSONB DEFAULT '{}'::jsonb;

-- Create index for encrypted_api_keys column for better performance
CREATE INDEX idx_profiles_encrypted_api_keys ON public.profiles USING GIN (encrypted_api_keys);

-- Update RLS policies to ensure users can only access their own encrypted API keys
-- The existing policies already cover this, but let's be explicit about encrypted_api_keys

-- Add a policy specifically for encrypted_api_keys updates
CREATE POLICY "Users can update their own encrypted API keys" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create a function to safely update encrypted API keys
CREATE OR REPLACE FUNCTION public.update_encrypted_api_keys(
  key_name TEXT,
  encrypted_value TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    encrypted_api_keys = COALESCE(encrypted_api_keys, '{}'::jsonb) || jsonb_build_object(key_name, encrypted_value),
    updated_at = now()
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a function to safely get encrypted API keys
CREATE OR REPLACE FUNCTION public.get_encrypted_api_keys()
RETURNS JSONB AS $$
BEGIN
  RETURN COALESCE(
    (SELECT encrypted_api_keys FROM public.profiles WHERE user_id = auth.uid()),
    '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a function to safely delete an encrypted API key
CREATE OR REPLACE FUNCTION public.delete_encrypted_api_key(key_name TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    encrypted_api_keys = encrypted_api_keys - key_name,
    updated_at = now()
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
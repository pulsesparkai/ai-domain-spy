-- Remove api_keys and encrypted_api_keys columns from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS api_keys;
ALTER TABLE profiles DROP COLUMN IF EXISTS encrypted_api_keys;
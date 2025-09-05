-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to run monthly usage reset daily at 2 AM UTC
-- This checks for users whose billing cycle needs to be reset
SELECT cron.schedule(
  'monthly-usage-reset',
  '0 2 * * *', -- Daily at 2 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://ljhcqubwczhtwrfpploa.supabase.co/functions/v1/reset-monthly-usage',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqaGNxdWJ3Y3podHdyZnBwbG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MzYxNjcsImV4cCI6MjA3MjQxMjE2N30.dNj1uTNLaO3Utk2ilagjS_xKWfQdKSSrbbXNJwjRBWI"}'::jsonb,
      body := '{"automated": true}'::jsonb
    ) AS request_id;
  $$
);
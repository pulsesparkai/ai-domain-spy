-- Drop the existing optimization_scans table
DROP TABLE IF EXISTS public.optimization_scans CASCADE;

-- Create the optimization_scans table with exact specifications
CREATE TABLE public.optimization_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  analysis JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.optimization_scans ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own scans
CREATE POLICY "Users can view own optimization scans"
  ON public.optimization_scans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own scans
CREATE POLICY "Users can create optimization scans"
  ON public.optimization_scans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
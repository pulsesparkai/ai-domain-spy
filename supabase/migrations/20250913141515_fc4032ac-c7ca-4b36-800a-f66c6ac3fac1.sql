-- Create trending_searches table for caching Perplexity trending search results
CREATE TABLE public.trending_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT,
  trends_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trending_searches ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access for trending data
CREATE POLICY "Anyone can view trending searches" 
ON public.trending_searches 
FOR SELECT 
USING (true);

-- Create policy to allow system inserts (no user context needed for caching)
CREATE POLICY "System can insert trending searches" 
ON public.trending_searches 
FOR INSERT 
WITH CHECK (true);

-- Create index for efficient domain and timestamp queries
CREATE INDEX idx_trending_searches_domain_created ON public.trending_searches(domain, created_at DESC);

-- Create index for timestamp-based cleanup
CREATE INDEX idx_trending_searches_created_at ON public.trending_searches(created_at);
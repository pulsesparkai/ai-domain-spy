-- Normalize scan results structure
UPDATE public.scans 
SET results = jsonb_build_object(
  'domain', COALESCE(results->>'domain', results->>'url', target_url),
  'citations', COALESCE(results->'citations', '[]'::jsonb),
  'sentiment', COALESCE(results->'sentiment', '{"positive": 0, "neutral": 100, "negative": 0}'::jsonb),
  'rankings', COALESCE(results->'rankings', '[]'::jsonb),
  'entities', COALESCE(results->'entities', '[]'::jsonb),
  'crawl_meta', results->'crawl_meta',
  'analysis_log', results->'analysis_log',
  'summary_cards', results->'summary_cards'
)
WHERE results IS NOT NULL;

-- Add GIN indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scans_results_domain ON public.scans((results->>'domain'));
CREATE INDEX IF NOT EXISTS idx_scans_results_citations ON public.scans USING GIN((results->'citations'));
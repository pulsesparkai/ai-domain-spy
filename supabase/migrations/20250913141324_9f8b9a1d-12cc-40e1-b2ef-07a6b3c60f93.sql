-- Create discover_analyses table for storing Perplexity Discover analysis results
CREATE TABLE public.discover_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_url TEXT,
  result_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.discover_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own discover analyses" 
ON public.discover_analyses 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own discover analyses" 
ON public.discover_analyses 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own discover analyses" 
ON public.discover_analyses 
FOR UPDATE 
USING (user_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_discover_analyses_updated_at
BEFORE UPDATE ON public.discover_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
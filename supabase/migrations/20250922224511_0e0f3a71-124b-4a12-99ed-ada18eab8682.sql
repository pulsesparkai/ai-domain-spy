-- Create citations table for storing extracted citations
CREATE TABLE public.citations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scan_id UUID REFERENCES public.scans(id),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  snippet TEXT,
  platform TEXT NOT NULL DEFAULT 'unknown',
  relevance_score DECIMAL(3,2) DEFAULT 0.0,
  domain_authority INTEGER DEFAULT 0,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')) DEFAULT 'neutral',
  status TEXT CHECK (status IN ('active', 'removed', 'changed')) DEFAULT 'active',
  ai_model TEXT,
  query_context TEXT,
  clickable BOOLEAN DEFAULT true,
  last_verified TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create brand mentions table for monitoring
CREATE TABLE public.brand_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  mention_text TEXT,
  url TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')) DEFAULT 'neutral',
  relevance_score DECIMAL(3,2) DEFAULT 0.0,
  context_type TEXT DEFAULT 'general',
  ai_generated BOOLEAN DEFAULT false,
  mention_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_mentions ENABLE ROW LEVEL SECURITY;

-- Create policies for citations
CREATE POLICY "Users can view their own citations" 
ON public.citations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own citations" 
ON public.citations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own citations" 
ON public.citations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for brand mentions
CREATE POLICY "Users can view their own brand mentions" 
ON public.brand_mentions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own brand mentions" 
ON public.brand_mentions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brand mentions" 
ON public.brand_mentions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_citations_user_id ON public.citations(user_id);
CREATE INDEX idx_citations_scan_id ON public.citations(scan_id);
CREATE INDEX idx_citations_created_at ON public.citations(created_at DESC);
CREATE INDEX idx_brand_mentions_user_id ON public.brand_mentions(user_id);
CREATE INDEX idx_brand_mentions_brand_name ON public.brand_mentions(brand_name);
CREATE INDEX idx_brand_mentions_created_at ON public.brand_mentions(created_at DESC);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_citations_updated_at
BEFORE UPDATE ON public.citations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brand_mentions_updated_at
BEFORE UPDATE ON public.brand_mentions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
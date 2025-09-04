-- Create optimization_scans table for storing Perplexity optimization analysis
CREATE TABLE public.optimization_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  analysis JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.optimization_scans ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own optimization scans" 
ON public.optimization_scans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own optimization scans" 
ON public.optimization_scans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own optimization scans" 
ON public.optimization_scans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own optimization scans" 
ON public.optimization_scans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_optimization_scans_updated_at
BEFORE UPDATE ON public.optimization_scans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
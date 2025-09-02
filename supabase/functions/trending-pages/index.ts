import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { competitors, days = 30 } = await req.json();

    if (!competitors || competitors.length === 0) {
      throw new Error('Competitors list required');
    }

    // Mock implementation for DuckDuckGo search
    // In production, this would use actual DuckDuckGo search API
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    const mockPagesData = competitors.flatMap((competitor: string) => 
      Array.from({ length: 5 }, (_, i) => ({
        competitor,
        title: `${competitor} Latest Update ${i + 1}`,
        url: `https://${competitor.toLowerCase().replace(/\s+/g, '')}.com/article-${i + 1}`,
        snippet: `Recent developments and updates from ${competitor}...`,
        publishedDate: new Date(since.getTime() + Math.random() * (Date.now() - since.getTime())).toISOString(),
        rank: i + 1
      }))
    );

    return new Response(JSON.stringify({ 
      pages: mockPagesData,
      totalFound: mockPagesData.length,
      searchPeriod: `${days} days`,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Trending pages error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      pages: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
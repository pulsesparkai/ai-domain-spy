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
    const { competitors, timeframe = 'month' } = await req.json();

    if (!competitors || competitors.length === 0) {
      throw new Error('Competitors list required');
    }

    // Mock implementation for Google Trends API
    // In production, this would use actual Google Trends API
    const mockTrendsData = competitors.map((competitor: string) => ({
      competitor,
      interestScore: Math.floor(Math.random() * 100) + 1,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      changePercent: Math.floor(Math.random() * 40) - 20 // -20 to +20
    }));

    return new Response(JSON.stringify({ 
      trendsData: mockTrendsData,
      timeframe,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Trends analysis error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      trendsData: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
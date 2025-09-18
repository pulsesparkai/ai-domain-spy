import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScanTestRequest {
  query: string;
  perplexityKey?: string;
  openaiKey?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, perplexityKey, openaiKey }: ScanTestRequest = await req.json();
    
    console.log('Test scan request:', { query, hasPerplexity: !!perplexityKey, hasOpenAI: !!openaiKey });

    const results: any = {
      query,
      timestamp: new Date().toISOString(),
      apis: {}
    };

    // Test Perplexity API
    if (perplexityKey) {
      try {
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar-small-online',
            messages: [{ role: 'user', content: query }],
            max_tokens: 100,
            return_citations: true
          }),
        });

        if (perplexityResponse.ok) {
          const data = await perplexityResponse.json();
          results.apis.perplexity = {
            success: true,
            content: data.choices[0]?.message?.content || '',
            citations: data.citations || [],
            usage: data.usage
          };
        } else {
          results.apis.perplexity = {
            success: false,
            error: `HTTP ${perplexityResponse.status}: ${perplexityResponse.statusText}`
          };
        }
      } catch (error) {
        results.apis.perplexity = {
          success: false,
          error: error.message
        };
      }
    }

    // Test OpenAI API
    if (openaiKey) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are a helpful assistant for testing API connectivity.' },
              { role: 'user', content: query }
            ],
            max_tokens: 100
          }),
        });

        if (openaiResponse.ok) {
          const data = await openaiResponse.json();
          results.apis.openai = {
            success: true,
            content: data.choices[0]?.message?.content || '',
            usage: data.usage
          };
        } else {
          results.apis.openai = {
            success: false,
            error: `HTTP ${openaiResponse.status}: ${openaiResponse.statusText}`
          };
        }
      } catch (error) {
        results.apis.openai = {
          success: false,
          error: error.message
        };
      }
    }

    console.log('Test scan results:', results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in test-scan function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
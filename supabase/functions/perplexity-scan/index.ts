import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, apiKey } = await req.json();

    if (!apiKey) {
      throw new Error('Perplexity API key required');
    }

    // Input sanitization
    if (typeof query !== 'string' || query.length > 500) {
      throw new Error('Invalid query format');
    }

    if (typeof apiKey !== 'string' || apiKey.length < 10 || apiKey.length > 200) {
      throw new Error('Invalid API key format');
    }

    // Sanitize query content
    const sanitizedQuery = query.replace(/[<>'"&]/g, '').trim();

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-small-online',
        messages: [
          {
            role: 'user',
            content: sanitizedQuery
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
        return_citations: true
      }),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid Perplexity API key');
      }
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    
    const result = {
      content: data.choices?.[0]?.message?.content || '',
      citations: data.citations || [],
      model: 'perplexity'
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Perplexity scan error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      content: '',
      citations: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      throw new Error('OpenAI API key required');
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. Provide accurate information and include relevant URLs when possible.'
          },
          {
            role: 'user',
            content: sanitizedQuery
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key');
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    const result = {
      content: data.choices?.[0]?.message?.content || '',
      model: 'openai',
      usage: data.usage
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('OpenAI scan error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      content: '',
      model: 'openai'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
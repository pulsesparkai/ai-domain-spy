import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { PerplexityAPI } from './services/perplexity';
import { GoogleTrendsAPI } from './services/google-trends';
import { DuckDuckGoAPI } from './services/duckduckgo';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

// Auth middleware
const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid authorization token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Scan endpoint
app.post('/api/scan', authenticateUser, async (req, res) => {
  try {
    const { queries, scanType, targetUrl } = req.body;
    
    // Validate inputs
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({ error: 'Queries are required' });
    }

    // Check fair use limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('api_keys')
      .eq('user_id', req.user.id)
      .single();

    const scansCount = profile?.api_keys?.scans_count || 0;
    if (scansCount >= 100) {
      return res.status(429).json({ error: 'Monthly scan limit reached (100 scans)' });
    }

    // Create scan record
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .insert({
        user_id: req.user.id,
        scan_type: scanType,
        target_url: targetUrl,
        status: 'processing'
      })
      .select()
      .single();

    if (scanError) {
      return res.status(500).json({ error: 'Failed to create scan record' });
    }

    // Process queries in parallel
    const results = await Promise.allSettled(
      queries.map(async (query: string) => {
        try {
          // Perplexity search
          const perplexityResults = await PerplexityAPI.search(query, process.env.PERPLEXITY_API_KEY!);
          
          // OpenAI analysis
          const openaiAnalysis = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'Extract URLs and analyze mentions for the given query and search results.'
              },
              {
                role: 'user',
                content: `Query: ${query}\nResults: ${JSON.stringify(perplexityResults)}`
              }
            ]
          });

          // Extract sentiment analysis
          const sentimentAnalysis = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'Analyze sentiment of the search results. Return JSON with sentiment: "positive", "neutral", or "negative"'
              },
              {
                role: 'user',
                content: JSON.stringify(perplexityResults)
              }
            ]
          });

          // Google Trends data
          const trendsData = await GoogleTrendsAPI.getInterest(query);

          // DuckDuckGo trending
          const trendingData = await DuckDuckGoAPI.getTrending(query);

          return {
            query,
            perplexity: perplexityResults,
            openai: openaiAnalysis.choices[0]?.message?.content,
            sentiment: JSON.parse(sentimentAnalysis.choices[0]?.message?.content || '{"sentiment": "neutral"}'),
            trends: trendsData,
            trending: trendingData
          };
        } catch (error) {
          console.error(`Error processing query ${query}:`, error);
          throw error;
        }
      })
    );

    // Update scan with results
    const finalResults = results.map(result => 
      result.status === 'fulfilled' ? result.value : { error: result.reason }
    );

    await supabase
      .from('scans')
      .update({
        results: finalResults,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', scan.id);

    // Update scans count
    await supabase
      .from('profiles')
      .update({
        api_keys: {
          ...profile?.api_keys,
          scans_count: scansCount + 1
        }
      })
      .eq('user_id', req.user.id);

    res.json({
      scanId: scan.id,
      results: finalResults,
      status: 'completed'
    });

  } catch (error) {
    console.error('Scan endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
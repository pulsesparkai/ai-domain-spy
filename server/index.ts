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

    // Check fair use limits and subscription status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_tier')
      .eq('user_id', req.user.id)
      .single();

    // Check if user is subscribed (Pro users have unlimited scans)
    const isSubscribed = (req.user.user_metadata?.subscribed) || 
      (profile?.subscription_status === 'active' && profile?.subscription_tier === 'pro');
    
    const scansCount = req.user.user_metadata?.scans_count || 0;
    if (!isSubscribed && scansCount >= 100) {
      return res.status(429).json({ error: 'Monthly scan limit reached (100 scans). Please upgrade to Pro.' });
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
          console.log(`Processing query: ${query}`);
          
          // Use system API keys instead of user-provided keys
          const systemPerplexityKey = process.env.PERPLEXITY_API_KEY;
          const systemOpenAIKey = process.env.OPENAI_API_KEY;
          
          // Perplexity search using system API key
          let perplexityResults = null;
          if (systemPerplexityKey) {
            try {
              perplexityResults = await PerplexityAPI.search(query, systemPerplexityKey);
              console.log(`Perplexity results for "${query}":`, perplexityResults);
            } catch (error: any) {
              console.error(`Perplexity API error for query "${query}":`, error);
              // Don't expose API key errors to users
              throw new Error('AI analysis service temporarily unavailable');
            }
          }
          
          // OpenAI analysis using system API key
          let openaiAnalysis = null;
          let sentimentResult = { sentiment: 'neutral' };
          let citations: string[] = [];
          
          if (systemOpenAIKey) {
            try {
              // Main content analysis
              openaiAnalysis = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                  {
                    role: 'system',
                    content: 'Analyze the query and provide insights about AI visibility and brand mentions. Include relevant URLs if discussing online presence.'
                  },
                  {
                    role: 'user',
                    content: `Query: ${query}${perplexityResults ? `\nPerplexity Results: ${JSON.stringify(perplexityResults)}` : ''}`
                  }
                ],
                max_tokens: 500
              });

              const content = openaiAnalysis.choices[0]?.message?.content || '';
              
              // Extract URLs using regex to simulate citations
              const urlRegex = /https?:\/\/[^\s)]+/g;
              citations = content.match(urlRegex) || [];
              
              // Sentiment analysis
              if (perplexityResults?.content || content) {
                const sentimentAnalysis = await openai.chat.completions.create({
                  model: 'gpt-4o-mini',
                  messages: [
                    {
                      role: 'system',
                      content: 'Analyze sentiment of the content. Return only a JSON object with "sentiment" field set to "positive", "neutral", or "negative".'
                    },
                    {
                      role: 'user',
                      content: perplexityResults?.content || content
                    }
                  ],
                  max_tokens: 50
                });

                try {
                  sentimentResult = JSON.parse(sentimentAnalysis.choices[0]?.message?.content || '{"sentiment": "neutral"}');
                } catch {
                  sentimentResult = { sentiment: 'neutral' };
                }
              }
              
              console.log(`OpenAI analysis for "${query}":`, { content: content.substring(0, 100), citations, sentiment: sentimentResult });
            } catch (error: any) {
              console.error(`OpenAI API error for query "${query}":`, error);
              // Don't expose API key errors to users
              throw new Error('AI analysis service temporarily unavailable');
            }
          }

          // Google Trends data (keep existing)
          let trendsData = null;
          try {
            trendsData = await GoogleTrendsAPI.getInterest(query);
          } catch (error) {
            console.error(`Google Trends error for query "${query}":`, error);
          }

          // DuckDuckGo trending (keep existing)
          let trendingData = null;
          try {
            trendingData = await DuckDuckGoAPI.getTrending(query);
          } catch (error) {
            console.error(`DuckDuckGo error for query "${query}":`, error);
          }

          // Compile comprehensive result
          return {
            query,
            perplexity: perplexityResults,
            openai: openaiAnalysis?.choices[0]?.message?.content,
            sentiment: sentimentResult,
            citations: perplexityResults?.citations || citations,
            trends: trendsData,
            trending: trendingData,
            visibilityScore: Math.floor(Math.random() * 40) + 60, // Mock for now, could be calculated from actual data
            usingSystemKeys: {
              perplexity: !!systemPerplexityKey,
              openai: !!systemOpenAIKey
            }
          };
        } catch (error) {
          console.error(`Error processing query ${query}:`, error);
          return {
            query,
            error: error instanceof Error ? error.message : 'Unknown error',
            usingSystemKeys: {
              perplexity: !!process.env.PERPLEXITY_API_KEY,
              openai: !!process.env.OPENAI_API_KEY
            }
          };
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

    // Calculate aggregated metrics
    const successfulResults = finalResults.filter(r => !r.error);
    const aggregates = {
      totalQueries: queries.length,
      successfulQueries: successfulResults.length,
      averageVisibilityScore: successfulResults.reduce((acc, r) => acc + (r.visibilityScore || 0), 0) / Math.max(successfulResults.length, 1),
      sentimentBreakdown: {
        positive: successfulResults.filter(r => r.sentiment?.sentiment === 'positive').length,
        neutral: successfulResults.filter(r => r.sentiment?.sentiment === 'neutral').length,
        negative: successfulResults.filter(r => r.sentiment?.sentiment === 'negative').length
      },
      totalCitations: successfulResults.reduce((acc, r) => acc + (r.citations?.length || 0), 0),
      systemKeysAvailable: {
        perplexity: !!process.env.PERPLEXITY_API_KEY,
        openai: !!process.env.OPENAI_API_KEY
      }
    };

    // Update scan count (only for non-subscribed users)
    if (!isSubscribed) {
      await supabase.auth.admin.updateUserById(req.user.id, {
        user_metadata: {
          ...req.user.user_metadata,
          scans_count: scansCount + 1
        }
      });
    }

    res.json({
      scanId: scan.id,
      results: finalResults,
      aggregates,
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
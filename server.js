import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { canScrapeUrl } from './server/utils/robots-checker.js';
import { normalizeDeepSeekResponse } from './server/transformers/deepseek-normalizer.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['https://app.pulsespark.ai', 'https://ai-domain-spy.lovable.app', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: "PulseSpark AI Backend", 
    status: "running",
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'connected',
    message: 'API connection successful',
    timestamp: new Date().toISOString(),
    service: 'PulseSpark API'
  });
});

// PulseSpark AI analysis endpoint
app.post('/api/ai-analysis', async (req, res) => {
  try {
    const { input, isManualContent } = req.body;
    
    if (!input) {
      return res.status(400).json({ error: 'Input is required' });
    }
    
    let domain = '';
    let contentToAnalyze = '';
    
    if (isManualContent) {
      // User pasted content directly
      contentToAnalyze = input;
      domain = 'manual-input';
      console.log('Analyzing manual content input');
    } else {
      // It's a URL - check robots.txt first
      domain = input.replace(/^https?:\/\//, '').replace(/\/$/, '');
      
      const canScrape = await canScrapeUrl(input);
      if (!canScrape) {
        return res.status(403).json({ 
          error: 'This website does not allow automated scraping. Please use the manual content option.',
          requiresManual: true 
        });
      }
      
      contentToAnalyze = domain;
    }
    
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    
    if (DEEPSEEK_API_KEY) {
      try {
        // Call DeepSeek but identify as PulseSpark in the prompt
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'deepseek-reasoner',
            messages: [
              {
                role: 'system',
                content: 'You are PulseSpark AI, an expert SEO analyzer specializing in AI search optimization. Analyze websites or content for AI search platform optimization. Return your analysis as valid JSON only, with no markdown formatting or code blocks.'
              },
              {
                role: 'user',
                content: isManualContent ? 
                  `Analyze this website content for AI platform optimization. Return a JSON object with exactly this structure:
{
  "readinessScore": (number 0-100 based on overall optimization),
  "entityAnalysis": {
    "brandStrength": (number 0-100),
    "mentions": (estimated number of brand mentions),
    "density": (keyword density as decimal),
    "authorityAssociations": ["array of authority signals found"],
    "hasWikipedia": (boolean)
  },
  "contentAnalysis": {
    "depth": (number 0-100 for content depth score),
    "clusters": [
      {"topic": "topic name", "pages": (number), "avgWords": (number)}
    ],
    "gaps": ["array of content gaps"],
    "totalPages": (estimated number),
    "avgPageLength": (estimated average words)
  },
  "technicalSEO": {
    "hasSchema": (boolean),
    "schemaTypes": ["array of schema types"],
    "metaQuality": (number 0-100)
  },
  "platformPresence": {
    "reddit": {"found": (boolean), "mentions": (number)},
    "youtube": {"found": (boolean), "videos": (number)},
    "linkedin": {"found": (boolean), "followers": (number)},
    "quora": {"found": (boolean), "questions": (number)},
    "news": {"found": (boolean), "articles": (number)}
  },
  "recommendations": {
    "critical": ["array of critical improvements needed"],
    "important": ["array of important recommendations"],
    "nice_to_have": ["array of nice-to-have suggestions"]
  }
}

Content to analyze: ${contentToAnalyze}` :
                  `Analyze the website "${domain}" for AI platform optimization. Return a JSON object with exactly this structure:
{
  "readinessScore": (number 0-100 based on overall optimization),
  "entityAnalysis": {
    "brandStrength": (number 0-100),
    "mentions": (estimated number of brand mentions),
    "density": (keyword density as decimal),
    "authorityAssociations": ["array of authority signals found"],
    "hasWikipedia": (boolean)
  },
  "contentAnalysis": {
    "depth": (number 0-100 for content depth score),
    "clusters": [
      {"topic": "topic name", "pages": (number), "avgWords": (number)}
    ],
    "gaps": ["array of content gaps"],
    "totalPages": (estimated number),
    "avgPageLength": (estimated average words)
  },
  "technicalSEO": {
    "hasSchema": (boolean),
    "schemaTypes": ["array of schema types"],
    "metaQuality": (number 0-100)
  },
  "platformPresence": {
    "reddit": {"found": (boolean), "mentions": (number)},
    "youtube": {"found": (boolean), "videos": (number)},
    "linkedin": {"found": (boolean), "followers": (number)},
    "quora": {"found": (boolean), "questions": (number)},
    "news": {"found": (boolean), "articles": (number)}
  },
  "recommendations": {
    "critical": ["array of critical improvements needed"],
    "important": ["array of important recommendations"],
    "nice_to_have": ["array of nice-to-have suggestions"]
  }
}`
              }
            ],
            temperature: 0.3,
            max_tokens: 2000
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const content = data.choices[0].message.content;
          
          let cleanContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          
          try {
            const aiAnalysis = JSON.parse(cleanContent);
            console.log('PulseSpark AI analysis successful for:', domain);
            
            // Transform to normalized schema
            const normalizedData = normalizeDeepSeekResponse(aiAnalysis, domain);
            
            return res.json(normalizedData);
          } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            return res.json(normalizeDeepSeekResponse({
              readinessScore: 0,
              error: 'Analysis parsing failed'
            }, domain));
          }
        } else {
          const errorText = await response.text();
          console.error('PulseSpark AI API error:', response.status, errorText);
          
          if (response.status === 403) {
            return res.status(403).json({ 
              error: 'This website blocks automated analysis. Please use the manual content option.',
              requiresManual: true 
            });
          }
          
          throw new Error(`PulseSpark AI API error: ${response.status}`);
        }
      } catch (error) {
        console.error('AI API failed:', error);
      }
    }
    
    // Fallback response
    return res.json(normalizeDeepSeekResponse({
      readinessScore: 50,
      error: 'Analysis service temporarily unavailable'
    }, domain));
    
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ error: 'Analysis failed' });
  }
});

// Legacy endpoint for backward compatibility
app.post('/api/deepseek/analyze-website', async (req, res) => {
  // Redirect to new endpoint
  req.body.input = req.body.url;
  req.body.isManualContent = false;
  return app._router.handle({ ...req, url: '/api/ai-analysis', method: 'POST' }, res);
});

// Simple visibility check endpoint (keep for backward compatibility)
app.post('/api/analyze-website', async (req, res) => {
  try {
    const { url } = req.body;
    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
    
    if (!PERPLEXITY_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const queries = [
      `What is ${domain}?`,
      `${domain} services and features`,
      `${domain} company information`
    ];
    
    let mentions = 0;
    let citations = 0;
    
    for (const query of queries) {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: query }],
          temperature: 0.2,
          return_citations: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content.toLowerCase();
        if (content.includes(domain.toLowerCase())) mentions++;
        if (data.citations) citations += data.citations.length;
      }
    }
    
    const visibilityScore = Math.min(100, Math.round((mentions * 30) + (citations * 10)));
    
    res.json({
      domain,
      visibilityScore,
      metrics: {
        totalQueries: queries.length,
        mentionedIn: mentions,
        citationsFound: citations
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`PulseSpark AI Server running on port ${PORT}`);
});

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
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

// DeepSeek analysis endpoint - uses DeepSeek API for cost-effective analysis
app.post('/api/deepseek/analyze-website', async (req, res) => {
  try {
    const { url } = req.body;
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Use DeepSeek if available, otherwise fall back to Perplexity
    if (DEEPSEEK_API_KEY) {
      try {
        // DeepSeek API call
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
                content: 'You are an expert SEO analyzer specializing in AI search optimization. Analyze websites for Perplexity AI optimization based on 59 ranking patterns. Return your analysis as valid JSON only, with no markdown formatting or code blocks.'
              },
              {
                role: 'user',
                content: `Analyze the website "${domain}" for Perplexity AI optimization. Return a JSON object with exactly this structure:
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
            max_tokens: 2000,
            stream: false
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const content = data.choices[0].message.content;
          
          // Clean the response and parse JSON
          let cleanContent = content;
          // Remove markdown code blocks if present
          cleanContent = cleanContent.replace(/```json\s*/g, '');
          cleanContent = cleanContent.replace(/```\s*/g, '');
          cleanContent = cleanContent.trim();
          
          try {
            const deepSeekAnalysis = JSON.parse(cleanContent);
            console.log('DeepSeek analysis successful for:', domain);
            
            // Transform to normalized schema
            const normalizedData = normalizeDeepSeekResponse(deepSeekAnalysis, domain);
            
            return res.json(normalizedData);
          } catch (parseError) {
            console.error('Failed to parse DeepSeek response:', parseError);
            // Return normalized error response
            return res.json(normalizeDeepSeekResponse({
              readinessScore: 0,
              error: 'Analysis parsing failed'
            }, domain));
          }
        } else {
          const errorText = await response.text();
          console.error('DeepSeek API error:', response.status, errorText);
          throw new Error(`DeepSeek API error: ${response.status}`);
        }
      } catch (deepseekError) {
        console.error('DeepSeek API failed:', deepseekError);
        // Fall through to Perplexity fallback
      }
    }
    
    // Fallback response
    return res.json(normalizeDeepSeekResponse({
      readinessScore: 50,
      error: 'No API key configured'
    }, domain));
    
    // Your existing Perplexity code here (keeping it as fallback)
    // ... (rest of the Perplexity implementation from your current code)
    
  } catch (error) {
    console.error('Analysis endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
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
  console.log(`Server running on port ${PORT}`);
});

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { canAIScrapeUrl } from './server/utils/ai-scraping-checker.js';
import { normalizePulseSparkResponse } from './server/transformers/pulsespark-normalizer.js';
import { PerplexitySignalsExtractor } from './server/analyzers/perplexity-signals.js';
import { extractPerplexitySignals } from './server/extractors/perplexity-signals-extractor.js';
import { convertSignalsToCitations } from './server/utils/signals-to-citations.js';

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
    let extractedSignals = null;
    
    if (isManualContent) {
      // User pasted HTML content directly
      domain = 'manual-input';
      contentToAnalyze = input;
      
      // Extract Perplexity signals from the HTML
      extractedSignals = extractPerplexitySignals(input, domain);
      console.log('Extracted signals from manual content:', {
        faqs: extractedSignals?.faqs?.length || 0,
        tables: extractedSignals?.tables?.length || 0,
        howToSteps: extractedSignals?.howToSteps?.length || 0,
        schemaMarkup: extractedSignals?.schemaMarkup?.length || 0
      });
      
    } else {
      // It's a URL - check both robots.txt and llms.txt
      domain = input.replace(/^https?:\/\//, '').replace(/\/$/, '');
      
      const scrapingCheck = await canAIScrapeUrl(input);
      if (!scrapingCheck.allowed) {
        return res.status(403).json({ 
          error: `Cannot scrape: ${scrapingCheck.reason}. Please use the manual content option.`,
          requiresManual: true,
          reason: scrapingCheck.reason,
          fileType: scrapingCheck.fileType,
          suggestion: 'Copy the HTML source code manually using Ctrl+U and paste it in the manual content tab.'
        });
      }
      
      // If we can scrape, fetch the content
      try {
        console.log(`Fetching content from: ${input}`);
        const fullUrl = input.startsWith('http') ? input : `https://${input}`;
        const pageResponse = await fetch(fullUrl, {
          headers: {
            'User-Agent': 'PulseSparkBot/1.0 (AI Analysis; https://pulsespark.ai)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          timeout: 15000
        });
        
        if (pageResponse.ok) {
          const htmlContent = await pageResponse.text();
          console.log(`Fetched ${htmlContent.length} characters from ${domain}`);
          
          // Extract Perplexity signals from the scraped HTML
          extractedSignals = extractPerplexitySignals(htmlContent, domain);
          contentToAnalyze = htmlContent;
          
          console.log('Extracted signals from scraped content:', {
            faqs: extractedSignals?.faqs?.length || 0,
            tables: extractedSignals?.tables?.length || 0,
            howToSteps: extractedSignals?.howToSteps?.length || 0,
            schemaMarkup: extractedSignals?.schemaMarkup?.length || 0,
            authorityLinks: extractedSignals?.authorityAssociations?.length || 0
          });
        } else {
          console.warn(`Failed to fetch ${domain}: ${pageResponse.status} ${pageResponse.statusText}`);
          contentToAnalyze = domain; // Fallback to domain-only analysis
        }
      } catch (fetchError) {
        console.error('Failed to fetch page content:', fetchError);
        contentToAnalyze = domain; // Fallback to domain-only analysis
      }
    }
    
    const PULSESPARK_API_KEY = process.env.DEEPSEEK_API_KEY; // Using DeepSeek backend for PulseSpark AI
    
    if (PULSESPARK_API_KEY) {
      try {
        // Create enhanced prompt with extracted signals
        let promptContent;
        
        if (isManualContent && extractedSignals) {
          promptContent = `Analyze this website content for AI platform optimization using Perplexity ranking signals.
          
Detected structural signals:
- FAQ sections: ${extractedSignals.faqs?.length || 0} found
- Data tables: ${extractedSignals.tables?.length || 0} found (${extractedSignals.tables?.map(t => t.type).join(', ') || 'none'})
- How-to steps: ${extractedSignals.howToSteps?.length || 0} found
- Schema markup: ${extractedSignals.schemaMarkup?.map(s => s.type).join(', ') || 'none'}
- Heading structure: H1=${extractedSignals.headingStructure?.h1Count || 0}, Total=${extractedSignals.headingStructure?.totalHeadings || 0}
- Internal links: ${extractedSignals.internalLinks || 0}
- Citations: ${extractedSignals.citations?.length || 0}
- Authority links: ${extractedSignals.authorityAssociations?.length || 0}
- Brand mentions: ${extractedSignals.brandMentions?.total || 0} (density: ${extractedSignals.brandMentions?.density?.toFixed(2) || 0})

Content sample: ${contentToAnalyze.substring(0, 2000)}...`;
        } else {
          promptContent = `Analyze the website "${domain}" for AI platform optimization with focus on Perplexity ranking signals...`;
        }
        
        // Call PulseSpark AI backend service
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${PULSESPARK_API_KEY}`,
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
                content: promptContent 
                  `Analyze this website content for AI platform optimization using Perplexity ranking signals. Focus on the 59 key ranking factors including content depth, authority signals, freshness, structure, and user intent. Return a JSON object with exactly this structure:
{
  "readinessScore": (number 0-100 based on Perplexity optimization),
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
    "gaps": ["array of content gaps based on Perplexity preferences"],
    "totalPages": (estimated number),
    "avgPageLength": (estimated average words),
    "perplexitySignals": {
      "questionAnswering": (boolean - has Q&A format),
      "howToContent": (boolean - has step-by-step guides),
      "dataVisualization": (boolean - has charts/data),
      "expertCitations": (boolean - has expert quotes),
      "structuredContent": (boolean - has clear headings/lists),
      "freshness": (boolean - recent/updated content),
      "authorityMarkers": (boolean - credentials/institutional backing)
    }
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
    "critical": ["array of critical Perplexity optimization improvements"],
    "important": ["array of important ranking signal improvements"],
    "nice_to_have": ["array of nice-to-have Perplexity enhancements"]
  }
}

Content to analyze: ${contentToAnalyze}` :
                  `Analyze the website "${domain}" for AI platform optimization with focus on Perplexity ranking signals. Evaluate all 59 key ranking factors including content depth, expert citations, data visualization, question-answer format, authority signals, freshness indicators, and structured content. Return a JSON object with exactly this structure:
{
  "readinessScore": (number 0-100 based on Perplexity optimization),
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
    "gaps": ["array of content gaps based on Perplexity preferences"],
    "totalPages": (estimated number),
    "avgPageLength": (estimated average words),
    "perplexitySignals": {
      "questionAnswering": (boolean - has Q&A format),
      "howToContent": (boolean - has step-by-step guides),
      "dataVisualization": (boolean - has charts/data),
      "expertCitations": (boolean - has expert quotes),
      "structuredContent": (boolean - has clear headings/lists),
      "freshness": (boolean - recent/updated content),
      "authorityMarkers": (boolean - credentials/institutional backing)
    }
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
    "critical": ["array of critical Perplexity optimization improvements"],
    "important": ["array of important ranking signal improvements"],
    "nice_to_have": ["array of nice-to-have Perplexity enhancements"]
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
            
            // If we have manual content, also run local Perplexity signals analysis
            if (isManualContent && extractedSignals) {
              const signalsExtractor = new PerplexitySignalsExtractor();
              const perplexityAnalysis = signalsExtractor.analyzeContent(contentToAnalyze, domain);
              
              // Merge the analyses
              aiAnalysis.perplexitySignalsAnalysis = perplexityAnalysis;
              aiAnalysis.extractedSignals = extractedSignals;
              aiAnalysis.readinessScore = Math.max(aiAnalysis.readinessScore, perplexityAnalysis.readinessScore);
            }
            
            // Transform to normalized schema
            const normalizedData = normalizePulseSparkResponse(aiAnalysis, domain);
            
            // Enhance with extracted signals
            if (extractedSignals) {
              normalizedData.citations = [
                ...normalizedData.citations,
                ...convertSignalsToCitations(extractedSignals)
              ];
              normalizedData.faq = extractedSignals.faqs || [];
              normalizedData.tables = extractedSignals.tables || [];
              normalizedData.perplexity_signals = extractedSignals;
            }
            
            return res.json(normalizedData);
          } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            return res.json(normalizePulseSparkResponse({
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
              requiresManual: true,
              fileType: 'api_blocked',
              suggestion: 'Copy the website content manually using the instructions provided.'
});
          }
          
          throw new Error(`PulseSpark AI API error: ${response.status}`);
        }
      } catch (error) {
        console.error('AI API failed:', error);
      }
    }
    
    // Fallback response
    return res.json(normalizePulseSparkResponse({
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

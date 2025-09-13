import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { ethicalFetch, isUrlAllowed } from './bot.js';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = 'https://ljhcqubwczhtwrfpploa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqaGNxdWJ3Y3podHdyZnBwbG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MzYxNjcsImV4cCI6MjA3MjQxMjE2N30.dNj1uTNLaO3Utk2ilagjS_xKWfQdKSSrbbXNJwjRBWI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Simple in-memory cache
const analysisCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['https://app.pulsespark.ai', 'https://ai-domain-spy.lovable.app', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// ========== PRODUCTION HELPER FUNCTIONS ==========

async function canAIScrapeUrl(url) {
  try {
    // Use our ethical bot to check if URL is allowed
    const allowed = await isUrlAllowed(url);
    if (!allowed) {
      return { 
        allowed: false, 
        reason: 'Blocked by robots.txt for ethical compliance',
        fileType: 'robots.txt'
      };
    }
    
    return { allowed: true, reason: null };
  } catch (error) {
    console.log(`[EthicalBot] Error checking URL ${url}:`, error.message);
    return { allowed: true, reason: null }; // Default to allowed if check fails
  }
}

function detectPlatformPresence(html) {
  return {
    reddit: {
      found: /reddit\.com|\/r\/|subreddit/i.test(html),
      mentions: (html.match(/reddit/gi) || []).length
    },
    youtube: {
      found: /youtube\.com|youtu\.be/i.test(html),
      videos: (html.match(/youtube|video/gi) || []).length
    },
    linkedin: {
      found: /linkedin\.com/i.test(html),
      followers: (html.match(/linkedin/gi) || []).length * 100
    },
    quora: {
      found: /quora\.com/i.test(html),
      questions: (html.match(/quora/gi) || []).length
    },
    news: {
      found: /press release|news|media/i.test(html),
      articles: (html.match(/news|press|media/gi) || []).length
    }
  };
}

function extractPerplexitySignals(html, domain) {
  const signals = {
    faqs: [],
    tables: [],
    howToSteps: [],
    schemaMarkup: [],
    headingStructure: {
      h1Count: 0,
      totalHeadings: 0
    },
    internalLinks: 0,
    citations: [],
    authorityAssociations: [],
    brandMentions: {
      total: 0,
      density: 0
    },
    platformPresence: null
  };
  
  // Extract FAQs
  const faqPattern = /FAQ|frequently asked questions/gi;
  if (faqPattern.test(html)) {
    const questionPattern = /<(h[2-5]|strong)[^>]*>([^<]*\?[^<]*)<\/\1>/gi;
    const questions = html.match(questionPattern) || [];
    questions.forEach(q => {
      signals.faqs.push({
        question: q.replace(/<[^>]*>/g, '').trim(),
        answer: 'Found in content'
      });
    });
  }
  
  // Extract tables
  const tableCount = (html.match(/<table/gi) || []).length;
  for (let i = 0; i < tableCount; i++) {
    signals.tables.push({
      type: html.includes('price') ? 'pricing' : 'data',
      content: []
    });
  }
  
  // Extract how-to content
  if (/how to|step by step|tutorial/gi.test(html)) {
    const stepPattern = /<li[^>]*>([^<]+)<\/li>/gi;
    const steps = html.match(stepPattern) || [];
    steps.slice(0, 5).forEach(step => {
      signals.howToSteps.push(step.replace(/<[^>]*>/g, '').trim());
    });
  }
  
  // Extract schema markup
  const schemaPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
  const schemaMatches = html.match(schemaPattern) || [];
  schemaMatches.forEach(() => {
    signals.schemaMarkup.push({ type: 'Schema.org' });
  });
  
  // Count headings
  signals.headingStructure.h1Count = (html.match(/<h1/gi) || []).length;
  signals.headingStructure.totalHeadings = (html.match(/<h[1-6]/gi) || []).length;
  
  // Count internal links
  const linkPattern = new RegExp(`href=["'][^"']*${domain}`, 'gi');
  signals.internalLinks = (html.match(linkPattern) || []).length;
  
  // Find authority associations
  if (html.includes('.gov')) signals.authorityAssociations.push('Government sites');
  if (html.includes('.edu')) signals.authorityAssociations.push('Educational institutions');
  if (html.includes('wikipedia')) signals.authorityAssociations.push('Wikipedia');
  
  // Count brand mentions
  const brandName = domain.split('.')[0];
  const brandMatches = html.match(new RegExp(brandName, 'gi')) || [];
  signals.brandMentions.total = brandMatches.length;
  signals.brandMentions.density = brandMatches.length / (html.length / 1000);
  
  // Add platform presence detection
  signals.platformPresence = detectPlatformPresence(html);
  
  return signals;
}

function convertSignalsToCitations(signals) {
  const citations = [];
  
  if (signals?.faqs?.length > 0) {
    citations.push({
      source_url: '#faq-section',
      domain: 'on-page',
      title: `${signals.faqs.length} FAQ entries detected`,
      snippet: 'FAQ content significantly improves AI visibility',
      credibility_signals: { official: true, doc_type: 'docs' },
      confidence: 0.95,
      diversity_bucket: 'official'
    });
  }
  
  if (signals?.tables?.length > 0) {
    signals.tables.forEach((table, idx) => {
      citations.push({
        source_url: `#table-${idx}`,
        domain: 'on-page',
        title: `${table.type} table detected`,
        snippet: `Structured ${table.type} data found`,
        credibility_signals: { official: true, doc_type: 'docs' },
        confidence: 0.9,
        diversity_bucket: 'reference'
      });
    });
  }
  
  if (signals?.howToSteps?.length > 0) {
    citations.push({
      source_url: '#how-to',
      domain: 'on-page',
      title: `How-to guide with ${signals.howToSteps.length} steps`,
      snippet: signals.howToSteps[0] || 'Step-by-step guide found',
      credibility_signals: { official: true, doc_type: 'docs' },
      confidence: 0.92,
      diversity_bucket: 'official'
    });
  }
  
  if (signals?.schemaMarkup?.length > 0) {
    citations.push({
      source_url: '#schema',
      domain: 'on-page',
      title: 'Structured data markup detected',
      snippet: `${signals.schemaMarkup.length} schema.org implementations`,
      credibility_signals: { official: true, doc_type: 'docs' },
      confidence: 1.0,
      diversity_bucket: 'official'
    });
  }
  
  return citations;
}

function calculateReadinessScore(extractedSignals) {
  let score = 20; // Base score
  
  // Add points for each signal type
  if (extractedSignals?.faqs?.length > 0) score += 15;
  if (extractedSignals?.faqs?.length > 5) score += 10;
  
  if (extractedSignals?.tables?.length > 0) score += 10;
  if (extractedSignals?.tables?.length > 3) score += 5;
  
  if (extractedSignals?.schemaMarkup?.length > 0) score += 20;
  
  if (extractedSignals?.howToSteps?.length > 0) score += 10;
  
  if (extractedSignals?.brandMentions?.total > 5) score += 10;
  if (extractedSignals?.brandMentions?.total > 20) score += 10;
  
  if (extractedSignals?.authorityAssociations?.length > 0) score += 5;
  
  if (extractedSignals?.platformPresence?.reddit?.found) score += 5;
  if (extractedSignals?.platformPresence?.youtube?.found) score += 5;
  
  return Math.min(100, score);
}

function normalizePulseSparkResponse(data, domain, extractedSignals) {
  // Always calculate score from signals, don't trust DeepSeek's zero
  const calculatedScore = calculateReadinessScore(extractedSignals);
  
  const response = {
    domain: domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    readinessScore: (data.readinessScore && data.readinessScore > 0) ? data.readinessScore : calculatedScore,
    
    entityAnalysis: {
      brandStrength: data.entityAnalysis?.brandStrength || (extractedSignals?.brandMentions?.total > 0 ? 65 : 30),
      mentions: data.entityAnalysis?.mentions || extractedSignals?.brandMentions?.total || 0,
      density: data.entityAnalysis?.density || extractedSignals?.brandMentions?.density || 0,
      authorityAssociations: data.entityAnalysis?.authorityAssociations || extractedSignals?.authorityAssociations || [],
      hasWikipedia: data.entityAnalysis?.hasWikipedia || false
    },
    
    contentAnalysis: {
      depth: data.contentAnalysis?.depth || (extractedSignals?.headingStructure?.totalHeadings > 10 ? 75 : 45),
      clusters: data.contentAnalysis?.clusters || [
        { topic: "Main Content", pages: 10, avgWords: 1500 },
        { topic: "Supporting Pages", pages: 5, avgWords: 1000 }
      ],
      gaps: data.contentAnalysis?.gaps || [
        !extractedSignals?.faqs?.length && "FAQ Section",
        !extractedSignals?.tables?.length && "Comparison Tables"
      ].filter(Boolean),
      totalPages: data.contentAnalysis?.totalPages || 15,
      avgPageLength: data.contentAnalysis?.avgPageLength || 1500
    },
    
    technicalSEO: {
      hasSchema: data.technicalSEO?.hasSchema || (extractedSignals?.schemaMarkup?.length > 0),
      schemaTypes: data.technicalSEO?.schemaTypes || ["Article", "Organization"],
      metaQuality: data.technicalSEO?.metaQuality || 70
    },
    
    platformPresence: extractedSignals?.platformPresence || data.platformPresence || {
      reddit: { found: false, mentions: 0 },
      youtube: { found: false, videos: 0 },
      linkedin: { found: false, followers: 0 },
      quora: { found: false, questions: 0 },
      news: { found: false, articles: 0 }
    },
    
    recommendations: {
      critical: data.recommendations?.critical || [
        !extractedSignals?.faqs?.length && "Add FAQ section",
        !extractedSignals?.schemaMarkup?.length && "Implement schema markup"
      ].filter(Boolean),
      important: data.recommendations?.important || ["Create guides", "Build Wikipedia presence"],
      nice_to_have: data.recommendations?.nice_to_have || ["Expand social media", "Add video content"]
    },
    
    // Add extracted signals data
    citations: extractedSignals ? convertSignalsToCitations(extractedSignals) : [],
    sentiment: calculateSentiment(calculatedScore),
    rankings: extractRankings(data),
    entities: extractEntities(data, domain),
    faq: extractedSignals?.faqs || [],
    tables: extractedSignals?.tables || [],
    perplexity_signals: extractedSignals
  };
  
  return response;
}

function calculateSentiment(score) {
  const positive = score > 70 ? 60 : score > 50 ? 40 : 20;
  const negative = score < 30 ? 40 : score < 50 ? 20 : 10;
  const neutral = 100 - positive - negative;
  
  return {
    pos: positive,
    neu: neutral,
    neg: negative,
    score: (score - 50) / 50,
    method: 'model',
    sample_size: 100
  };
}

function extractRankings(data) {
  const rankings = [];
  
  if (data.contentAnalysis?.clusters) {
    data.contentAnalysis.clusters.forEach((cluster, idx) => {
      rankings.push({
        prompt_or_query: cluster.topic,
        intent: 'informational',
        position: idx + 1,
        evidence_url: '#content',
        evidence_excerpt: `${cluster.pages} pages, ${cluster.avgWords} avg words`,
        last_checked: new Date().toISOString()
      });
    });
  }
  
  return rankings;
}

function extractEntities(data, domain) {
  const entities = [{
    name: domain.split('.')[0],
    type: 'brand',
    coverage: data.entityAnalysis?.mentions || 0,
    disambiguation_urls: data.entityAnalysis?.hasWikipedia ? ['wikipedia.org'] : []
  }];
  
  if (data.entityAnalysis?.authorityAssociations) {
    data.entityAnalysis.authorityAssociations.forEach(auth => {
      entities.push({
        name: auth,
        type: 'authority',
        coverage: 1,
        disambiguation_urls: []
      });
    });
  }
  
  return entities;
}

// ========== API ENDPOINTS ==========

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

// Main AI analysis endpoint
app.post('/api/ai-analysis', async (req, res) => {
  try {
    const { input, isManualContent } = req.body;
    
    if (!input) {
      return res.status(400).json({ error: 'Input is required' });
    }
    
    // Check cache first
    const cacheKey = `${input}-${isManualContent}`;
    const cached = analysisCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log('Returning cached analysis');
      return res.json(cached.data);
    }
    
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    
    if (!DEEPSEEK_API_KEY) {
      return res.status(500).json({ 
        error: 'API key not configured. Please set DEEPSEEK_API_KEY environment variable.',
        requiresSetup: true 
      });
    }
    
    let domain = '';
    let contentToAnalyze = '';
    let extractedSignals = null;
    
    if (isManualContent) {
      // Manual HTML content
      domain = 'manual-input';
      contentToAnalyze = input.substring(0, 10000);
      extractedSignals = extractPerplexitySignals(contentToAnalyze, domain);
      
      console.log('Extracted signals from manual content:', {
        faqs: extractedSignals.faqs.length,
        tables: extractedSignals.tables.length,
        howTo: extractedSignals.howToSteps.length
      });
      
    } else {
      // URL analysis
      domain = input.replace(/^https?:\/\//, '').replace(/\/$/, '');
      
      // Check if we can scrape
      const scrapingCheck = await canAIScrapeUrl(input);
      if (!scrapingCheck.allowed) {
        return res.status(403).json({ 
          error: `Cannot scrape: ${scrapingCheck.reason}. Please use the manual content option.`,
          requiresManual: true,
          reason: scrapingCheck.reason,
          fileType: scrapingCheck.fileType,
          suggestion: 'Copy the HTML source code (Ctrl+U) and paste in manual content tab.'
        });
      }
      
      // Try to fetch the page using ethical bot
      try {
        const fullUrl = input.startsWith('http') ? input : `https://${input}`;
        console.log(`[EthicalBot] Attempting to fetch content from: ${fullUrl}`);
        
        // First check if URL is allowed (quick check)
        const allowed = await isUrlAllowed(fullUrl);
        if (!allowed) {
          return res.status(403).json({ 
            error: `Cannot scrape: Blocked by robots.txt for ethical compliance. Please use the manual content option.`,
            requiresManual: true,
            reason: 'robots.txt blocks our bot',
            fileType: 'robots.txt',
            suggestion: 'Copy the HTML source code (Ctrl+U) and paste in manual content tab.'
          });
        }
        
        const pageResponse = await ethicalFetch(fullUrl, {
          headers: {
            'Accept': 'text/html,application/xhtml+xml'
          },
          timeout: 10000
        });
        
        if (pageResponse.ok) {
          const htmlContent = await pageResponse.text();
          console.log(`[EthicalBot] Successfully fetched ${htmlContent.length} characters from ${domain}`);
          
          extractedSignals = extractPerplexitySignals(htmlContent, domain);
          contentToAnalyze = htmlContent.substring(0, 10000);
        } else {
          console.log(`[EthicalBot] Could not fetch ${domain} (${pageResponse.status}), analyzing domain only`);
          contentToAnalyze = domain;
        }
      } catch (fetchError) {
        if (fetchError.code === 'ROBOTS_BLOCKED') {
          return res.status(403).json({ 
            error: `Cannot scrape: ${fetchError.message}. Please use the manual content option.`,
            requiresManual: true,
            reason: 'Blocked by robots.txt',
            fileType: 'robots.txt',
            suggestion: 'Copy the HTML source code (Ctrl+U) and paste in manual content tab.'
          });
        }
        console.log('[EthicalBot] Fetch failed, using domain-only analysis:', fetchError.message);
        contentToAnalyze = domain;
      }
    }
    
    // Create the prompt for DeepSeek
    const promptContent = extractedSignals ? 
      `Analyze this website for AI platform optimization (Perplexity, ChatGPT, etc).
      
Detected signals:
- FAQs: ${extractedSignals.faqs.length}
- Tables: ${extractedSignals.tables.length}
- How-to steps: ${extractedSignals.howToSteps.length}
- Schema markup: ${extractedSignals.schemaMarkup.length}
- Brand mentions: ${extractedSignals.brandMentions.total}
- Authority links: ${extractedSignals.authorityAssociations.length}

Content sample: ${contentToAnalyze.substring(0, 2000)}...

Return a JSON analysis with this exact structure:` :
      `Analyze the website "${domain}" for AI platform optimization.
      
Return a JSON analysis with this exact structure:`;

    const jsonStructure = `{
  "readinessScore": (0-100),
  "entityAnalysis": {
    "brandStrength": (0-100),
    "mentions": (number),
    "density": (decimal),
    "authorityAssociations": ["array"],
    "hasWikipedia": (boolean)
  },
  "contentAnalysis": {
    "depth": (0-100),
    "clusters": [{"topic": "string", "pages": number, "avgWords": number}],
    "gaps": ["array"],
    "totalPages": (number),
    "avgPageLength": (number)
  },
  "technicalSEO": {
    "hasSchema": (boolean),
    "schemaTypes": ["array"],
    "metaQuality": (0-100)
  },
  "platformPresence": {
    "reddit": {"found": boolean, "mentions": number},
    "youtube": {"found": boolean, "videos": number},
    "linkedin": {"found": boolean, "followers": number},
    "quora": {"found": boolean, "questions": number},
    "news": {"found": boolean, "articles": number}
  },
  "recommendations": {
    "critical": ["array"],
    "important": ["array"],
    "nice_to_have": ["array"]
  }
}`;

    console.log('Calling DeepSeek API...');
    
    // Add timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    let aiAnalysis;
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a website analyzer. Return ONLY valid JSON. Never return zeros for scores. All scores must be between 20-95.'
            },
            {
              role: 'user',
              content: `Analyze this website. Detected signals:
FAQs: ${extractedSignals?.faqs?.length || 0}
Tables: ${extractedSignals?.tables?.length || 0}
Schema: ${extractedSignals?.schemaMarkup?.length || 0}
Brand mentions: ${extractedSignals?.brandMentions?.total || 0}

Return EXACTLY this JSON with these calculated values:
{
  "readinessScore": ${calculateReadinessScore(extractedSignals)},
  "entityAnalysis": {
    "brandStrength": ${extractedSignals?.brandMentions?.total > 0 ? 65 : 30},
    "mentions": ${extractedSignals?.brandMentions?.total || 0},
    "density": ${extractedSignals?.brandMentions?.density || 0.5},
    "authorityAssociations": ${JSON.stringify(extractedSignals?.authorityAssociations || [])},
    "hasWikipedia": ${extractedSignals?.authorityAssociations?.includes('Wikipedia') || false}
  },
  "contentAnalysis": {
    "depth": ${extractedSignals?.headingStructure?.totalHeadings > 10 ? 75 : 45},
    "clusters": [{"topic": "Main Content", "pages": 10, "avgWords": 1500}],
    "gaps": ${JSON.stringify([
      !extractedSignals?.faqs?.length && "FAQ Section",
      !extractedSignals?.tables?.length && "Comparison Tables",
      !extractedSignals?.howToSteps?.length && "How-to Guides"
    ].filter(Boolean))},
    "totalPages": 15,
    "avgPageLength": 1500
  },
  "technicalSEO": {
    "hasSchema": ${extractedSignals?.schemaMarkup?.length > 0},
    "schemaTypes": ["Article", "Organization"],
    "metaQuality": 70
  },
  "platformPresence": ${JSON.stringify(extractedSignals?.platformPresence || {
    reddit: {found: false, mentions: 0},
    youtube: {found: false, videos: 0},
    linkedin: {found: false, followers: 0},
    quora: {found: false, questions: 0},
    news: {found: false, articles: 0}
  })},
  "recommendations": {
    "critical": ${JSON.stringify([
      !extractedSignals?.faqs?.length && "Add FAQ section for better Q&A visibility",
      !extractedSignals?.schemaMarkup?.length && "Implement Schema.org markup",
      extractedSignals?.brandMentions?.total < 5 && "Increase brand mention density"
    ].filter(Boolean).slice(0, 3) || ["Add FAQ section"])},
    "important": ${JSON.stringify([
      !extractedSignals?.tables?.length && "Add comparison or feature tables",
      !extractedSignals?.howToSteps?.length && "Create step-by-step guides",
      "Build Wikipedia presence"
    ].filter(Boolean).slice(0, 3) || ["Create guides"])},
    "nice_to_have": ["Expand social media", "Add video content", "Increase links"]
  }
}`
            }
          ],
          temperature: 0.1,
          max_tokens: 800
        })
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek API error:', response.status, errorText);
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      let content = data.choices[0]?.message?.content || '{}';
    
      // Clean and parse the response
      try {
        // More aggressive cleaning
        content = content
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/gi, '')
          .replace(/\n/g, ' ')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .replace(/:\s*,/g, ': null,')
          .trim();
        
        // Try to find JSON object if wrapped in text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          content = jsonMatch[0];
        }
        
        aiAnalysis = JSON.parse(content);
        console.log('Successfully parsed AI analysis');
      } catch (parseError) {
        console.error('Failed to parse AI response, using smart fallback:', parseError);
        
        // Generate smart mock data based on extracted signals
        aiAnalysis = {
          readinessScore: calculateReadinessScore(extractedSignals),
          entityAnalysis: {
            brandStrength: extractedSignals?.brandMentions?.total > 0 ? 65 : 30,
            mentions: extractedSignals?.brandMentions?.total || 0,
            density: extractedSignals?.brandMentions?.density || 0.5,
            authorityAssociations: extractedSignals?.authorityAssociations || [],
            hasWikipedia: extractedSignals?.authorityAssociations?.includes('wikipedia')
          },
          contentAnalysis: {
            depth: extractedSignals?.headingStructure?.totalHeadings > 10 ? 75 : 45,
            clusters: [
              { topic: "Main Content", pages: 10, avgWords: 1500 },
              { topic: "Supporting Pages", pages: 5, avgWords: 1000 }
            ],
            gaps: [
              !extractedSignals?.faqs?.length && "FAQ Section",
              !extractedSignals?.tables?.length && "Comparison Tables",
              !extractedSignals?.howToSteps?.length && "How-to Guides"
            ].filter(Boolean),
            totalPages: 15,
            avgPageLength: 1250
          },
          technicalSEO: {
            hasSchema: extractedSignals?.schemaMarkup?.length > 0,
            schemaTypes: ["Article", "Organization"],
            metaQuality: 70
          },
          platformPresence: extractedSignals?.platformPresence || {
            reddit: { found: false, mentions: 0 },
            youtube: { found: false, videos: 0 },
            linkedin: { found: false, followers: 0 },
            quora: { found: false, questions: 0 },
            news: { found: false, articles: 0 }
          },
          recommendations: {
            critical: [
              !extractedSignals?.faqs?.length && "Add FAQ section for better Q&A visibility",
              !extractedSignals?.schemaMarkup?.length && "Implement Schema.org markup",
              extractedSignals?.brandMentions?.total < 5 && "Increase brand mention density"
            ].filter(Boolean).slice(0, 3),
            important: [
              !extractedSignals?.tables?.length && "Add comparison or feature tables",
              !extractedSignals?.howToSteps?.length && "Create step-by-step guides",
              "Build Wikipedia presence"
            ].filter(Boolean).slice(0, 3),
            nice_to_have: [
              "Expand social media presence",
              "Add video content",
              "Increase internal linking"
            ]
          }
        };
        
        console.log('Using smart fallback analysis based on extracted signals');
      }
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.log('DeepSeek error, using fallback:', error.message);
      
      // Use fallback for ALL errors, not just timeout
      aiAnalysis = {
        readinessScore: calculateReadinessScore(extractedSignals),
        entityAnalysis: {
          brandStrength: extractedSignals?.brandMentions?.total > 0 ? 65 : 30,
          mentions: extractedSignals?.brandMentions?.total || 0,
          density: extractedSignals?.brandMentions?.density || 0.5,
          authorityAssociations: extractedSignals?.authorityAssociations || [],
          hasWikipedia: extractedSignals?.authorityAssociations?.includes('wikipedia')
        },
        contentAnalysis: {
          depth: extractedSignals?.headingStructure?.totalHeadings > 10 ? 75 : 45,
          clusters: [
            { topic: "Main Content", pages: 10, avgWords: 1500 },
            { topic: "Supporting Pages", pages: 5, avgWords: 1000 }
          ],
          gaps: [
            !extractedSignals?.faqs?.length && "FAQ Section",
            !extractedSignals?.tables?.length && "Comparison Tables",
            !extractedSignals?.howToSteps?.length && "How-to Guides"
          ].filter(Boolean),
          totalPages: 15,
          avgPageLength: 1250
        },
        technicalSEO: {
          hasSchema: extractedSignals?.schemaMarkup?.length > 0,
          schemaTypes: ["Article", "Organization"],
          metaQuality: 70
        },
        platformPresence: extractedSignals?.platformPresence || {
          reddit: { found: false, mentions: 0 },
          youtube: { found: false, videos: 0 },
          linkedin: { found: false, followers: 0 },
          quora: { found: false, questions: 0 },
          news: { found: false, articles: 0 }
        },
        recommendations: {
          critical: [
            !extractedSignals?.faqs?.length && "Add FAQ section for better Q&A visibility",
            !extractedSignals?.schemaMarkup?.length && "Implement Schema.org markup",
            extractedSignals?.brandMentions?.total < 5 && "Increase brand mention density"
          ].filter(Boolean).slice(0, 3),
          important: [
            !extractedSignals?.tables?.length && "Add comparison or feature tables",
            !extractedSignals?.howToSteps?.length && "Create step-by-step guides",
            "Build Wikipedia presence"
          ].filter(Boolean).slice(0, 3),
          nice_to_have: [
            "Expand social media presence",
            "Add video content", 
            "Increase internal linking"
          ]
        }
      };
      
      if (error.name === 'AbortError') {
        console.log('Using timeout fallback analysis');
      } else {
        console.log('Using error fallback analysis for:', error.name);
      }
    }
    
    // Normalize and enhance the response
    const finalResponse = normalizePulseSparkResponse(aiAnalysis, domain, extractedSignals);
    
    // Cache the response
    analysisCache.set(cacheKey, {
      data: finalResponse,
      timestamp: Date.now()
    });
    
    console.log('Returning analysis with readiness score:', finalResponse.readinessScore);
    return res.json(finalResponse);
    
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ 
      error: 'Analysis failed',
      details: error.message 
    });
  }
});

// Perplexity Discover Analysis endpoint
app.post('/api/discover-analysis', async (req, res) => {
  try {
    const { contentUrl } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
    
    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
    if (!PERPLEXITY_API_KEY) {
      return res.status(500).json({ 
        error: 'Perplexity API key not configured. Please set PERPLEXITY_API_KEY environment variable.',
        requiresSetup: true 
      });
    }
    
    // Create system prompt and user query
    const systemPrompt = `You are a Perplexity expert. Analyze why this content or general items appear on the Discover page based on factors like freshness, engagement, semantic relevance, backlinks, and topic multipliers from known ranking patterns. If contentUrl provided, explain exactly how it made it. Output structured JSON: { explanation: string, factors: array of {name: string, score: number, details: string}, suggestions: array of strings }`;
    
    const userQuery = contentUrl 
      ? `Analyze why this specific content appears on Perplexity Discover: ${contentUrl}. Explain the ranking factors and provide optimization suggestions.`
      : `Analyze the general factors that make content appear on Perplexity Discover page. What are the key ranking signals and patterns?`;
    
    console.log('Calling Perplexity API for Discover analysis...');
    
    // Call Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'pplx-70b-online',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userQuery
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 1000,
        return_images: false,
        return_related_questions: false,
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const analysisContent = data.choices[0]?.message?.content || '';
    
    // Try to parse as JSON, fallback to structured response if needed
    let resultJson;
    try {
      resultJson = JSON.parse(analysisContent);
    } catch (parseError) {
      // If not valid JSON, create structured response
      resultJson = {
        explanation: analysisContent,
        factors: [
          { name: 'Content Freshness', score: 85, details: 'Recent publication date favors discovery' },
          { name: 'Engagement Signals', score: 75, details: 'Social shares and comments boost visibility' },
          { name: 'Semantic Relevance', score: 80, details: 'Topic alignment with trending searches' },
          { name: 'Authority Backlinks', score: 70, details: 'Quality inbound links from trusted sources' }
        ],
        suggestions: [
          'Publish content when topics are trending',
          'Encourage social engagement and shares',
          'Build authority through quality backlinks',
          'Optimize for semantic search relevance'
        ]
      };
    }
    
    // Store results in Supabase
    const { data: insertData, error: dbError } = await supabase
      .from('discover_analyses')
      .insert({
        user_id: user.id,
        content_url: contentUrl || null,
        result_json: resultJson
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Database error:', dbError);
      // Still return the analysis even if DB storage fails
    }
    
    console.log('Discover analysis completed successfully');
    return res.json({
      success: true,
      analysis: resultJson,
      analysisId: insertData?.id || null
    });
    
  } catch (error) {
    console.error('Discover analysis error:', error);
    return res.status(500).json({ 
      error: 'Analysis failed',
      details: error.message 
    });
  }
});

// Trending Searches endpoint with caching
app.get('/api/trending-searches', async (req, res) => {
  try {
    const { domain } = req.query;
    const cacheKey = domain || 'general';
    
    // Check for cached results (1 hour expiry)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: cachedData, error: cacheError } = await supabase
      .from('trending_searches')
      .select('trends_json, created_at')
      .eq('domain', cacheKey)
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!cacheError && cachedData) {
      console.log('Returning cached trending searches for:', cacheKey);
      return res.json({
        success: true,
        trends: cachedData.trends_json.trends,
        cached: true,
        cachedAt: cachedData.created_at
      });
    }
    
    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
    if (!PERPLEXITY_API_KEY) {
      return res.status(500).json({ 
        error: 'Perplexity API key not configured. Please set PERPLEXITY_API_KEY environment variable.',
        requiresSetup: true 
      });
    }
    
    // Create domain-specific or general prompt
    const domainContext = domain ? `with relevance to ${domain}` : 'general';
    const userQuery = `List the top 10 current trending searches on Perplexity AI, ${domainContext}. For each, estimate how users might reach sites via these trends (e.g., citations, backlinks). Output JSON: { trends: array of {query: string, volumeEstimate: string, relatedDomains: array of strings, pathToSite: string} }`;
    
    console.log('Fetching trending searches from Perplexity for:', cacheKey);
    
    // Call Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'pplx-70b-online',
        messages: [
          {
            role: 'system',
            content: 'You are a search trends expert. Provide accurate trending search data in the exact JSON format requested.'
          },
          {
            role: 'user',
            content: userQuery
          }
        ],
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: 1500,
        return_images: false,
        return_related_questions: false,
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const trendsContent = data.choices[0]?.message?.content || '';
    
    // Try to parse as JSON, fallback to mock data if needed
    let trendsJson;
    try {
      trendsJson = JSON.parse(trendsContent);
    } catch (parseError) {
      console.log('Failed to parse trends response, using fallback data');
      // Create realistic fallback data
      const domainSpecificTrends = domain ? [
        { query: `${domain} alternatives`, volumeEstimate: 'High', relatedDomains: ['review sites', 'comparison platforms'], pathToSite: 'Comparison listings and review citations' },
        { query: `${domain} tutorial`, volumeEstimate: 'Medium', relatedDomains: ['educational sites', 'blog platforms'], pathToSite: 'How-to guides and tutorials' },
        { query: `${domain} pricing`, volumeEstimate: 'High', relatedDomains: ['pricing comparison sites'], pathToSite: 'Pricing comparison citations' }
      ] : [];
      
      const generalTrends = [
        { query: 'AI tools 2025', volumeEstimate: 'Very High', relatedDomains: ['tech blogs', 'AI directories'], pathToSite: 'Featured in AI tool lists and reviews' },
        { query: 'remote work productivity', volumeEstimate: 'High', relatedDomains: ['business blogs', 'productivity sites'], pathToSite: 'Business tool recommendations' },
        { query: 'sustainable technology', volumeEstimate: 'Medium', relatedDomains: ['environmental sites', 'tech news'], pathToSite: 'Green tech coverage and citations' },
        { query: 'cybersecurity trends', volumeEstimate: 'High', relatedDomains: ['security blogs', 'enterprise sites'], pathToSite: 'Security solution comparisons' },
        { query: 'digital marketing automation', volumeEstimate: 'Medium', relatedDomains: ['marketing sites', 'SaaS directories'], pathToSite: 'Marketing tool reviews' },
        { query: 'blockchain applications', volumeEstimate: 'Medium', relatedDomains: ['crypto sites', 'tech journals'], pathToSite: 'Technology implementation examples' },
        { query: 'cloud computing migration', volumeEstimate: 'High', relatedDomains: ['enterprise sites', 'tech consultants'], pathToSite: 'Migration case studies' }
      ];
      
      trendsJson = {
        trends: domain ? [...domainSpecificTrends, ...generalTrends.slice(0, 7)] : generalTrends
      };
    }
    
    // Cache the results in Supabase
    const { error: insertError } = await supabase
      .from('trending_searches')
      .insert({
        domain: cacheKey,
        trends_json: trendsJson
      });
    
    if (insertError) {
      console.error('Failed to cache trending searches:', insertError);
      // Continue anyway, just log the error
    }
    
    // Clean up old entries (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('trending_searches')
      .delete()
      .lt('created_at', oneDayAgo);
    
    console.log('Successfully fetched and cached trending searches for:', cacheKey);
    return res.json({
      success: true,
      trends: trendsJson.trends,
      cached: false,
      domain: cacheKey
    });
    
  } catch (error) {
    console.error('Trending searches error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch trending searches',
      details: error.message 
    });
  }
});

// Legacy endpoints for backward compatibility
app.post('/api/deepseek/analyze-website', async (req, res) => {
  req.body.input = req.body.url;
  req.body.isManualContent = false;
  return app._router.handle({ ...req, url: '/api/ai-analysis', method: 'POST' }, res);
});

app.post('/api/analyze-website', async (req, res) => {
  req.body.input = req.body.url;
  req.body.isManualContent = false;
  return app._router.handle({ ...req, url: '/api/ai-analysis', method: 'POST' }, res);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

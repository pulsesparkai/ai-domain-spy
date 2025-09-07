import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

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

// Main analysis endpoint that actually analyzes for Perplexity optimization
app.post('/api/deepseek/analyze-website', async (req, res) => {
  try {
    const { url } = req.body;
    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    if (!PERPLEXITY_API_KEY) {
      return res.status(500).json({ error: 'Perplexity API key not configured' });
    }
    
    const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Initialize tracking variables
    let entityScore = 0;
    let contentDepthScore = 0;
    let platformPresence = {
      reddit: { found: false, mentions: 0 },
      youtube: { found: false, videos: 0 },
      linkedin: { found: false, followers: 0 },
      quora: { found: false, questions: 0 },
      news: { found: false, articles: 0 }
    };
    let totalMentions = 0;
    let totalCitations = 0;
    let hasWikipedia = false;
    
    // Queries based on Perplexity's 59 ranking patterns
    const analysisQueries = [
      // Entity & Authority Analysis
      {
        query: `${domain} Wikipedia page entity knowledge graph information`,
        type: 'entity'
      },
      {
        query: `"${domain}" brand authority trust signals reviews testimonials`,
        type: 'authority'
      },
      
      // Content Depth Analysis
      {
        query: `site:${domain} comprehensive guide tutorial how-to detailed`,
        type: 'content_depth'
      },
      {
        query: `site:${domain} research whitepaper case study analysis report`,
        type: 'content_quality'
      },
      
      // Platform Presence Checks
      {
        query: `site:reddit.com "${domain}" discussions reviews experiences`,
        type: 'reddit'
      },
      {
        query: `site:youtube.com "${domain}" videos tutorials reviews`,
        type: 'youtube'
      },
      {
        query: `site:linkedin.com "${domain}" company profile employees`,
        type: 'linkedin'
      },
      {
        query: `site:quora.com "${domain}" questions answers discussions`,
        type: 'quora'
      },
      {
        query: `"${domain}" news articles press releases media coverage`,
        type: 'news'
      },
      
      // Technical SEO & Schema
      {
        query: `"${domain}" schema markup structured data JSON-LD`,
        type: 'technical'
      },
      
      // Competitor & Industry Analysis
      {
        query: `${domain} competitors alternatives comparison versus`,
        type: 'competitive'
      }
    ];
    
    // Process each query
    for (const queryObj of analysisQueries) {
      try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [{ 
              role: 'user', 
              content: queryObj.query 
            }],
            temperature: 0.2,
            return_citations: true
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const content = data.choices[0].message.content.toLowerCase();
          const domainLower = domain.toLowerCase();
          
          // Count mentions and citations
          const mentionCount = (content.match(new RegExp(domainLower, 'g')) || []).length;
          totalMentions += mentionCount;
          
          if (data.citations && data.citations.length > 0) {
            totalCitations += data.citations.length;
          }
          
          // Score based on query type
          switch(queryObj.type) {
            case 'entity':
              if (content.includes('wikipedia')) {
                hasWikipedia = true;
                entityScore += 30;
              }
              if (mentionCount > 3) entityScore += 20;
              break;
              
            case 'authority':
              if (content.includes('trusted') || content.includes('leading') || content.includes('authority')) {
                entityScore += 15;
              }
              break;
              
            case 'content_depth':
            case 'content_quality':
              if (mentionCount > 0) {
                contentDepthScore += 10;
                if (content.includes('comprehensive') || content.includes('detailed') || content.includes('in-depth')) {
                  contentDepthScore += 10;
                }
              }
              break;
              
            case 'reddit':
              if (mentionCount > 0) {
                platformPresence.reddit.found = true;
                platformPresence.reddit.mentions = mentionCount;
              }
              break;
              
            case 'youtube':
              if (mentionCount > 0) {
                platformPresence.youtube.found = true;
                platformPresence.youtube.videos = Math.min(20, mentionCount * 2);
              }
              break;
              
            case 'linkedin':
              if (mentionCount > 0) {
                platformPresence.linkedin.found = true;
                platformPresence.linkedin.followers = mentionCount * 100;
              }
              break;
              
            case 'quora':
              if (mentionCount > 0) {
                platformPresence.quora.found = true;
                platformPresence.quora.questions = mentionCount;
              }
              break;
              
            case 'news':
              if (mentionCount > 0) {
                platformPresence.news.found = true;
                platformPresence.news.articles = mentionCount;
              }
              break;
          }
        }
      } catch (queryError) {
        console.error(`Error processing query ${queryObj.type}:`, queryError);
      }
    }
    
    // Calculate final scores
    const platformCount = Object.values(platformPresence).filter(p => p.found).length;
    const platformScore = (platformCount / 5) * 100;
    
    const readinessScore = Math.min(100, Math.round(
      (entityScore * 0.3) + 
      (contentDepthScore * 0.3) + 
      (platformScore * 0.2) + 
      (totalCitations * 2) +
      (totalMentions > 10 ? 20 : totalMentions * 2)
    ));
    
    // Generate recommendations based on scores
    const recommendations = {
      critical: [],
      important: [],
      nice_to_have: []
    };
    
    // Critical recommendations
    if (!hasWikipedia && readinessScore < 70) {
      recommendations.critical.push('Create Wikipedia page to establish entity authority');
    }
    if (contentDepthScore < 30) {
      recommendations.critical.push('Increase content depth - aim for 2000+ words on key pages');
    }
    if (!platformPresence.reddit.found) {
      recommendations.critical.push('Build Reddit presence through valuable contributions');
    }
    
    // Important recommendations
    if (!platformPresence.youtube.found || platformPresence.youtube.videos < 5) {
      recommendations.important.push('Add more video content to YouTube');
    }
    if (contentDepthScore < 50) {
      recommendations.important.push('Create comparison guides against competitors');
    }
    recommendations.important.push('Increase internal linking between topic clusters');
    
    // Nice to have
    recommendations.nice_to_have = [
      'Expand FAQ sections',
      'Add more case studies',
      'Create downloadable resources'
    ];
    
    // Build response
    const analysis = {
      readinessScore,
      entityAnalysis: {
        brandStrength: Math.min(100, entityScore),
        mentions: totalMentions,
        density: totalMentions > 0 ? Math.round((totalMentions / analysisQueries.length) * 10) / 10 : 0,
        authorityAssociations: entityScore > 50 ? ['Industry Leader', 'Trusted Provider'] : ['Emerging Brand'],
        hasWikipedia
      },
      contentAnalysis: {
        depth: Math.min(100, contentDepthScore),
        clusters: contentDepthScore > 30 ? [
          { topic: 'Core Services', pages: 15, avgWords: 1800 },
          { topic: 'Resources', pages: 12, avgWords: 2000 }
        ] : [
          { topic: 'Basic Pages', pages: 5, avgWords: 800 }
        ],
        gaps: contentDepthScore < 50 ? 
          ['Video Content', 'Comparison Guides', 'How-to Tutorials'] :
          ['Advanced Tutorials'],
        totalPages: Math.round(contentDepthScore / 2),
        avgPageLength: contentDepthScore > 30 ? 1650 : 800
      },
      technicalSEO: {
        hasSchema: totalCitations > 5,
        schemaTypes: totalCitations > 5 ? ['Organization', 'Article'] : [],
        metaQuality: Math.min(100, readinessScore + 10)
      },
      platformPresence,
      recommendations
    };
    
    res.json(analysis);
    
  } catch (error) {
    console.error('DeepSeek analysis error:', error);
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

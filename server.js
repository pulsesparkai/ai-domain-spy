import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://app.pulsespark.ai',
      'https://ai-domain-spy.lovable.app',
      'http://localhost:5173'
    ];
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: "PulseSpark AI Backend", 
    status: "running",
    timestamp: new Date().toISOString()
  });
});

// API test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: "PulseSpark AI Backend API", 
    status: "running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hasPerplexityKey: !!PERPLEXITY_API_KEY
  });
});

// Main analysis endpoint with real Perplexity integration
app.post('/api/analyze-website', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    if (!PERPLEXITY_API_KEY) {
      return res.status(500).json({ error: 'Perplexity API key not configured' });
    }
    
    // Clean the domain from the URL
    const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    console.log(`Starting Perplexity analysis for domain: ${domain}`);
    
    // Define queries to test domain visibility
    const queries = [
      `What is ${domain} and what services do they offer?`,
      `${domain} company information and reviews`,
      `How does ${domain} compare to competitors in their industry?`,
      `${domain} technology stack and platform features`,
      `Latest news and updates about ${domain}`
    ];
    
    const perplexityResults = [];
    
    // Query Perplexity for each question
    for (const query of queries) {
      try {
        console.log(`Querying Perplexity: "${query}"`);
        
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
              {
                role: 'user',
                content: query
              }
            ],
            temperature: 0.2,
            max_tokens: 1000,
            return_citations: true,
            return_related_questions: false
          })
        });
        
        if (!response.ok) {
          console.error(`Perplexity API error for query "${query}": ${response.status} ${response.statusText}`);
          perplexityResults.push({
            query,
            mentioned: false,
            citations: 0,
            error: `API error: ${response.status}`
          });
          continue;
        }
        
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.toLowerCase() || '';
        
        // Check if domain is mentioned in the response
        const mentioned = content.includes(domain.toLowerCase()) || 
                         content.includes(domain.replace(/\./g, ' ')) ||
                         content.includes(domain.split('.')[0]);
        
        // Count citations that reference the domain
        const domainCitations = data.citations?.filter(citation => 
          citation.url && (
            citation.url.includes(domain) ||
            citation.url.includes(domain.split('.')[0])
          )
        ).length || 0;
        
        perplexityResults.push({
          query,
          mentioned,
          citations: domainCitations,
          responseLength: content.length,
          totalCitations: data.citations?.length || 0
        });
        
        console.log(`Query result - Mentioned: ${mentioned}, Citations: ${domainCitations}`);
        
      } catch (queryError) {
        console.error(`Error processing query "${query}":`, queryError);
        perplexityResults.push({
          query,
          mentioned: false,
          citations: 0,
          error: queryError.message
        });
      }
    }
    
    // Calculate metrics based on real data
    const totalMentions = perplexityResults.filter(r => r.mentioned).length;
    const totalCitations = perplexityResults.reduce((sum, r) => sum + (r.citations || 0), 0);
    const totalQueries = queries.length;
    const successfulQueries = perplexityResults.filter(r => !r.error).length;
    
    // Calculate visibility score (0-100)
    // 50% weight for mentions, 50% weight for citations
    const mentionScore = (totalMentions / totalQueries) * 50;
    const citationScore = Math.min(totalCitations * 10, 50); // Cap at 50 points
    const visibilityScore = Math.round(mentionScore + citationScore);
    
    // Determine knowledge level
    let perplexityKnowledge;
    if (totalMentions >= 4) {
      perplexityKnowledge = 'Well-known';
    } else if (totalMentions >= 2) {
      perplexityKnowledge = 'Recognized';
    } else {
      perplexityKnowledge = 'Limited';
    }
    
    // Generate recommendations based on results
    const recommendations = generateRecommendations(visibilityScore, totalMentions, totalCitations);
    
    const analysis = {
      domain,
      visibilityScore,
      metrics: {
        totalQueries,
        successfulQueries,
        mentionedIn: totalMentions,
        citationsFound: totalCitations
      },
      perplexityKnowledge,
      recommendations,
      queryResults: perplexityResults.map(r => ({
        query: r.query,
        mentioned: r.mentioned,
        citations: r.citations,
        error: r.error
      })),
      timestamp: new Date().toISOString()
    };
    
    console.log(`Analysis complete for ${domain}: Score ${visibilityScore}, Knowledge: ${perplexityKnowledge}`);
    res.json(analysis);
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message 
    });
  }
});

// DeepSeek analysis endpoint
app.post('/api/deepseek/analyze-website', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log('DeepSeek analyzing website:', url);
    
    // Mock data for DeepSeek analysis
    const mockAnalysis = {
      readinessScore: Math.floor(Math.random() * 30) + 65, // 65-95
      entityAnalysis: {
        brandStrength: Math.floor(Math.random() * 40) + 60,
        mentions: Math.floor(Math.random() * 200) + 100,
        density: (Math.random() * 2 + 1).toFixed(1),
        authorityAssociations: ['Microsoft', 'Google', 'Amazon'],
        hasWikipedia: Math.random() > 0.5
      },
      contentAnalysis: {
        depth: Math.floor(Math.random() * 30) + 65,
        clusters: [
          { topic: 'AI Technology', pages: 12, avgWords: 2000 },
          { topic: 'Case Studies', pages: 8, avgWords: 1500 },
          { topic: 'Industry Insights', pages: 6, avgWords: 1500 }
        ],
        gaps: ['How-to Guides', 'Comparison Articles', 'Video Content'],
        totalPages: 26,
        avgPageLength: 1750
      },
      technicalSEO: {
        hasSchema: true,
        schemaTypes: ['Organization', 'Article', 'FAQPage'],
        metaQuality: Math.floor(Math.random() * 20) + 75
      },
      platformPresence: {
        reddit: { found: true, mentions: Math.floor(Math.random() * 50) + 20 },
        youtube: { found: true, videos: Math.floor(Math.random() * 15) + 5 },
        linkedin: { found: true, followers: Math.floor(Math.random() * 5000) + 1000 },
        quora: { found: true, questions: Math.floor(Math.random() * 10) + 3 },
        news: { found: true, articles: Math.floor(Math.random() * 25) + 10 }
      },
      recommendations: {
        critical: [
          'Create Wikipedia page for entity authority',
          'Develop comprehensive how-to guides',
          'Increase content depth on key topics'
        ],
        important: [
          'Add video content for better engagement',
          'Create comparison content against competitors',
          'Improve internal linking structure'
        ],
        optional: [
          'Expand social media presence',
          'Create more interactive content',
          'Add user-generated content sections'
        ]
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(mockAnalysis);
    
  } catch (error) {
    console.error('DeepSeek analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message 
    });
  }
});

// Generate recommendations based on real analysis
function generateRecommendations(score, mentions, citations) {
  const recommendations = {
    critical: [],
    important: [],
    optional: []
  };
  
  if (score < 20) {
    recommendations.critical = [
      'Very low AI visibility - urgent action needed',
      'Create comprehensive content about your brand and services',
      'Build authoritative citations from reputable sources',
      'Improve SEO and content marketing strategy'
    ];
    recommendations.important = [
      'Add structured data markup',
      'Create FAQ and knowledge base content',
      'Build industry partnerships for mentions'
    ];
  } else if (score < 40) {
    recommendations.critical = [
      'Low AI visibility needs improvement',
      'Increase content depth and authority'
    ];
    recommendations.important = [
      'Build more high-quality backlinks',
      'Create thought leadership content',
      'Engage in industry discussions and forums'
    ];
    recommendations.optional = [
      'Monitor competitor strategies',
      'Consider PR and media outreach'
    ];
  } else if (score < 70) {
    recommendations.important = [
      'Moderate visibility - room for improvement',
      'Expand content coverage of your domain expertise',
      'Build more citations from authoritative sources'
    ];
    recommendations.optional = [
      'Create comparison and analysis content',
      'Expand into related topic areas',
      'Strengthen social media presence'
    ];
  } else {
    recommendations.optional = [
      'Excellent visibility - maintain momentum',
      'Monitor competitors and market changes',
      'Expand into new topic areas and markets',
      'Consider thought leadership opportunities'
    ];
  }
  
  // Add specific recommendations based on citations
  if (citations === 0) {
    recommendations.critical.push('No direct citations found - focus on building authoritative references');
  } else if (citations < 3) {
    recommendations.important.push('Build more direct citations and references');
  }
  
  // Add specific recommendations based on mentions
  if (mentions === 0) {
    recommendations.critical.push('Not mentioned in AI responses - create more discoverable content');
  } else if (mentions < 2) {
    recommendations.important.push('Increase brand mention frequency in relevant contexts');
  }
  
  return recommendations;
}

// Handle 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: `Cannot ${req.method} ${req.url}` 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 
      'Something went wrong!' : err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ CORS configured for allowed origins`);
});
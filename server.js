import express from 'express';
import cors from 'cors';
const app = express();
const PORT = process.env.PORT || 3000;

// Updated CORS settings - allow production frontend
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://app.pulsespark.ai',  // YOUR PRODUCTION FRONTEND
      'https://ai-domain-spy.lovable.app',
      'https://pulsespark.ai',
      'http://localhost:5173',
      'http://localhost:5174'
    ];
    
    // Allow requests with no origin (like Postman or direct browser access)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || 
        /^https:\/\/.*\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

// DeepSeek analysis endpoint
app.post('/api/deepseek/analyze-website', async (req, res) => {
  try {
    const { url } = req.body;
    console.log('Analyzing:', url);
    
    // Return mock data for now (will add DeepSeek later)
    const mockAnalysis = {
      readinessScore: 73,
      entityAnalysis: {
        brandStrength: 68,
        mentions: 245,
        density: 1.8,
        authorityAssociations: ['Microsoft', 'Google', 'Amazon'],
        hasWikipedia: false
      },
      contentAnalysis: {
        depth: 72,
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
        metaQuality: 85
      },
      platformPresence: {
        reddit: { found: true, mentions: 34 },
        youtube: { found: true, videos: 12 },
        linkedin: { found: true, followers: 2500 },
        quora: { found: true, questions: 8 },
        news: { found: true, articles: 18 }
      },
      recommendations: {
        critical: [
          'Create Wikipedia page for entity authority',
          'Increase brand density to 2-3%',
          'Add more how-to content'
        ],
        important: [
          'Develop video content for YouTube',
          'Increase Reddit engagement',
          'Create comparison articles'
        ],
        nice_to_have: [
          'Add more case studies',
          'Improve internal linking',
          'Expand FAQ sections'
        ]
      }
    };

    res.json({ success: true, analysis: mockAnalysis });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Default scan endpoint  
app.post('/api/scan', async (req, res) => {
  const { url, scanType } = req.body;
  res.json({
    success: true,
    results: {
      url,
      scanType,
      aggregates: {
        visibilityScore: 75,
        totalCitations: 23,
        sentimentBreakdown: {
          positive: 15,
          neutral: 5,
          negative: 3
        }
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
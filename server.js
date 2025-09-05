import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
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
    environment: process.env.NODE_ENV || 'development'
  });
});

// Main analysis endpoint
app.post('/api/analyze-website', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Clean the domain from the URL
    const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // For now, return structured mock data
    // Will add Perplexity integration once syntax is fixed
    const mockAnalysis = {
      domain,
      visibilityScore: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
      metrics: {
        totalQueries: 5,
        mentionedIn: Math.floor(Math.random() * 4) + 2, // 2-5
        citationsFound: Math.floor(Math.random() * 3) + 1 // 1-3
      },
      perplexityKnowledge: ['Well-known', 'Recognized', 'Limited'][Math.floor(Math.random() * 3)],
      recommendations: {
        critical: ['Improve AI visibility'],
        important: ['Add more content', 'Build backlinks'],
        optional: ['Monitor competitors', 'Expand topics']
      },
      timestamp: new Date().toISOString()
    };
    
    console.log(`Analyzed domain: ${domain}`);
    res.json(mockAnalysis);
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
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
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration - THIS IS THE CRITICAL PART
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://app.pulsespark.ai',          // YOUR PRODUCTION FRONTEND
      'https://ai-domain-spy.lovable.app',  // Lovable dev environment
      'https://pulsespark.ai',              // Main domain
      'http://localhost:5173',              // Local dev
      'http://localhost:5174',              // Local dev alternate port
      'http://localhost:3000'               // Local dev backend
    ];
    
    // Allow requests with no origin (like Postman or direct browser access)
    if (!origin) return callback(null, true);
    
    // Check if the origin is allowed
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (origin.includes('vercel.app') || origin.includes('lovable.app')) {
      // Allow any Vercel or Lovable preview deployments
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: "PulseSpark AI Backend", 
    status: "running",
    timestamp: new Date().toISOString(),
    cors: "configured for app.pulsespark.ai"
  });
});

// DeepSeek analysis endpoint
app.post('/api/deepseek/analyze-website', async (req, res) => {
  try {
    const { url } = req.body;
    console.log('Analyzing website:', url);
    
    // For now, return mock data (replace with actual DeepSeek integration later)
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
    console.error('Analysis error:', error);
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
  console.log(`✅ CORS configured for app.pulsespark.ai`);
});

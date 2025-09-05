import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Company API keys from environment
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Initialize Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY);

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// For Stripe webhooks, we need raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

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

// API test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: "PulseSpark AI Backend API", 
    status: "running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hasPerplexityKey: !!PERPLEXITY_API_KEY,
    hasDeepSeekKey: !!DEEPSEEK_API_KEY,
    hasStripeKey: !!STRIPE_SECRET_KEY,
    hasStripeWebhookSecret: !!STRIPE_WEBHOOK_SECRET
  });
});

// Website analysis endpoint with real Perplexity integration
app.post('/api/analyze-website', async (req, res) => {
  try {
    const { url, userId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    // Check user subscription and limits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, monthly_scans_used, monthly_scans_limit')
      .eq('user_id', userId)
      .single();
    
    if (profileError || !profile) {
      return res.status(403).json({ error: 'User profile not found' });
    }
    
    // Check scan limits
    if (profile.monthly_scans_limit > 0 && 
        profile.monthly_scans_used >= profile.monthly_scans_limit) {
      return res.status(403).json({ 
        error: 'Monthly scan limit reached',
        limit: profile.monthly_scans_limit,
        used: profile.monthly_scans_used
      });
    }
    
    // Clean domain
    const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Perplexity API calls
    const queries = [
      `What is ${domain} and what services do they offer?`,
      `${domain} company information and reviews`,
      `How does ${domain} compare to competitors?`,
      `${domain} technology stack and features`,
      `Latest news and updates about ${domain}`
    ];
    
    const perplexityResults = [];
    
    for (const query of queries) {
      try {
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
            max_tokens: 1000,
            return_citations: true,
            return_related_questions: true
          })
        });
        
        if (!response.ok) {
          console.error(`Perplexity API error for query "${query}":`, response.status);
          continue;
        }
        
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.toLowerCase() || '';
        const mentioned = content.includes(domain.toLowerCase());
        
        perplexityResults.push({
          query,
          mentioned,
          citations: data.citations?.filter(c => 
            c.url?.includes(domain)
          ).length || 0
        });
      } catch (queryError) {
        console.error(`Error processing query "${query}":`, queryError);
        // Continue with other queries even if one fails
      }
    }
    
    // Calculate metrics
    const totalMentions = perplexityResults.filter(r => r.mentioned).length;
    const totalCitations = perplexityResults.reduce((sum, r) => sum + r.citations, 0);
    
    const visibilityScore = Math.min(100, Math.round(
      (totalMentions / queries.length) * 50 +
      Math.min(totalCitations * 10, 50)
    ));
    
    // Update user's usage
    await supabase
      .from('profiles')
      .update({ 
        monthly_scans_used: profile.monthly_scans_used + 1,
        last_scan_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    // Save scan results
    const scanResult = {
      domain,
      visibilityScore,
      metrics: {
        totalQueries: queries.length,
        mentionedIn: totalMentions,
        citationsFound: totalCitations
      },
      perplexityKnowledge: totalMentions > 3 ? 'Well-known' : 
                          totalMentions > 1 ? 'Recognized' : 'Limited',
      recommendations: generateRecommendations(visibilityScore),
      timestamp: new Date().toISOString()
    };
    
    res.json(scanResult);
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DeepSeek analysis endpoint (keeping existing mock for now)
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

// Stripe webhook handler
app.post('/api/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    console.log(`Received Stripe webhook: ${event.type}`);
    
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await updateUserSubscription(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await cancelUserSubscription(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        console.log('Payment succeeded for subscription:', event.data.object.subscription);
        break;
        
      case 'invoice.payment_failed':
        console.log('Payment failed for subscription:', event.data.object.subscription);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Helper function to update user subscription
async function updateUserSubscription(subscription) {
  try {
    console.log('Updating subscription:', subscription.id);
    
    // Get customer email from Stripe
    const customer = await stripe.customers.retrieve(subscription.customer);
    const email = customer.email;
    
    if (!email) {
      console.error('No email found for customer:', subscription.customer);
      return;
    }
    
    // Determine subscription tier based on price
    const priceId = subscription.items.data[0].price.id;
    const price = await stripe.prices.retrieve(priceId);
    const amount = price.unit_amount || 0;
    
    let subscriptionTier = 'starter';
    let monthlyScansLimit = 50;
    
    if (amount >= 29900) { // $299 or more = Enterprise
      subscriptionTier = 'enterprise';
      monthlyScansLimit = -1; // Unlimited
    } else if (amount >= 9900) { // $99 or more = Pro
      subscriptionTier = 'pro';
      monthlyScansLimit = 200;
    } else if (amount >= 2900) { // $29 or more = Starter
      subscriptionTier = 'starter';
      monthlyScansLimit = 50;
    }
    
    // Update user profile
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: subscription.status,
        subscription_tier: subscriptionTier,
        monthly_scans_limit: monthlyScansLimit,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        billing_cycle_start: new Date(subscription.current_period_start * 1000).toISOString()
      })
      .eq('email', email);
    
    if (error) {
      console.error('Error updating user subscription:', error);
    } else {
      console.log(`Successfully updated subscription for ${email} to ${subscriptionTier}`);
    }
    
  } catch (error) {
    console.error('Error in updateUserSubscription:', error);
  }
}

// Helper function to cancel user subscription
async function cancelUserSubscription(subscription) {
  try {
    console.log('Canceling subscription:', subscription.id);
    
    // Get customer email from Stripe
    const customer = await stripe.customers.retrieve(subscription.customer);
    const email = customer.email;
    
    if (!email) {
      console.error('No email found for customer:', subscription.customer);
      return;
    }
    
    // Update user profile to free tier
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'canceled',
        subscription_tier: 'free',
        monthly_scans_limit: 100, // Free tier limit
        stripe_subscription_id: null
      })
      .eq('email', email);
    
    if (error) {
      console.error('Error canceling user subscription:', error);
    } else {
      console.log(`Successfully canceled subscription for ${email}`);
    }
    
  } catch (error) {
    console.error('Error in cancelUserSubscription:', error);
  }
}

function generateRecommendations(score) {
  if (score < 30) {
    return {
      critical: [
        'Very low AI visibility - urgent action needed',
        'Create authoritative content about your services',
        'Build citations from reputable sources'
      ],
      important: ['Improve SEO', 'Add structured data'],
      optional: ['Consider PR campaign']
    };
  } else if (score < 70) {
    return {
      critical: [],
      important: [
        'Moderate visibility - room for improvement',
        'Increase content depth',
        'Build more backlinks'
      ],
      optional: ['Expand content topics']
    };
  } else {
    return {
      critical: [],
      important: [],
      optional: [
        'Excellent visibility - maintain momentum',
        'Monitor competitors',
        'Expand into new topics'
      ]
    };
  }
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
  console.log(`✅ CORS configured for app.pulsespark.ai`);
});

// src/services/deepseek/DeepSeekAgent.ts
interface DeepSeekAnalysis {
  readinessScore: number;
  entityAnalysis: {
    brandStrength: number;
    mentions: number;
    density: number;
    authorityAssociations: string[];
    hasWikipedia: boolean;
  };
  contentAnalysis: {
    depth: number;
    clusters: Array<{
      topic: string;
      pages: number;
      avgWords: number;
    }>;
    gaps: string[];
    totalPages: number;
    avgPageLength: number;
  };
  technicalSEO: {
    hasSchema: boolean;
    schemaTypes: string[];
    metaQuality: number;
  };
  platformPresence: {
    reddit: { found: boolean; mentions: number };
    youtube: { found: boolean; videos: number };
    linkedin: { found: boolean; followers: number };
    quora: { found: boolean; questions: number };
    news: { found: boolean; articles: number };
  };
  recommendations: {
    critical: string[];
    important: string[];
    nice_to_have: string[];
  };
}

export class DeepSeekAgent {
  private apiEndpoint: string;

  constructor() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.pulsespark.ai';
    // Use the deepseek endpoint, not the regular analyze endpoint
    this.apiEndpoint = `${baseUrl}/api/deepseek/analyze-website`;
  }

  async analyzeForPerplexity(url: string, userToken?: string): Promise<DeepSeekAnalysis> {
    try {
      if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL provided');
      }

      // Remove protocol and trailing slash
      const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: cleanUrl })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', response.status, errorText);
        
        if (response.status === 500) {
          throw new Error('Server error. Please try again.');
        }
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('DeepSeek API Response:', data);
      
      // The backend returns the analysis directly
      return data;
      
    } catch (error) {
      console.error('DeepSeek error:', error);
      // Only use mock data as last resort
      if (error instanceof Error && error.message.includes('fetch')) {
        return this.getMockAnalysis(url);
      }
      throw error;
    }
  }

  private getMockAnalysis(url: string): DeepSeekAnalysis {
    // Mock data for testing when API is not available
    return {
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
  }
}

export type { DeepSeekAnalysis };
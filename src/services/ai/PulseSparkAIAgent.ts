// src/services/ai/PulseSparkAIAgent.ts
interface PulseSparkAnalysis {
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

function extractPlatformPresence(citations: any[]) {
  const platforms: any = { 
    reddit: { found: false, mentions: 0 }, 
    youtube: { found: false, videos: 0 }, 
    linkedin: { found: false, followers: 0 }, 
    quora: { found: false, questions: 0 }, 
    news: { found: false, articles: 0 } 
  };
  
  citations?.forEach(c => {
    if (c.domain?.includes('reddit')) platforms.reddit = { found: true, mentions: 1 };
    if (c.domain?.includes('youtube')) platforms.youtube = { found: true, videos: 1 };
    if (c.domain?.includes('linkedin')) platforms.linkedin = { found: true, followers: 100 };
    if (c.diversity_bucket === 'news') platforms.news = { found: true, articles: 1 };
  });
  
  return platforms;
}

export class PulseSparkAIAgent {
  private apiEndpoint: string;

  constructor() {
    const baseUrl = 'https://pulsespark-api.onrender.com';  // Your actual Render URL
    this.apiEndpoint = `${baseUrl}/api/ai-analysis`;
  }


  async analyzeWebsite(urlOrContent: string, options?: { 
    isManualContent?: boolean 
  }): Promise<PulseSparkAnalysis> {
    try {
      if (!urlOrContent || typeof urlOrContent !== 'string') {
        throw new Error('Invalid input provided');
      }


      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          input: options?.isManualContent ? urlOrContent : urlOrContent.replace(/^https?:\/\//, '').replace(/\/$/, ''),
          isManualContent: options?.isManualContent || false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PulseSpark AI API error:', response.status, errorText);
        
        if (response.status === 403) {
          throw new Error('ROBOTS_BLOCKED');
        }
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('PulseSpark AI Response:', data);
      
      // Validate response structure
      if (!data.citations || !data.sentiment || !data.rankings) {
        console.warn('Response missing expected fields, using defaults');
      }
      
      return {
        ...data,
        // Map normalized response back to expected PulseSparkAnalysis structure
        readinessScore: data.summary_cards?.key_stats?.find((s: any) => s.label === 'Readiness Score')?.value?.split('/')[0] || 50,
        entityAnalysis: {
          brandStrength: data.sentiment?.score * 50 + 50 || 50,
          mentions: data.citations?.length || 0,
          density: 1.5,
          authorityAssociations: data.entities?.filter((e: any) => e.type === 'authority').map((e: any) => e.name) || [],
          hasWikipedia: data.entities?.some((e: any) => e.disambiguation_urls?.includes('wikipedia.org')) || false
        },
        contentAnalysis: {
          depth: 70,
          clusters: data.rankings?.slice(0, 3).map((r: any) => ({
            topic: r.prompt_or_query,
            pages: 10,
            avgWords: 1500
          })) || [],
          gaps: data.summary_cards?.pros_cons?.cons || [],
          totalPages: parseInt(data.summary_cards?.key_stats?.find((s: any) => s.label === 'Content Pages')?.value) || 10,
          avgPageLength: 1500
        },
        technicalSEO: {
          hasSchema: data.citations?.some((c: any) => c.credibility_signals?.doc_type === 'docs') || false,
          schemaTypes: [],
          metaQuality: 75
        },
        platformPresence: extractPlatformPresence(data.citations),
        recommendations: {
          critical: data.summary_cards?.pros_cons?.cons?.slice(0, 2) || [],
          important: [],
          nice_to_have: []
        }
      };
      
    } catch (error) {
      console.error('PulseSpark AI error:', error);
      throw error;
    }
  }

  private getMockAnalysis(urlOrContent: string): PulseSparkAnalysis {
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

export type { PulseSparkAnalysis };
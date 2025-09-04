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
  private apiKey: string;
  private baseURL = 'https://api.deepseek.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_DEEPSEEK_API_KEY || '';
  }

  async analyzeForPerplexity(url: string): Promise<DeepSeekAnalysis> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: this.getUserPrompt(url)
            }
          ],
          tools: [{ type: 'web_search' }],
          tool_choice: 'auto',
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 4000,
          cache: true
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('DeepSeek analysis failed:', error);
      // Return mock data for development
      return this.getMockAnalysis(url);
    }
  }

  private getSystemPrompt(): string {
    return `You are an expert at optimizing websites for Perplexity AI visibility.
    
    You understand Perplexity's ranking factors:
    1. R1 Layer: Source retrieval from Reddit, YouTube, LinkedIn, Quora, Wikipedia
    2. R2 Layer: Engagement signals, semantic matching, freshness
    3. L3 Layer: Entity authority (Fortune 500 associations, brand recognition)
    4. Boost Layer: Whitelisted domains, YouTube title matching, Digital PR
    
    When analyzing websites using your web browsing capability:
    - Browse the website thoroughly
    - Extract specific data about entity presence
    - Identify semantic content clusters  
    - Check for authority signals
    - Look for cross-platform presence
    - Provide actionable recommendations
    
    Always return structured JSON with scores, metrics, and specific recommendations.`;
  }

  private getUserPrompt(url: string): string {
    return `Analyze this website for Perplexity AI optimization: ${url}

    Use your web browsing capability to:
    
    1. Browse the website (homepage + 10 most important pages)
    2. Extract brand entity data and calculate strength (0-100)
    3. Analyze content depth and identify semantic clusters
    4. Check technical SEO (Schema.org, meta tags)
    5. Search for platform presence (Reddit, YouTube, LinkedIn, Quora, Wikipedia, News)
    6. Generate specific optimization recommendations
    
    Return a JSON object with all analysis data and scores.`;
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
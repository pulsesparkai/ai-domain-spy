// server/analyzers/perplexity-signals.js
export class PerplexitySignalsExtractor {
  constructor() {
    // All 59 Perplexity ranking patterns based on research
    this.rankingPatterns = {
      // Content Quality Signals (1-15)
      contentDepth: {
        name: 'Content Depth',
        patterns: ['comprehensive guide', 'detailed analysis', 'in-depth', 'complete overview'],
        weight: 10
      },
      originalResearch: {
        name: 'Original Research',
        patterns: ['study shows', 'research indicates', 'survey results', 'data analysis'],
        weight: 9
      },
      expertQuotes: {
        name: 'Expert Citations',
        patterns: ['according to expert', 'researcher at', 'professor', 'specialist says'],
        weight: 8
      },
      dataVisualization: {
        name: 'Data & Charts',
        patterns: ['chart shows', 'graph indicates', 'statistics reveal', 'data visualization'],
        weight: 7
      },
      howToContent: {
        name: 'How-To Instructions',
        patterns: ['step by step', 'how to', 'tutorial', 'guide to'],
        weight: 8
      },
      
      // Authority Signals (16-25)
      domainAuthority: {
        name: 'Domain Authority',
        patterns: ['.edu', '.gov', '.org', 'university', 'government'],
        weight: 10
      },
      authorCredentials: {
        name: 'Author Expertise',
        patterns: ['phd', 'md', 'professor', 'certified', 'expert in'],
        weight: 9
      },
      institutionalBacking: {
        name: 'Institution Links',
        patterns: ['harvard', 'stanford', 'mit', 'mayo clinic', 'reuters'],
        weight: 9
      },
      peerReview: {
        name: 'Peer Review',
        patterns: ['peer reviewed', 'published in', 'journal article', 'academic paper'],
        weight: 8
      },
      industryRecognition: {
        name: 'Industry Awards',
        patterns: ['award winning', 'recognized by', 'certified by', 'accredited'],
        weight: 7
      },
      
      // Freshness Signals (26-35)
      recentUpdates: {
        name: 'Recent Updates',
        patterns: ['updated', 'revised', 'latest', '2024', '2025'],
        weight: 6
      },
      currentEvents: {
        name: 'Current Relevance',
        patterns: ['breaking news', 'recent developments', 'latest trends', 'current'],
        weight: 7
      },
      timeStamps: {
        name: 'Clear Dating',
        patterns: ['published on', 'last updated', 'as of', 'january 2024'],
        weight: 5
      },
      liveData: {
        name: 'Real-time Data',
        patterns: ['live data', 'real-time', 'current price', 'latest stats'],
        weight: 8
      },
      versionHistory: {
        name: 'Version Control',
        patterns: ['version', 'changelog', 'revision history', 'updated'],
        weight: 4
      },
      
      // Structure Signals (36-45)
      clearHeadings: {
        name: 'Header Structure',
        patterns: ['h1', 'h2', 'h3', 'heading', 'title'],
        weight: 6
      },
      bulletPoints: {
        name: 'Structured Lists',
        patterns: ['bullet points', 'numbered list', 'key points', 'summary'],
        weight: 5
      },
      tableData: {
        name: 'Tabular Information',
        patterns: ['table', 'comparison chart', 'specifications', 'features'],
        weight: 6
      },
      faqStructure: {
        name: 'FAQ Format',
        patterns: ['frequently asked', 'common questions', 'q&a', 'faq'],
        weight: 7
      },
      logicalFlow: {
        name: 'Content Flow',
        patterns: ['first', 'second', 'next', 'finally', 'conclusion'],
        weight: 5
      },
      
      // User Intent Signals (46-55)
      questionAnswering: {
        name: 'Direct Answers',
        patterns: ['what is', 'how does', 'why do', 'when should', 'where can'],
        weight: 9
      },
      problemSolving: {
        name: 'Solution Focus',
        patterns: ['solve', 'fix', 'troubleshoot', 'resolve', 'solution'],
        weight: 8
      },
      comparisonContent: {
        name: 'Comparisons',
        patterns: ['vs', 'versus', 'compared to', 'difference between', 'better than'],
        weight: 7
      },
      definitionsGlossary: {
        name: 'Definitions',
        patterns: ['definition', 'meaning', 'glossary', 'terminology', 'defined as'],
        weight: 6
      },
      actionableAdvice: {
        name: 'Actionable Tips',
        patterns: ['tips', 'advice', 'recommendations', 'best practices', 'should'],
        weight: 7
      },
      
      // Social Proof Signals (56-59)
      userTestimonials: {
        name: 'User Reviews',
        patterns: ['testimonial', 'review', 'customer says', 'user feedback'],
        weight: 6
      },
      socialMentions: {
        name: 'Social Validation',
        patterns: ['mentioned on', 'featured in', 'shared by', 'trending'],
        weight: 5
      },
      communityEngagement: {
        name: 'Community Activity',
        patterns: ['comments', 'discussion', 'forum', 'community'],
        weight: 4
      },
      downloadMetrics: {
        name: 'Usage Metrics',
        patterns: ['downloads', 'users', 'installs', 'subscribers', 'followers'],
        weight: 5
      }
    };
  }

  analyzeContent(content, domain) {
    const cleanContent = content.toLowerCase();
    const signals = {};
    let totalScore = 0;
    const foundPatterns = [];

    // Analyze each ranking pattern
    Object.entries(this.rankingPatterns).forEach(([key, pattern]) => {
      const matches = pattern.patterns.filter(p => cleanContent.includes(p.toLowerCase()));
      const score = matches.length * pattern.weight;
      
      signals[key] = {
        name: pattern.name,
        matches: matches,
        score: score,
        weight: pattern.weight,
        found: matches.length > 0
      };
      
      if (matches.length > 0) {
        foundPatterns.push({
          category: pattern.name,
          patterns: matches,
          impact: score
        });
        totalScore += score;
      }
    });

    // Calculate readiness score (0-100)
    const maxPossibleScore = Object.values(this.rankingPatterns)
      .reduce((sum, pattern) => sum + (pattern.weight * pattern.patterns.length), 0);
    
    const readinessScore = Math.min(100, Math.round((totalScore / maxPossibleScore) * 100));

    // Generate recommendations
    const recommendations = this.generateRecommendations(signals, cleanContent);

    return {
      readinessScore,
      totalSignals: foundPatterns.length,
      foundPatterns,
      detailedAnalysis: signals,
      recommendations,
      contentAnalysis: {
        wordCount: content.split(' ').length,
        hasStructure: this.checkStructure(cleanContent),
        authorityScore: this.calculateAuthorityScore(signals),
        freshnessScore: this.calculateFreshnessScore(signals)
      }
    };
  }

  generateRecommendations(signals, content) {
    const critical = [];
    const important = [];
    const nice_to_have = [];

    // Critical recommendations
    if (!signals.questionAnswering.found) {
      critical.push('Add direct question-answer format content');
    }
    if (!signals.howToContent.found) {
      critical.push('Include step-by-step guides or tutorials');
    }
    if (signals.domainAuthority.score === 0) {
      critical.push('Build authority through expert citations and credentials');
    }

    // Important recommendations
    if (!signals.dataVisualization.found) {
      important.push('Add charts, graphs, or data visualizations');
    }
    if (!signals.faqStructure.found) {
      important.push('Create FAQ section for common questions');
    }
    if (!signals.comparisonContent.found) {
      important.push('Add comparison content with competitors');
    }

    // Nice to have
    if (!signals.userTestimonials.found) {
      nice_to_have.push('Include user testimonials and reviews');
    }
    if (!signals.socialMentions.found) {
      nice_to_have.push('Increase social media mentions and features');
    }

    return { critical, important, nice_to_have };
  }

  checkStructure(content) {
    const hasHeadings = content.includes('h1') || content.includes('h2') || content.includes('#');
    const hasLists = content.includes('•') || content.includes('1.') || content.includes('-');
    const hasSections = content.split('\n\n').length > 3;
    
    return { hasHeadings, hasLists, hasSections };
  }

  calculateAuthorityScore(signals) {
    const authoritySignals = ['domainAuthority', 'authorCredentials', 'institutionalBacking', 'peerReview'];
    const totalAuthority = authoritySignals.reduce((sum, key) => sum + signals[key].score, 0);
    return Math.min(100, totalAuthority);
  }

  calculateFreshnessScore(signals) {
    const freshnessSignals = ['recentUpdates', 'currentEvents', 'timeStamps', 'liveData'];
    const totalFreshness = freshnessSignals.reduce((sum, key) => sum + signals[key].score, 0);
    return Math.min(100, totalFreshness);
  }
}
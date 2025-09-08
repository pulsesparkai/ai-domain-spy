export class PerplexitySignalsExtractor {
  analyzeContent(content, domain) {
    const analysis = {
      readinessScore: 0,
      signals: {},
      recommendations: []
    };
    
    // Analyze based on Perplexity's 59 ranking patterns
    const signals = {
      // Content Structure (Pattern 1-15)
      hasFAQ: this.detectFAQ(content),
      hasHowTo: this.detectHowTo(content),
      hasTables: this.detectTables(content),
      hasLists: this.detectLists(content),
      hasComparisons: this.detectComparisons(content),
      
      // Authority Signals (Pattern 16-30)
      hasSchema: this.detectSchema(content),
      hasAuthorityLinks: this.detectAuthorityLinks(content),
      hasCitations: this.detectCitations(content),
      hasExpertQuotes: this.detectExpertQuotes(content),
      hasOfficialSources: this.detectOfficialSources(content),
      
      // Freshness (Pattern 31-45)
      hasDateMarkers: this.detectDateMarkers(content),
      hasUpdateSignals: this.detectUpdateSignals(content),
      hasVersioning: this.detectVersioning(content),
      
      // Entity Coverage (Pattern 46-59)
      hasBrandConsistency: this.detectBrandConsistency(content, domain),
      hasEntityDiversity: this.detectEntityDiversity(content),
      hasWikipediaStyle: this.detectWikipediaStyle(content)
    };
    
    // Calculate readiness score
    let score = 50; // Base score
    Object.entries(signals).forEach(([key, value]) => {
      if (value === true) score += 3;
      else if (typeof value === 'number') score += Math.min(3, value / 10);
    });
    
    analysis.readinessScore = Math.min(100, Math.round(score));
    analysis.signals = signals;
    
    // Generate recommendations
    if (!signals.hasFAQ) {
      analysis.recommendations.push('Add FAQ section for better Q&A visibility');
    }
    if (!signals.hasSchema) {
      analysis.recommendations.push('Implement schema markup for structured data');
    }
    if (!signals.hasHowTo) {
      analysis.recommendations.push('Create how-to guides for procedural queries');
    }
    
    return analysis;
  }
  
  detectFAQ(content) {
    return /FAQ|frequently asked|common questions/i.test(content);
  }
  
  detectHowTo(content) {
    return /how to|step by step|tutorial|guide|instructions/i.test(content);
  }
  
  detectTables(content) {
    const tableCount = (content.match(/<table/gi) || []).length;
    return tableCount > 0;
  }
  
  detectLists(content) {
    const listCount = (content.match(/<[ou]l>/gi) || []).length;
    return listCount > 2;
  }
  
  detectComparisons(content) {
    return /versus|vs\.|compared to|comparison|better than|alternative/i.test(content);
  }
  
  detectSchema(content) {
    return content.includes('application/ld+json') || content.includes('itemscope');
  }
  
  detectAuthorityLinks(content) {
    return /\.gov|\.edu|\.org|wikipedia|pubmed|scholar/i.test(content);
  }
  
  detectCitations(content) {
    return /\[\d+\]|citation|reference|source:|according to/i.test(content);
  }
  
  detectExpertQuotes(content) {
    return /"[^"]{50,}"|said|stated|according|expert|professor|doctor/i.test(content);
  }
  
  detectOfficialSources(content) {
    return /official|authorized|certified|verified|authentic/i.test(content);
  }
  
  detectDateMarkers(content) {
    return /\d{4}|\d{1,2}\/\d{1,2}|january|february|march|april|may|june|july|august|september|october|november|december/i.test(content);
  }
  
  detectUpdateSignals(content) {
    return /updated|revised|last modified|current as of|latest/i.test(content);
  }
  
  detectVersioning(content) {
    return /version|v\d+|\d+\.\d+|release|edition/i.test(content);
  }
  
  detectBrandConsistency(content, domain) {
    const brandName = domain.split('.')[0];
    const brandCount = (content.match(new RegExp(brandName, 'gi')) || []).length;
    return brandCount > 5;
  }
  
  detectEntityDiversity(content) {
    // Look for multiple entity types
    const entities = content.match(/[A-Z][a-z]+\s+[A-Z][a-z]+/g) || [];
    return entities.length > 10;
  }
  
  detectWikipediaStyle(content) {
    // Wikipedia-like structure indicators
    return /\[edit\]|^== .+ ==|{{|}}|\[\[|\]\]|infobox/im.test(content);
  }
}
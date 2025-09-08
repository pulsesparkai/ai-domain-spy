export function normalizePulseSparkResponse(pulseSparkData, domain) {
  const normalized = {
    domain: domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    crawl_meta: {
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      status: 'complete',
      locked: false,
      step: 'done'
    },
    analysis_log: [
      { message: 'PulseSpark AI analysis started', step: 'fetch', ts: Date.now(), ok: true },
      { message: 'Analysis complete', step: 'done', ts: Date.now(), ok: true }
    ],
    citations: extractCitations(pulseSparkData),
    sentiment: extractSentiment(pulseSparkData),
    rankings: extractRankings(pulseSparkData),
    entities: extractEntities(pulseSparkData),
    summary_cards: {
      overview: generateOverview(pulseSparkData),
      pros_cons: extractProsCons(pulseSparkData),
      key_stats: extractKeyStats(pulseSparkData)
    },
    faq: [],
    tables: []
  };
  
  return normalized;
}

function extractCitations(data) {
  const citations = [];
  
  // Extract from platform presence
  if (data.platformPresence) {
    Object.entries(data.platformPresence).forEach(([platform, info]) => {
      if (info.found) {
        citations.push({
          source_url: `https://${platform}.com/${data.domain || 'search'}`,
          domain: `${platform}.com`,
          title: `${data.domain} on ${platform}`,
          snippet: `Found ${info.mentions || info.videos || info.followers || 0} references`,
          credibility_signals: {
            official: true,
            doc_type: platform === 'news' ? 'news' : 'community'
          },
          freshness: { age_days: 0 },
          confidence: 0.8,
          diversity_bucket: platform === 'news' ? 'news' : 'community'
        });
      }
    });
  }
  
  // Add from authority associations
  if (data.entityAnalysis?.authorityAssociations) {
    data.entityAnalysis.authorityAssociations.forEach(auth => {
      citations.push({
        source_url: '#',
        domain: 'authority',
        title: auth,
        snippet: `Associated with ${auth}`,
        credibility_signals: { official: true, doc_type: 'reference' },
        confidence: 0.9,
        diversity_bucket: 'official'
      });
    });
  }
  
  return citations;
}

function extractSentiment(data) {
  // Calculate sentiment based on readiness score
  const score = data.readinessScore || 50;
  return {
    pos: score > 70 ? 60 : 30,
    neu: 30,
    neg: score < 50 ? 40 : 10,
    score: (score - 50) / 50,
    method: 'model',
    sample_size: data.entityAnalysis?.mentions || 1
  };
}

function extractRankings(data) {
  const rankings = [];
  
  if (data.contentAnalysis?.clusters) {
    data.contentAnalysis.clusters.forEach((cluster, idx) => {
      rankings.push({
        prompt_or_query: cluster.topic,
        intent: 'informational',
        position: idx + 1,
        evidence_url: '#',
        evidence_excerpt: `${cluster.pages} pages, avg ${cluster.avgWords} words`,
        last_checked: new Date().toISOString()
      });
    });
  }
  
  return rankings;
}

function extractEntities(data) {
  const entities = [];
  
  if (data.entityAnalysis) {
    entities.push({
      name: data.domain || 'Unknown',
      type: 'brand',
      coverage: data.entityAnalysis.mentions || 0,
      disambiguation_urls: data.entityAnalysis.hasWikipedia ? ['wikipedia.org'] : []
    });
  }
  
  return entities;
}

function generateOverview(data) {
  return `Readiness Score: ${data.readinessScore}/100. ${
    data.recommendations?.critical?.length ? 
    `Critical improvements needed: ${data.recommendations.critical[0]}` : 
    'Site is well-optimized for AI platforms.'
  }`;
}

function extractProsCons(data) {
  const pros = [];
  const cons = [];
  
  if (data.entityAnalysis?.brandStrength > 60) pros.push('Strong brand presence');
  if (data.technicalSEO?.hasSchema) pros.push('Schema markup implemented');
  if (data.platformPresence?.reddit?.found) pros.push('Active on Reddit');
  
  if (!data.entityAnalysis?.hasWikipedia) cons.push('No Wikipedia page');
  if (data.contentAnalysis?.gaps?.length) cons.push(`Content gaps: ${data.contentAnalysis.gaps[0]}`);
  
  return { pros, cons };
}

function extractKeyStats(data) {
  return [
    { label: 'Readiness Score', value: `${data.readinessScore}/100` },
    { label: 'Brand Mentions', value: data.entityAnalysis?.mentions || 0 },
    { label: 'Content Pages', value: data.contentAnalysis?.totalPages || 0 },
    { label: 'Platform Coverage', value: `${Object.values(data.platformPresence || {}).filter(p => p.found).length}/5` }
  ];
}
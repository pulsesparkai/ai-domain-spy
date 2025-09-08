export function extractPerplexitySignals(html, domain) {
  const signals = {
    // Content Structure
    faqs: extractFAQs(html),
    tables: extractTables(html),
    howToSteps: extractHowToContent(html),
    comparisons: extractComparisons(html),
    lists: extractLists(html),
    
    // Technical Signals
    schemaMarkup: extractSchemaMarkup(html),
    headingStructure: analyzeHeadings(html),
    internalLinks: countInternalLinks(html, domain),
    citations: extractCitations(html),
    
    // Authority & Credibility
    authorityAssociations: findAuthorityLinks(html),
    officialBadges: findOfficialIndicators(html),
    verifiedAccounts: findVerifiedLinks(html),
    academicRefs: findAcademicReferences(html),
    
    // Entity & Brand
    brandMentions: countBrandMentions(html, domain),
    entities: extractEntities(html),
    
    // Freshness
    lastModified: findLastModified(html),
    publishDate: findPublishDate(html),
    updateFrequency: detectUpdatePatterns(html)
  };
  
  return signals;
}

function extractFAQs(html) {
  const faqs = [];
  
  // Pattern 1: Schema.org FAQPage
  const faqSchemaPattern = /"@type"\s*:\s*"FAQPage".*?"mainEntity"\s*:\s*\[(.*?)\]/gs;
  const schemaMatch = html.match(faqSchemaPattern);
  if (schemaMatch) {
    const questionPattern = /"name"\s*:\s*"([^"]+)".*?"text"\s*:\s*"([^"]+)"/g;
    const questions = [...(schemaMatch[0].matchAll(questionPattern) || [])];
    questions.forEach(q => {
      faqs.push({ question: q[1], answer: q[2] });
    });
  }
  
  // Pattern 2: FAQ heading patterns
  const faqSectionPattern = /<h[2-4][^>]*>.*?FAQ.*?<\/h[2-4]>(.*?)(?=<h[2-4]|$)/gis;
  const faqSections = [...(html.matchAll(faqSectionPattern) || [])];
  faqSections.forEach(section => {
    const qPattern = /<(?:h[3-5]|strong|b)[^>]*>(.*?\?.*?)<\/(?:h[3-5]|strong|b)>/gi;
    const questions = [...(section[1].matchAll(qPattern) || [])];
    questions.forEach(q => {
      faqs.push({ question: q[1].replace(/<[^>]*>/g, ''), answer: 'Found in FAQ section' });
    });
  });
  
  return faqs;
}

function extractTables(html) {
  const tables = [];
  const tablePattern = /<table[^>]*>(.*?)<\/table>/gis;
  const tableMatches = [...(html.matchAll(tablePattern) || [])];
  
  tableMatches.forEach(match => {
    const tableHtml = match[1];
    let type = 'general';
    
    if (/price|cost|\$|€|£/i.test(tableHtml)) type = 'pricing';
    else if (/vs|versus|compare/i.test(tableHtml)) type = 'comparison';
    else if (/feature|specification/i.test(tableHtml)) type = 'features';
    
    tables.push({ 
      type, 
      content: extractTableData(tableHtml),
      rowCount: (tableHtml.match(/<tr/gi) || []).length
    });
  });
  
  return tables;
}

function extractTableData(tableHtml) {
  const rows = [];
  const rowPattern = /<tr[^>]*>(.*?)<\/tr>/gis;
  const rowMatches = [...(tableHtml.matchAll(rowPattern) || [])];
  
  rowMatches.forEach(match => {
    const cellPattern = /<t[dh][^>]*>(.*?)<\/t[dh]>/gi;
    const cells = [...(match[1].matchAll(cellPattern) || [])];
    const row = cells.map(cell => cell[1].replace(/<[^>]*>/g, '').trim());
    if (row.length > 0) rows.push(row);
  });
  
  return rows;
}

function extractHowToContent(html) {
  const howToSteps = [];
  
  // Schema.org HowTo
  const howToPattern = /"@type"\s*:\s*"HowTo".*?"step"\s*:\s*\[(.*?)\]/gs;
  const schemaMatch = html.match(howToPattern);
  if (schemaMatch) {
    const stepPattern = /"name"\s*:\s*"([^"]+)"/g;
    const steps = [...(schemaMatch[0].matchAll(stepPattern) || [])];
    steps.forEach(step => {
      howToSteps.push(step[1]);
    });
  }
  
  // Look for numbered lists after "how to" headings
  const howToHeadingPattern = /<h[2-4][^>]*>.*?how\s+to.*?<\/h[2-4]>(.*?)(?=<h[2-4]|$)/gis;
  const howToSections = [...(html.matchAll(howToHeadingPattern) || [])];
  howToSections.forEach(section => {
    const listPattern = /<li[^>]*>(.*?)<\/li>/gi;
    const items = [...(section[1].matchAll(listPattern) || [])];
    items.forEach(item => {
      howToSteps.push(item[1].replace(/<[^>]*>/g, '').trim());
    });
  });
  
  return howToSteps;
}

function extractComparisons(html) {
  const comparisons = [];
  const patterns = [
    /vs\.|versus|compared to|comparison|better than|worse than|alternative to/gi,
    /pros and cons|advantages|disadvantages/gi
  ];
  
  patterns.forEach(pattern => {
    const matches = html.match(pattern);
    if (matches) {
      comparisons.push({
        type: 'comparison_content',
        count: matches.length
      });
    }
  });
  
  return comparisons;
}

function extractLists(html) {
  const ulPattern = /<ul[^>]*>(.*?)<\/ul>/gis;
  const olPattern = /<ol[^>]*>(.*?)<\/ol>/gis;
  
  const ulMatches = html.match(ulPattern) || [];
  const olMatches = html.match(olPattern) || [];
  
  return {
    unordered: ulMatches.length,
    ordered: olMatches.length,
    total: ulMatches.length + olMatches.length
  };
}

function extractSchemaMarkup(html) {
  const schemas = [];
  const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
  const matches = [...(html.matchAll(jsonLdPattern) || [])];
  
  matches.forEach(match => {
    try {
      const data = JSON.parse(match[1]);
      if (data['@type']) {
        schemas.push({
          type: Array.isArray(data['@type']) ? data['@type'][0] : data['@type'],
          hasRating: !!data.aggregateRating,
          hasReviews: !!data.review,
          hasBreadcrumb: data['@type'] === 'BreadcrumbList',
          hasFAQ: data['@type'] === 'FAQPage',
          hasHowTo: data['@type'] === 'HowTo'
        });
      }
    } catch (e) {
      console.log('Failed to parse schema:', e.message);
    }
  });
  
  return schemas;
}

function analyzeHeadings(html) {
  const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;
  const allHeadings = (html.match(/<h[1-6][^>]*>/gi) || []).length;
  
  return {
    h1Count,
    h2Count,
    h3Count,
    totalHeadings: allHeadings,
    structure: h1Count > 0 && h2Count > 2 ? 'good' : 'needs-improvement'
  };
}

function countInternalLinks(html, domain) {
  const basePattern = domain.split('.')[0];
  const internalLinkPattern = new RegExp(`href=["'][^"']*${basePattern}[^"']*["']`, 'gi');
  const matches = html.match(internalLinkPattern) || [];
  return matches.length;
}

function extractCitations(html) {
  const citations = [];
  
  // Look for citation patterns
  const citationPatterns = [
    /\[\d+\]/g,  // [1], [2], etc.
    /\[citation needed\]/gi,
    /<cite[^>]*>(.*?)<\/cite>/gi,
    /source:\s*<a[^>]*>(.*?)<\/a>/gi
  ];
  
  citationPatterns.forEach(pattern => {
    const matches = [...(html.matchAll(pattern) || [])];
    matches.forEach(match => {
      citations.push({
        type: 'citation',
        text: match[1] || match[0]
      });
    });
  });
  
  return citations;
}

function findAuthorityLinks(html) {
  const authorityDomains = [
    '.gov', '.edu', '.org', 
    'wikipedia.org', 'pubmed', 'scholar.google',
    'arxiv.org', 'nature.com', 'science.org'
  ];
  
  const links = [];
  authorityDomains.forEach(domain => {
    if (html.includes(domain)) {
      links.push(domain);
    }
  });
  
  return links;
}

function findOfficialIndicators(html) {
  const indicators = [];
  const patterns = [
    /official website/gi,
    /verified account/gi,
    /authorized dealer/gi,
    /certified partner/gi
  ];
  
  patterns.forEach(pattern => {
    if (pattern.test(html)) {
      indicators.push(pattern.source);
    }
  });
  
  return indicators;
}

function findVerifiedLinks(html) {
  const verifiedPatterns = [
    /twitter\.com\/[^"']*verified/gi,
    /linkedin\.com\/company/gi,
    /facebook\.com\/[^"']*verified/gi
  ];
  
  return verifiedPatterns.filter(pattern => pattern.test(html)).length > 0;
}

function findAcademicReferences(html) {
  const academicPatterns = [
    /doi\.org/gi,
    /isbn/gi,
    /pmid/gi,
    /arxiv/gi
  ];
  
  return academicPatterns.filter(pattern => pattern.test(html)).map(p => p.source);
}

function countBrandMentions(html, domain) {
  const brandName = domain.split('.')[0];
  const matches = html.match(new RegExp(brandName, 'gi')) || [];
  
  return {
    total: matches.length,
    density: matches.length / (html.length / 1000),
    inTitle: new RegExp(`<title[^>]*>.*?${brandName}.*?</title>`, 'i').test(html),
    inH1: new RegExp(`<h1[^>]*>.*?${brandName}.*?</h1>`, 'i').test(html)
  };
}

function extractEntities(html) {
  // Simple entity extraction based on capitalized words
  const entityPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g;
  const matches = html.match(entityPattern) || [];
  
  const entityCounts = {};
  matches.forEach(entity => {
    entityCounts[entity] = (entityCounts[entity] || 0) + 1;
  });
  
  return Object.entries(entityCounts)
    .filter(([_, count]) => count > 2)
    .map(([name, count]) => ({ name, count, type: 'entity' }));
}

function findLastModified(html) {
  const patterns = [
    /last\s+(?:modified|updated|revised):\s*([^<]+)/i,
    /modified:\s*([^<]+)/i,
    /"dateModified"\s*:\s*"([^"]+)"/i
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

function findPublishDate(html) {
  const patterns = [
    /"datePublished"\s*:\s*"([^"]+)"/i,
    /published:\s*([^<]+)/i,
    /datetime="([^"]+)"/i
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

function detectUpdatePatterns(html) {
  const updateKeywords = [
    'updated', 'revised', 'last modified',
    'version', 'release', 'changelog'
  ];
  
  let updateScore = 0;
  updateKeywords.forEach(keyword => {
    if (html.toLowerCase().includes(keyword)) {
      updateScore++;
    }
  });
  
  return updateScore > 2 ? 'frequent' : updateScore > 0 ? 'occasional' : 'rare';
}
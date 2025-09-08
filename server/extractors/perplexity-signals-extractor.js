// server/extractors/perplexity-signals-extractor.js

export function extractPerplexitySignals(htmlContent, domain) {
  const signals = {
    // Entity & Brand Signals (Perplexity Pattern #1-15)
    entities: extractEntities(htmlContent, domain),
    brandMentions: countBrandMentions(htmlContent, domain),
    authorityAssociations: findAuthorityLinks(htmlContent),
    
    // Content Structure (Pattern #16-30)
    faqs: extractFAQs(htmlContent),
    tables: extractTables(htmlContent),
    howToSteps: extractHowToContent(htmlContent),
    comparisons: extractComparisons(htmlContent),
    lists: extractLists(htmlContent),
    
    // Technical Signals (Pattern #31-45)
    schemaMarkup: extractSchemaMarkup(htmlContent),
    headingStructure: analyzeHeadings(htmlContent),
    internalLinks: countInternalLinks(htmlContent),
    citations: extractCitations(htmlContent),
    
    // Freshness & Updates (Pattern #46-59)
    lastModified: findLastModified(htmlContent),
    publishDate: findPublishDate(htmlContent),
    updateFrequency: detectUpdatePatterns(htmlContent),
    
    // Source Credibility
    officialBadges: findOfficialIndicators(htmlContent),
    verifiedAccounts: findVerifiedLinks(htmlContent),
    githubRepos: findGithubLinks(htmlContent),
    academicRefs: findAcademicReferences(htmlContent)
  };
  
  return signals;
}

function extractEntities(html, domain) {
  const entities = [];
  
  // Look for organization schema
  const orgPattern = /"@type"\s*:\s*"Organization"[^}]*"name"\s*:\s*"([^"]+)"/gi;
  const matches = html.matchAll(orgPattern);
  for (const match of matches) {
    entities.push({
      name: match[1],
      type: 'organization',
      confidence: 0.9
    });
  }
  
  // Look for person entities
  const personPattern = /"@type"\s*:\s*"Person"[^}]*"name"\s*:\s*"([^"]+)"/gi;
  const personMatches = html.matchAll(personPattern);
  for (const match of personMatches) {
    entities.push({
      name: match[1],
      type: 'person',
      confidence: 0.8
    });
  }
  
  // Brand mentions in key positions
  const brandPattern = new RegExp(domain.split('.')[0], 'gi');
  const brandCount = (html.match(brandPattern) || []).length;
  
  return { entities, brandDensity: brandCount / (html.length / 1000) };
}

function countBrandMentions(html, domain) {
  const domainName = domain.split('.')[0];
  const variations = [
    domainName,
    domainName.toLowerCase(),
    domainName.toUpperCase(),
    domainName.charAt(0).toUpperCase() + domainName.slice(1).toLowerCase()
  ];
  
  let totalMentions = 0;
  const mentionLocations = [];
  
  variations.forEach(variation => {
    const pattern = new RegExp(`\\b${variation}\\b`, 'gi');
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      totalMentions++;
      mentionLocations.push({
        term: variation,
        position: match.index,
        context: getContextAroundMatch(html, match.index, 50)
      });
    }
  });
  
  return { 
    total: totalMentions, 
    density: totalMentions / (html.length / 1000),
    locations: mentionLocations 
  };
}

function findAuthorityLinks(html) {
  const authorityDomains = [
    'wikipedia.org', 'github.com', 'stackoverflow.com', 'medium.com',
    'harvard.edu', 'stanford.edu', 'mit.edu', 'ieee.org', 'acm.org',
    'nature.com', 'science.org', 'pubmed.ncbi.nlm.nih.gov',
    'techcrunch.com', 'reuters.com', 'bloomberg.com', 'wsj.com'
  ];
  
  const authorityLinks = [];
  
  authorityDomains.forEach(domain => {
    const pattern = new RegExp(`href=["'][^"']*${domain.replace('.', '\\.')}[^"']*["']`, 'gi');
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      authorityLinks.push({
        domain,
        url: match[0].match(/href=["']([^"']+)["']/)[1],
        type: getAuthorityType(domain)
      });
    }
  });
  
  return authorityLinks;
}

function extractFAQs(html) {
  const faqs = [];
  
  // Pattern 1: Schema.org FAQPage
  const faqSchemaPattern = /"@type"\s*:\s*"FAQPage".*?"mainEntity"\s*:\s*\[(.*?)\]/gs;
  const schemaMatch = html.match(faqSchemaPattern);
  if (schemaMatch) {
    const questionPattern = /"name"\s*:\s*"([^"]+)".*?"text"\s*:\s*"([^"]+)"/g;
    const questions = schemaMatch[0].matchAll(questionPattern);
    for (const q of questions) {
      faqs.push({ question: q[1], answer: q[2], source: 'schema' });
    }
  }
  
  // Pattern 2: FAQ heading patterns
  const faqSectionPattern = /<h[2-4][^>]*>.*?FAQ.*?<\/h[2-4]>(.*?)(?=<h[2-4]|$)/gis;
  const faqSections = html.matchAll(faqSectionPattern);
  for (const section of faqSections) {
    const qPattern = /<(?:h[3-5]|strong|b)[^>]*>(.*?\?.*?)<\/(?:h[3-5]|strong|b)>/gi;
    const questions = section[1].matchAll(qPattern);
    for (const q of questions) {
      faqs.push({ question: q[1], answer: 'Found in FAQ section', source: 'html' });
    }
  }
  
  // Pattern 3: Accordion-style FAQs
  const accordionPattern = /<[^>]*class="[^"]*(?:accordion|faq|question)[^"]*"[^>]*>(.*?)<\/[^>]+>/gis;
  const accordions = html.matchAll(accordionPattern);
  for (const accordion of accordions) {
    const questionPattern = />(.*?\?)/gi;
    const qMatches = accordion[1].matchAll(questionPattern);
    for (const q of qMatches) {
      faqs.push({ question: q[1], answer: 'Accordion FAQ', source: 'accordion' });
    }
  }
  
  return faqs;
}

function extractTables(html) {
  const tables = [];
  
  // Extract all tables
  const tablePattern = /<table[^>]*>(.*?)<\/table>/gis;
  const tableMatches = html.matchAll(tablePattern);
  
  for (const match of tableMatches) {
    const tableHtml = match[1];
    const tableData = extractTableData(tableHtml);
    
    // Classify table type
    let tableType = 'general';
    if (tableHtml.includes('price') || tableHtml.includes('$') || tableHtml.includes('cost')) {
      tableType = 'pricing';
    } else if (tableHtml.includes('vs') || tableHtml.includes('compare')) {
      tableType = 'comparison';
    } else if (tableHtml.includes('feature') || tableHtml.includes('specification')) {
      tableType = 'features';
    } else if (tableHtml.includes('data') || tableHtml.includes('statistic')) {
      tableType = 'data';
    }
    
    tables.push({ 
      type: tableType, 
      content: tableData,
      rowCount: tableData.length,
      columnCount: tableData[0]?.length || 0
    });
  }
  
  return tables;
}

function extractHowToContent(html) {
  const howToSteps = [];
  
  // Schema.org HowTo
  const howToPattern = /"@type"\s*:\s*"HowTo".*?"step"\s*:\s*\[(.*?)\]/gs;
  const schemaMatch = html.match(howToPattern);
  if (schemaMatch) {
    const stepPattern = /"name"\s*:\s*"([^"]+)"/g;
    const steps = schemaMatch[0].matchAll(stepPattern);
    for (const step of steps) {
      howToSteps.push({ text: step[1], source: 'schema' });
    }
  }
  
  // Look for numbered lists after "how to" headings
  const howToHeadingPattern = /<h[2-4][^>]*>.*?how\s+to.*?<\/h[2-4]>(.*?)(?=<h[2-4]|$)/gis;
  const howToSections = html.matchAll(howToHeadingPattern);
  for (const section of howToSections) {
    const listPattern = /<li[^>]*>(.*?)<\/li>/gi;
    const items = section[1].matchAll(listPattern);
    for (const item of items) {
      howToSteps.push({ 
        text: item[1].replace(/<[^>]*>/g, '').trim(),
        source: 'howto_list' 
      });
    }
  }
  
  // Look for step-by-step patterns
  const stepPattern = /step\s+\d+[:\-\s]+(.*?)(?=step\s+\d+|$)/gis;
  const stepMatches = html.matchAll(stepPattern);
  for (const step of stepMatches) {
    howToSteps.push({ 
      text: step[1].replace(/<[^>]*>/g, '').trim(),
      source: 'step_pattern' 
    });
  }
  
  return howToSteps;
}

function extractComparisons(html) {
  const comparisons = [];
  
  // Look for comparison keywords
  const comparisonPatterns = [
    { pattern: /vs\.|versus|compared to|in comparison|better than|worse than|alternative to/gi, type: 'direct_comparison' },
    { pattern: /pros and cons|advantages and disadvantages/gi, type: 'pros_cons' },
    { pattern: /competitor|competition/gi, type: 'competitive' },
    { pattern: /\w+\s+vs\s+\w+/gi, type: 'versus_format' }
  ];
  
  for (const { pattern, type } of comparisonPatterns) {
    const matches = html.match(pattern);
    if (matches) {
      comparisons.push({
        type,
        count: matches.length,
        signal_strength: matches.length > 3 ? 'high' : 'medium',
        examples: matches.slice(0, 3)
      });
    }
  }
  
  return comparisons;
}

function extractLists(html) {
  const lists = [];
  
  // Ordered lists
  const olPattern = /<ol[^>]*>(.*?)<\/ol>/gis;
  const olMatches = html.matchAll(olPattern);
  for (const match of olMatches) {
    const items = extractListItems(match[1]);
    lists.push({ type: 'ordered', items, count: items.length });
  }
  
  // Unordered lists
  const ulPattern = /<ul[^>]*>(.*?)<\/ul>/gis;
  const ulMatches = html.matchAll(ulPattern);
  for (const match of ulMatches) {
    const items = extractListItems(match[1]);
    lists.push({ type: 'unordered', items, count: items.length });
  }
  
  return lists;
}

function extractSchemaMarkup(html) {
  const schemas = [];
  
  // Find all JSON-LD scripts
  const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
  const matches = html.matchAll(jsonLdPattern);
  
  for (const match of matches) {
    try {
      const data = JSON.parse(match[1]);
      if (data['@type']) {
        schemas.push({
          type: data['@type'],
          hasRating: !!data.aggregateRating,
          hasReviews: !!data.review,
          hasBreadcrumb: data['@type'] === 'BreadcrumbList',
          hasFAQ: data['@type'] === 'FAQPage',
          hasHowTo: data['@type'] === 'HowTo',
          hasOrganization: data['@type'] === 'Organization',
          hasProduct: data['@type'] === 'Product'
        });
      }
    } catch (e) {
      console.log('Failed to parse schema:', e);
    }
  }
  
  return schemas;
}

function analyzeHeadings(html) {
  const headings = { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] };
  
  for (let i = 1; i <= 6; i++) {
    const pattern = new RegExp(`<h${i}[^>]*>(.*?)<\/h${i}>`, 'gis');
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      headings[`h${i}`].push(match[1].replace(/<[^>]*>/g, '').trim());
    }
  }
  
  return {
    structure: headings,
    hasH1: headings.h1.length > 0,
    h1Count: headings.h1.length,
    totalHeadings: Object.values(headings).flat().length,
    hierarchy: checkHeadingHierarchy(headings)
  };
}

function countInternalLinks(html) {
  const internalLinkPattern = /<a[^>]*href=["'](?:\/|#|\.\/)[^"']*["'][^>]*>/gi;
  const matches = html.match(internalLinkPattern);
  return matches ? matches.length : 0;
}

function extractCitations(html) {
  const citations = [];
  
  // Look for citation patterns
  const citationPatterns = [
    /\[(\d+)\]/g, // [1], [2], etc.
    /\(([^)]*\d{4}[^)]*)\)/g, // (Author, 2023)
    /<cite[^>]*>(.*?)<\/cite>/gi,
    /source:\s*([^<\n]+)/gi,
    /according to\s+([^<\n]+)/gi
  ];
  
  citationPatterns.forEach((pattern, index) => {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      citations.push({
        text: match[1] || match[0],
        type: ['numbered', 'parenthetical', 'cite_tag', 'source_ref', 'attribution'][index],
        position: match.index
      });
    }
  });
  
  return citations;
}

function findLastModified(html) {
  const patterns = [
    /last\s+(?:modified|updated):\s*([^<\n]+)/gi,
    /updated\s+(?:on)?\s*([^<\n]+)/gi,
    /"dateModified"\s*:\s*"([^"]+)"/gi,
    /"lastReviewed"\s*:\s*"([^"]+)"/gi
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return { date: match[1], found: true };
    }
  }
  
  return { date: null, found: false };
}

function findPublishDate(html) {
  const patterns = [
    /"datePublished"\s*:\s*"([^"]+)"/gi,
    /published\s+(?:on)?\s*([^<\n]+)/gi,
    /<time[^>]*datetime=["']([^"']+)["'][^>]*>/gi,
    /\d{1,2}\/\d{1,2}\/\d{4}/g,
    /\d{4}-\d{2}-\d{2}/g
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return { date: match[1] || match[0], found: true };
    }
  }
  
  return { date: null, found: false };
}

function detectUpdatePatterns(html) {
  const updateIndicators = [
    'updated', 'revised', 'edited', 'refreshed', 'latest',
    'current', 'recent', 'new', 'changelog', 'version'
  ];
  
  let updateScore = 0;
  const foundIndicators = [];
  
  updateIndicators.forEach(indicator => {
    const pattern = new RegExp(`\\b${indicator}\\b`, 'gi');
    const matches = html.match(pattern);
    if (matches) {
      updateScore += matches.length;
      foundIndicators.push({ indicator, count: matches.length });
    }
  });
  
  return { score: updateScore, indicators: foundIndicators };
}

function findOfficialIndicators(html) {
  const officialPatterns = [
    /verified/gi, /official/gi, /certified/gi, /authentic/gi,
    /badge/gi, /accredited/gi, /licensed/gi, /authorized/gi
  ];
  
  const indicators = [];
  officialPatterns.forEach(pattern => {
    const matches = html.match(pattern);
    if (matches) {
      indicators.push({ type: pattern.source, count: matches.length });
    }
  });
  
  return indicators;
}

function findVerifiedLinks(html) {
  const socialPlatforms = ['twitter.com', 'linkedin.com', 'facebook.com', 'instagram.com'];
  const verifiedLinks = [];
  
  socialPlatforms.forEach(platform => {
    const pattern = new RegExp(`href=["'][^"']*${platform}[^"']*["']`, 'gi');
    const matches = html.match(pattern);
    if (matches) {
      verifiedLinks.push({ platform, count: matches.length });
    }
  });
  
  return verifiedLinks;
}

function findGithubLinks(html) {
  const githubPattern = /href=["'][^"']*github\.com[^"']*["']/gi;
  const matches = html.match(githubPattern);
  return matches ? matches.length : 0;
}

function findAcademicReferences(html) {
  const academicDomains = [
    'arxiv.org', 'pubmed.ncbi.nlm.nih.gov', 'scholar.google.com',
    'researchgate.net', 'academia.edu', 'jstor.org'
  ];
  
  const references = [];
  academicDomains.forEach(domain => {
    const pattern = new RegExp(`href=["'][^"']*${domain.replace('.', '\\.')}[^"']*["']`, 'gi');
    const matches = html.match(pattern);
    if (matches) {
      references.push({ domain, count: matches.length });
    }
  });
  
  return references;
}

// Helper functions
function extractTableData(tableHtml) {
  const rows = [];
  const rowPattern = /<tr[^>]*>(.*?)<\/tr>/gis;
  const rowMatches = tableHtml.matchAll(rowPattern);
  
  for (const match of rowMatches) {
    const cellPattern = /<t[dh][^>]*>(.*?)<\/t[dh]>/gi;
    const cells = match[1].matchAll(cellPattern);
    const row = [];
    for (const cell of cells) {
      row.push(cell[1].replace(/<[^>]*>/g, '').trim());
    }
    if (row.length > 0) rows.push(row);
  }
  
  return rows;
}

function extractListItems(listHtml) {
  const items = [];
  const itemPattern = /<li[^>]*>(.*?)<\/li>/gi;
  const matches = listHtml.matchAll(itemPattern);
  for (const match of matches) {
    items.push(match[1].replace(/<[^>]*>/g, '').trim());
  }
  return items;
}

function getContextAroundMatch(text, position, radius) {
  const start = Math.max(0, position - radius);
  const end = Math.min(text.length, position + radius);
  return text.slice(start, end);
}

function getAuthorityType(domain) {
  if (domain.includes('.edu')) return 'academic';
  if (domain.includes('.gov')) return 'government';
  if (domain.includes('wikipedia')) return 'encyclopedia';
  if (domain.includes('github')) return 'code_repository';
  if (['techcrunch.com', 'reuters.com', 'bloomberg.com'].includes(domain)) return 'news';
  return 'general_authority';
}

function checkHeadingHierarchy(headings) {
  // Check if headings follow proper hierarchy (h1 -> h2 -> h3, etc.)
  const levels = Object.keys(headings).filter(key => headings[key].length > 0);
  let isProperHierarchy = true;
  
  for (let i = 1; i < levels.length; i++) {
    const currentLevel = parseInt(levels[i].slice(1));
    const previousLevel = parseInt(levels[i-1].slice(1));
    if (currentLevel > previousLevel + 1) {
      isProperHierarchy = false;
      break;
    }
  }
  
  return isProperHierarchy;
}

// Export all extraction functions
export default {
  extractPerplexitySignals,
  extractEntities,
  extractFAQs,
  extractTables,
  extractHowToContent,
  extractComparisons,
  extractLists,
  extractSchemaMarkup,
  analyzeHeadings,
  countInternalLinks,
  extractCitations,
  findLastModified,
  findPublishDate,
  detectUpdatePatterns,
  findOfficialIndicators,
  findVerifiedLinks,
  findGithubLinks,
  findAcademicReferences
};
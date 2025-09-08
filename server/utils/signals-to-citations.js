function convertSignalsToCitations(signals) {
  const citations = [];
  
  // Convert detected FAQs to citations
  if (signals.faqs?.length > 0) {
    citations.push({
      source_url: '#faq-section',
      domain: 'on-page',
      title: `${signals.faqs.length} FAQ entries detected`,
      snippet: `FAQ content provides direct answers to user questions, enhancing AI visibility`,
      credibility_signals: { 
        official: true, 
        doc_type: 'docs',
        structured_data: true 
      },
      confidence: 0.9,
      diversity_bucket: 'official'
    });
  }
  
  // Convert detected tables to citations
  if (signals.tables?.length > 0) {
    signals.tables.forEach((table, index) => {
      citations.push({
        source_url: `#table-${index}`,
        domain: 'on-page',
        title: `${table.type} table with ${table.rowCount} rows`,
        snippet: `Structured ${table.type} data in tabular format improves data accessibility`,
        credibility_signals: { 
          official: true, 
          doc_type: 'reference',
          structured_data: true 
        },
        confidence: 0.85,
        diversity_bucket: 'reference'
      });
    });
  }
  
  // Convert how-to content to citations
  if (signals.howToSteps?.length > 0) {
    citations.push({
      source_url: '#how-to-content',
      domain: 'on-page',
      title: `${signals.howToSteps.length} how-to steps found`,
      snippet: 'Step-by-step instructional content enhances procedural search visibility',
      credibility_signals: { 
        official: true, 
        doc_type: 'guide',
        instructional: true 
      },
      confidence: 0.88,
      diversity_bucket: 'educational'
    });
  }
  
  // Convert schema markup to citations
  if (signals.schemaMarkup?.length > 0) {
    const schemaTypes = signals.schemaMarkup.map(s => s.type).join(', ');
    citations.push({
      source_url: '#schema-markup',
      domain: 'on-page',
      title: `Structured data: ${schemaTypes}`,
      snippet: 'Schema.org markup provides rich structured data for AI platforms',
      credibility_signals: { 
        official: true, 
        doc_type: 'structured',
        machine_readable: true 
      },
      confidence: 0.95,
      diversity_bucket: 'technical'
    });
  }
  
  // Convert authority links to citations
  if (signals.authorityAssociations?.length > 0) {
    signals.authorityAssociations.forEach(authority => {
      citations.push({
        source_url: authority.url || '#authority-link',
        domain: authority.domain,
        title: `Authority link: ${authority.domain}`,
        snippet: `External authority link enhances credibility and trust signals`,
        credibility_signals: { 
          official: true, 
          doc_type: getAuthorityDocType(authority.type),
          external_validation: true 
        },
        confidence: 0.87,
        diversity_bucket: getAuthorityBucket(authority.type)
      });
    });
  }
  
  // Convert heading structure to citation
  if (signals.headingStructure?.totalHeadings > 0) {
    citations.push({
      source_url: '#content-structure',
      domain: 'on-page',
      title: `Content structure: ${signals.headingStructure.totalHeadings} headings`,
      snippet: `Well-structured content with ${signals.headingStructure.h1Count} H1 and proper hierarchy`,
      credibility_signals: { 
        official: true, 
        doc_type: 'content',
        well_structured: true 
      },
      confidence: 0.82,
      diversity_bucket: 'structural'
    });
  }
  
  return citations;
}

function getAuthorityDocType(type) {
  switch(type) {
    case 'academic': return 'research';
    case 'government': return 'official';
    case 'news': return 'news';
    case 'encyclopedia': return 'reference';
    default: return 'authority';
  }
}

function getAuthorityBucket(type) {
  switch(type) {
    case 'academic': return 'research';
    case 'government': return 'official';
    case 'news': return 'news';
    case 'encyclopedia': return 'reference';
    default: return 'authority';
  }
}
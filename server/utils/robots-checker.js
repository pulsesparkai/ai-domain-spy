// server/utils/robots-checker.js
import fetch from 'node-fetch';

export async function canScrapeUrl(url) {
  try {
    // Normalize URL to get domain
    let domain;
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      domain = new URL(url).hostname;
    } else {
      domain = url.replace(/^www\./, '');
    }
    
    // Fetch robots.txt
    const robotsUrl = `https://${domain}/robots.txt`;
    console.log(`Checking robots.txt at: ${robotsUrl}`);
    
    const response = await fetch(robotsUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'PulseSparkAI-Bot/1.0 (+https://pulsespark.ai/bot)'
      }
    });
    
    if (!response.ok) {
      console.log(`No robots.txt found for ${domain}, allowing scraping`);
      return true; // If no robots.txt, allow scraping
    }
    
    const robotsText = await response.text();
    console.log(`Found robots.txt for ${domain}`);
    
    // Parse robots.txt
    const lines = robotsText.split('\n').map(line => line.trim().toLowerCase());
    
    let currentUserAgent = '';
    let isRelevantSection = false;
    let disallowed = false;
    
    for (const line of lines) {
      // Skip comments and empty lines
      if (line.startsWith('#') || line === '') continue;
      
      if (line.startsWith('user-agent:')) {
        const userAgent = line.replace('user-agent:', '').trim();
        // Check if this section applies to us
        isRelevantSection = userAgent === '*' || 
                           userAgent === 'pulsesparkai-bot' || 
                           userAgent === 'pulsessparkaibot' ||
                           userAgent === 'pulsespark';
        currentUserAgent = userAgent;
      } else if (isRelevantSection && line.startsWith('disallow:')) {
        const disallowPath = line.replace('disallow:', '').trim();
        
        // If disallow is / or empty, it means disallow all
        if (disallowPath === '/' || disallowPath === '') {
          disallowed = true;
          console.log(`Scraping disallowed for ${domain} under user-agent: ${currentUserAgent}`);
          break;
        }
      } else if (isRelevantSection && line.startsWith('allow:')) {
        const allowPath = line.replace('allow:', '').trim();
        
        // If there's an explicit allow for root, override disallow
        if (allowPath === '/' || allowPath === '') {
          disallowed = false;
        }
      }
    }
    
    const canScrape = !disallowed;
    console.log(`Robots.txt check for ${domain}: ${canScrape ? 'ALLOWED' : 'BLOCKED'}`);
    
    return canScrape;
    
  } catch (error) {
    console.error(`Error checking robots.txt for ${url}:`, error.message);
    // If we can't check robots.txt, err on the side of caution but allow
    return true;
  }
}
import fetch from 'node-fetch';
import robotsParser from 'robots-txt-parser';

export async function canAIScrapeUrl(url) {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
    
    // Check llms.txt FIRST (newer standard for AI)
    try {
      const llmsResponse = await fetch(`${baseUrl}/llms.txt`, {
        headers: {
          'User-Agent': 'PulseSparkBot/1.0 (AI Analysis Bot; https://pulsespark.ai/bot)'
        },
        timeout: 5000
      });
      
      if (llmsResponse.ok) {
        const llmsContent = await llmsResponse.text();
        console.log('Found llms.txt for', urlObj.hostname);
        
        // Parse llms.txt rules
        const lines = llmsContent.split('\n');
        for (const line of lines) {
          const lowerLine = line.toLowerCase();
          if (lowerLine.includes('user-agent: *') || 
              lowerLine.includes('user-agent: pulsespark') ||
              lowerLine.includes('user-agent: ai')) {
            if (lowerLine.includes('disallow: /') ||
                lowerLine.includes('crawl-delay') ||
                lowerLine.includes('disallow')) {
              console.log('llms.txt blocks AI scraping for', url);
              return { 
                allowed: false, 
                reason: 'llms.txt blocks AI crawlers',
                fileType: 'llms.txt',
                requiresManual: true 
              };
            }
          }
        }
      }
    } catch (llmsError) {
      console.log('No llms.txt found, checking robots.txt');
    }
    
    // Check robots.txt as fallback
    try {
      const robotsResponse = await fetch(`${baseUrl}/robots.txt`, {
        headers: {
          'User-Agent': 'PulseSparkBot/1.0 (https://pulsespark.ai/bot)'
        },
        timeout: 5000
      });
      
      if (robotsResponse.ok) {
        const robotsTxt = await robotsResponse.text();
        
        // Check for AI-specific disallow patterns
        const aiPatterns = ['GPTBot', 'ChatGPT', 'CCBot', 'anthropic-ai', 'Claude', 'AI2Bot', 'PerplexityBot'];
        const lowerRobots = robotsTxt.toLowerCase();
        
        for (const pattern of aiPatterns) {
          if (lowerRobots.includes(pattern.toLowerCase()) && lowerRobots.includes('disallow')) {
            return { 
              allowed: false, 
              reason: 'robots.txt blocks AI bots',
              fileType: 'robots.txt',
              requiresManual: true 
            };
          }
        }
        
        // Check general disallow
        if (lowerRobots.includes('user-agent: *') && lowerRobots.includes('disallow: /')) {
          return { 
            allowed: false, 
            reason: 'robots.txt blocks all crawlers',
            fileType: 'robots.txt',
            requiresManual: true 
          };
        }
      }
    } catch (robotsError) {
      console.log('Could not check robots.txt:', robotsError.message);
    }
    
    return { allowed: true, reason: null };
  } catch (error) {
    console.log('Could not check scraping permissions:', error.message);
    return { allowed: true, reason: null };
  }
}
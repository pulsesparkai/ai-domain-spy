// server/utils/ai-scraping-checker.js
import fetch from 'node-fetch';

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
        const lines = llmsContent.split('\n').map(line => line.trim().toLowerCase());
        let currentUserAgent = '';
        let isRelevantSection = false;
        
        for (const line of lines) {
          if (line.startsWith('user-agent:')) {
            const userAgent = line.replace('user-agent:', '').trim();
            isRelevantSection = userAgent === '*' || 
                              userAgent.includes('pulsespark') ||
                              userAgent.includes('ai') ||
                              userAgent.includes('bot');
            currentUserAgent = userAgent;
          } else if (isRelevantSection) {
            if (line.includes('disallow: /') || 
                line.includes('disallow: *') ||
                (line.includes('disallow:') && !line.includes('disallow: '))) {
              console.log('llms.txt blocks AI scraping for', url);
              return { 
                allowed: false, 
                reason: 'llms.txt blocks AI crawlers',
                requiresManual: true,
                fileType: 'llms.txt'
              };
            }
            if (line.includes('crawl-delay:')) {
              const delay = parseInt(line.split(':')[1]);
              if (delay > 10) {
                return { 
                  allowed: false, 
                  reason: 'llms.txt sets high crawl delay',
                  requiresManual: true,
                  fileType: 'llms.txt'
                };
              }
            }
          }
        }
        
        console.log('llms.txt allows AI scraping for', url);
        return { allowed: true, reason: 'llms.txt permits crawling', fileType: 'llms.txt' };
      }
    } catch (llmsError) {
      console.log('No llms.txt found, checking robots.txt');
    }
    
    // Check robots.txt as fallback
    const robotsUrl = `${baseUrl}/robots.txt`;
    console.log(`Checking robots.txt at: ${robotsUrl}`);
    
    const response = await fetch(robotsUrl, {
      headers: {
        'User-Agent': 'PulseSparkBot/1.0 (https://pulsespark.ai/bot)'
      },
      timeout: 5000
    });
    
    if (response.ok) {
      const robotsTxt = await response.text();
      console.log(`Found robots.txt for ${urlObj.hostname}`);
      
      // Parse robots.txt manually (more reliable than parser library)
      const lines = robotsTxt.split('\n').map(line => line.trim().toLowerCase());
      let currentUserAgent = '';
      let isRelevantSection = false;
      let disallowed = false;
      
      // Check for AI-specific disallow patterns
      const aiPatterns = ['gptbot', 'chatgpt', 'ccbot', 'anthropic', 'claude-bot', 'perplexitybot'];
      
      for (const line of lines) {
        if (line.startsWith('#') || line === '') continue;
        
        if (line.startsWith('user-agent:')) {
          const userAgent = line.replace('user-agent:', '').trim();
          isRelevantSection = userAgent === '*' || 
                            userAgent.includes('pulsespark') ||
                            aiPatterns.some(pattern => userAgent.includes(pattern)) ||
                            userAgent.includes('bot') ||
                            userAgent.includes('ai');
          currentUserAgent = userAgent;
        } else if (isRelevantSection && line.startsWith('disallow:')) {
          const disallowPath = line.replace('disallow:', '').trim();
          
          // If disallow is / or empty, it means disallow all
          if (disallowPath === '/' || disallowPath === '') {
            disallowed = true;
            console.log(`Robots.txt blocks crawling for ${urlObj.hostname} under user-agent: ${currentUserAgent}`);
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
      
      if (disallowed) {
        return { 
          allowed: false, 
          reason: 'robots.txt blocks automated crawling',
          requiresManual: true,
          fileType: 'robots.txt'
        };
      }
    } else {
      console.log(`No robots.txt found for ${urlObj.hostname}, allowing crawling`);
    }
    
    return { 
      allowed: true, 
      reason: 'No crawling restrictions found',
      fileType: response.ok ? 'robots.txt' : 'none'
    };
    
  } catch (error) {
    console.error(`Error checking crawling permissions for ${url}:`, error.message);
    return { 
      allowed: true, 
      reason: 'Could not check permissions, assuming allowed',
      fileType: 'error'
    };
  }
}
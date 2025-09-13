const robotsParser = require('robots-parser');
const fetch = require('node-fetch');

// Rate limiting storage
const lastRequestTime = new Map();
const RATE_LIMIT_DELAY = 1000; // 1 second between requests per domain

// Our bot user agent with contact info
const userAgent = 'PulseSparkAIBot/1.0 (+https://pulsespark.ai/bot-info)';

/**
 * Ethical fetch function that respects robots.txt and implements rate limiting
 * @param {string} url - The URL to fetch
 * @param {object} options - Additional fetch options  
 * @returns {Promise<{allowed: boolean, content?: string, error?: string}>} - Result object
 */
async function ethicalFetch(url, options = {}) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const root = new URL('/', url).href;
    const robotsUrl = root + 'robots.txt';
    
    console.log(`[EthicalBot] Checking robots.txt for ${domain}`);
    
    // Check robots.txt
    let robotsTxt;
    try {
      const robotsResponse = await fetch(robotsUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': userAgent
        }
      });
      
      if (robotsResponse.ok) {
        robotsTxt = await robotsResponse.text();
      }
    } catch (robotsError) {
      console.log(`[EthicalBot] Could not fetch robots.txt for ${domain}, proceeding with caution`);
      // If robots.txt fetch fails, allow the request but apply rate limiting
      await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY));
      
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'User-Agent': userAgent,
            ...options.headers
          }
        });
        
        if (response.ok) {
          const content = await response.text();
          return { allowed: true, content };
        } else {
          return { allowed: false, error: `HTTP ${response.status}` };
        }
      } catch (fetchError) {
        return { allowed: false, error: fetchError.message };
      }
    }
    
    // Parse robots.txt and check if URL is allowed
    const parser = robotsParser(robotsUrl, robotsTxt);
    const isAllowed = parser.isAllowed(url, userAgent);
    
    if (!isAllowed) {
      console.log(`[EthicalBot] ❌ Access denied by robots.txt for ${url}`);
      const error = new Error('Blocked by robots.txt');
      error.code = 'ROBOTS_BLOCKED';
      error.domain = domain;
      error.url = url;
      throw error;
    }
    
    console.log(`[EthicalBot] ✅ Access allowed by robots.txt for ${url}`);
    
    // Implement rate limiting per domain
    const now = Date.now();
    const lastRequest = lastRequestTime.get(domain) || 0;
    const timeSinceLastRequest = now - lastRequest;
    
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
      console.log(`[EthicalBot] ⏱️ Rate limiting: waiting ${waitTime}ms for ${domain}`);
      await new Promise(r => setTimeout(r, waitTime));
    }
    
    // Update last request time
    lastRequestTime.set(domain, Date.now());
    
    // Rate limit: await new Promise(r => setTimeout(r, 1000));
    await new Promise(r => setTimeout(r, 1000));
    
    // Make the actual request with ethical headers
    try {
      const response = await fetch(url, {
        timeout: 10000,
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1', // Do Not Track
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          ...options.headers
        },
        ...options
      });
      
      if (response.ok) {
        const content = await response.text();
        console.log(`[EthicalBot] 🚀 Successfully fetched ${content.length} characters from ${url}`);
        
        // Log compliance information
        console.log(`[EthicalBot] 📊 Compliance Report for ${domain}:`);
        console.log(`  - Robots.txt checked: ✅`);
        console.log(`  - Access allowed: ✅`);
        console.log(`  - Rate limited: ✅`);
        console.log(`  - User-Agent: ${userAgent}`);
        console.log(`  - Response status: ${response.status}`);
        
        return { allowed: true, content };
      } else {
        return { allowed: false, error: `HTTP ${response.status}` };
      }
    } catch (fetchError) {
      console.log(`[EthicalBot] ⚠️ Error during fetch: ${fetchError.message}`);
      return { allowed: false, error: fetchError.message };
    }
    
  } catch (error) {
    if (error.code === 'ROBOTS_BLOCKED') {
      console.log(`[EthicalBot] 🚫 Ethical compliance block: ${error.message}`);
      throw error;
    } else {
      console.log(`[EthicalBot] ⚠️ Error during ethical fetch: ${error.message}`);
      return { allowed: false, error: error.message };
    }
  }
}

/**
 * Check if a URL is allowed by robots.txt without fetching
 * @param {string} url - The URL to check
 * @returns {Promise<boolean>} - Whether the URL is allowed
 */
async function isUrlAllowed(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const root = new URL('/', url).href;
    const robotsUrl = root + 'robots.txt';
    
    let robotsTxt = '';
    try {
      const robotsResponse = await fetch(robotsUrl, {
        timeout: 5000,
        headers: { 'User-Agent': userAgent }
      });
      
      if (robotsResponse.ok) {
        robotsTxt = await robotsResponse.text();
      }
    } catch (robotsError) {
      // If we can't fetch robots.txt, assume allowed
      return true;
    }
    
    const parser = robotsParser(robotsUrl, robotsTxt);
    return parser.isAllowed(url, userAgent);
    
  } catch (error) {
    console.log(`[EthicalBot] Error checking URL permission: ${error.message}`);
    return false;
  }
}

/**
 * Get crawl delay from robots.txt
 * @param {string} url - The URL to check
 * @returns {Promise<number>} - Crawl delay in milliseconds
 */
async function getCrawlDelay(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const root = new URL('/', url).href;
    const robotsUrl = root + 'robots.txt';
    
    let robotsTxt = '';
    try {
      const robotsResponse = await fetch(robotsUrl, {
        timeout: 5000,
        headers: { 'User-Agent': userAgent }
      });
      
      if (robotsResponse.ok) {
        robotsTxt = await robotsResponse.text();
      }
    } catch (robotsError) {
      return RATE_LIMIT_DELAY; // Default delay
    }
    
    const parser = robotsParser(robotsUrl, robotsTxt);
    const crawlDelay = parser.getCrawlDelay(userAgent);
    
    // Convert to milliseconds and ensure minimum delay
    return Math.max(crawlDelay ? crawlDelay * 1000 : RATE_LIMIT_DELAY, RATE_LIMIT_DELAY);
    
  } catch (error) {
    console.log(`[EthicalBot] Error getting crawl delay: ${error.message}`);
    return RATE_LIMIT_DELAY;
  }
}

module.exports = { 
  ethicalFetch, 
  isUrlAllowed, 
  getCrawlDelay, 
  userAgent 
};
import fetch from 'node-fetch';
import robotsParser from 'robots-parser';

// Rate limiting storage
const lastRequestTime = new Map();
const RATE_LIMIT_DELAY = 1000; // 1 second between requests per domain

// Our bot user agent
const USER_AGENT = 'PulseSparkAIBot/1.0';

/**
 * Ethical fetch function that respects robots.txt and implements rate limiting
 * @param {string} url - The URL to fetch
 * @param {object} options - Additional fetch options
 * @returns {Promise} - Fetch response or error
 */
export async function ethicalFetch(url, options = {}) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const robotsUrl = `${urlObj.protocol}//${domain}/robots.txt`;
    
    console.log(`[EthicalBot] Checking robots.txt for ${domain}`);
    
    // Check robots.txt
    let robotsContent = '';
    try {
      const robotsResponse = await fetch(robotsUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': USER_AGENT
        }
      });
      
      if (robotsResponse.ok) {
        robotsContent = await robotsResponse.text();
      }
    } catch (robotsError) {
      console.log(`[EthicalBot] Could not fetch robots.txt for ${domain}, proceeding with caution`);
    }
    
    // Parse robots.txt
    const robots = robotsParser(robotsUrl, robotsContent);
    const isAllowed = robots.isAllowed(url, USER_AGENT);
    
    if (!isAllowed) {
      const error = new Error(`Blocked by robots.txt for ${domain}`);
      error.code = 'ROBOTS_BLOCKED';
      error.domain = domain;
      error.url = url;
      console.log(`[EthicalBot] ❌ Access denied by robots.txt for ${url}`);
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
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Update last request time
    lastRequestTime.set(domain, Date.now());
    
    // Merge options with ethical defaults
    const ethicalOptions = {
      timeout: 10000,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1', // Do Not Track
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...options.headers
      },
      ...options
    };
    
    console.log(`[EthicalBot] 🚀 Fetching ${url} with ethical compliance`);
    
    // Make the actual request
    const response = await fetch(url, ethicalOptions);
    
    // Log compliance information
    console.log(`[EthicalBot] 📊 Compliance Report for ${domain}:`);
    console.log(`  - Robots.txt checked: ✅`);
    console.log(`  - Access allowed: ✅`);
    console.log(`  - Rate limited: ✅`);
    console.log(`  - User-Agent: ${USER_AGENT}`);
    console.log(`  - Response status: ${response.status}`);
    console.log(`  - Response headers: ${JSON.stringify(Object.fromEntries(response.headers), null, 2)}`);
    
    return response;
    
  } catch (error) {
    if (error.code === 'ROBOTS_BLOCKED') {
      console.log(`[EthicalBot] 🚫 Ethical compliance block: ${error.message}`);
    } else {
      console.log(`[EthicalBot] ⚠️ Error during ethical fetch: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Check if a URL is allowed by robots.txt without fetching
 * @param {string} url - The URL to check
 * @returns {Promise<boolean>} - Whether the URL is allowed
 */
export async function isUrlAllowed(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const robotsUrl = `${urlObj.protocol}//${domain}/robots.txt`;
    
    let robotsContent = '';
    try {
      const robotsResponse = await fetch(robotsUrl, {
        timeout: 5000,
        headers: { 'User-Agent': USER_AGENT }
      });
      
      if (robotsResponse.ok) {
        robotsContent = await robotsResponse.text();
      }
    } catch (robotsError) {
      // If we can't fetch robots.txt, assume allowed
      return true;
    }
    
    const robots = robotsParser(robotsUrl, robotsContent);
    return robots.isAllowed(url, USER_AGENT);
    
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
export async function getCrawlDelay(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const robotsUrl = `${urlObj.protocol}//${domain}/robots.txt`;
    
    let robotsContent = '';
    try {
      const robotsResponse = await fetch(robotsUrl, {
        timeout: 5000,
        headers: { 'User-Agent': USER_AGENT }
      });
      
      if (robotsResponse.ok) {
        robotsContent = await robotsResponse.text();
      }
    } catch (robotsError) {
      return RATE_LIMIT_DELAY; // Default delay
    }
    
    const robots = robotsParser(robotsUrl, robotsContent);
    const crawlDelay = robots.getCrawlDelay(USER_AGENT);
    
    // Convert to milliseconds and ensure minimum delay
    return Math.max(crawlDelay ? crawlDelay * 1000 : RATE_LIMIT_DELAY, RATE_LIMIT_DELAY);
    
  } catch (error) {
    console.log(`[EthicalBot] Error getting crawl delay: ${error.message}`);
    return RATE_LIMIT_DELAY;
  }
}

export default { ethicalFetch, isUrlAllowed, getCrawlDelay, USER_AGENT };
/**
 * Application Constants
 * Centralized constants for the PulseSpark AI application
 */

// Application metadata
export const APP_METADATA = {
  name: 'PulseSpark AI',
  description: 'AI-powered brand monitoring and citation tracking platform',
  version: '1.0.0',
  author: 'PulseSpark Team',
  keywords: ['AI', 'brand monitoring', 'citation tracking', 'SEO', 'content optimization'],
  social: {
    twitter: '@pulsespark',
    linkedin: 'company/pulsespark',
    github: 'pulsespark/platform'
  }
} as const;

// Scan types and configurations
export const SCAN_TYPES = {
  BRAND_MONITORING: 'brand-monitoring',
  COMPETITOR_ANALYSIS: 'competitor-analysis', 
  CONTENT_OPTIMIZATION: 'content-optimization',
  DOMAIN_RANKING: 'domain-ranking'
} as const;

export const SCAN_TYPE_LABELS = {
  [SCAN_TYPES.BRAND_MONITORING]: 'Brand Monitoring',
  [SCAN_TYPES.COMPETITOR_ANALYSIS]: 'Competitor Analysis',
  [SCAN_TYPES.CONTENT_OPTIMIZATION]: 'Content Optimization',
  [SCAN_TYPES.DOMAIN_RANKING]: 'Domain Ranking'
} as const;

// AI Service providers
export const AI_PROVIDERS = {
  PERPLEXITY: 'perplexity',
  DEEPSEEK: 'deepseek',
  OPENAI: 'openai'
} as const;

// Status constants
export const SCAN_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

export const SCAN_STATUS_LABELS = {
  [SCAN_STATUS.PENDING]: 'Pending',
  [SCAN_STATUS.RUNNING]: 'Running',
  [SCAN_STATUS.COMPLETED]: 'Completed',
  [SCAN_STATUS.FAILED]: 'Failed'
} as const;

// Sentiment types
export const SENTIMENT_TYPES = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral'
} as const;

// Platform identifiers for citations
export const PLATFORMS = {
  PERPLEXITY: 'perplexity',
  GOOGLE: 'google', 
  REDDIT: 'reddit',
  TWITTER: 'twitter',
  LINKEDIN: 'linkedin',
  YOUTUBE: 'youtube',
  GITHUB: 'github',
  STACKOVERFLOW: 'stackoverflow',
  MEDIUM: 'medium',
  WIKIPEDIA: 'wikipedia',
  NEWS: 'news',
  BLOG: 'blog',
  OTHER: 'other'
} as const;

export const PLATFORM_LABELS = {
  [PLATFORMS.PERPLEXITY]: 'Perplexity',
  [PLATFORMS.GOOGLE]: 'Google',
  [PLATFORMS.REDDIT]: 'Reddit',
  [PLATFORMS.TWITTER]: 'Twitter/X',
  [PLATFORMS.LINKEDIN]: 'LinkedIn',
  [PLATFORMS.YOUTUBE]: 'YouTube',
  [PLATFORMS.GITHUB]: 'GitHub',
  [PLATFORMS.STACKOVERFLOW]: 'Stack Overflow',
  [PLATFORMS.MEDIUM]: 'Medium',
  [PLATFORMS.WIKIPEDIA]: 'Wikipedia',
  [PLATFORMS.NEWS]: 'News',
  [PLATFORMS.BLOG]: 'Blog',
  [PLATFORMS.OTHER]: 'Other'
} as const;

// Color mappings for different platforms
export const PLATFORM_COLORS = {
  [PLATFORMS.PERPLEXITY]: '#00D4AA',
  [PLATFORMS.GOOGLE]: '#4285F4',
  [PLATFORMS.REDDIT]: '#FF4500',
  [PLATFORMS.TWITTER]: '#1DA1F2',
  [PLATFORMS.LINKEDIN]: '#0A66C2',
  [PLATFORMS.YOUTUBE]: '#FF0000',
  [PLATFORMS.GITHUB]: '#181717',
  [PLATFORMS.STACKOVERFLOW]: '#F58025',
  [PLATFORMS.MEDIUM]: '#00AB6C',
  [PLATFORMS.WIKIPEDIA]: '#000000',
  [PLATFORMS.NEWS]: '#FF6B6B',
  [PLATFORMS.BLOG]: '#9C88FF',
  [PLATFORMS.OTHER]: '#6B7280'
} as const;

// URL patterns for platform detection
export const PLATFORM_URL_PATTERNS = {
  [PLATFORMS.PERPLEXITY]: /perplexity\.ai/,
  [PLATFORMS.GOOGLE]: /google\.com/,
  [PLATFORMS.REDDIT]: /reddit\.com/,
  [PLATFORMS.TWITTER]: /(twitter\.com|x\.com)/,
  [PLATFORMS.LINKEDIN]: /linkedin\.com/,
  [PLATFORMS.YOUTUBE]: /(youtube\.com|youtu\.be)/,
  [PLATFORMS.GITHUB]: /github\.com/,
  [PLATFORMS.STACKOVERFLOW]: /stackoverflow\.com/,
  [PLATFORMS.MEDIUM]: /medium\.com/,
  [PLATFORMS.WIKIPEDIA]: /wikipedia\.org/
} as const;

// Citation types
export const CITATION_TYPES = {
  DIRECT: 'direct',
  INDIRECT: 'indirect',
  MENTION: 'mention',
  REFERENCE: 'reference'
} as const;

// Validation constants
export const VALIDATION = {
  URL_REGEX: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_QUERY_LENGTH: 3,
  MAX_QUERY_LENGTH: 500,
  MAX_QUERIES_PER_SCAN: 10,
  MAX_URL_LENGTH: 2048
} as const;

// Time constants (in milliseconds)
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000
} as const;

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  BASIC: 'basic', 
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise'
} as const;

export const SUBSCRIPTION_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: {
    scansPerMonth: 5,
    queriesPerScan: 3,
    historyRetention: 30, // days
    exportFormats: ['csv']
  },
  [SUBSCRIPTION_TIERS.BASIC]: {
    scansPerMonth: 50,
    queriesPerScan: 5,
    historyRetention: 90, // days
    exportFormats: ['csv', 'json']
  },
  [SUBSCRIPTION_TIERS.PREMIUM]: {
    scansPerMonth: 200,
    queriesPerScan: 10,
    historyRetention: 365, // days
    exportFormats: ['csv', 'json', 'pdf']
  },
  [SUBSCRIPTION_TIERS.ENTERPRISE]: {
    scansPerMonth: -1, // unlimited
    queriesPerScan: 20,
    historyRetention: -1, // unlimited
    exportFormats: ['csv', 'json', 'pdf', 'xlsx']
  }
} as const;

// Error codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED'
} as const;

// Analytics events
export const ANALYTICS_EVENTS = {
  SCAN_STARTED: 'scan_started',
  SCAN_COMPLETED: 'scan_completed',
  SCAN_FAILED: 'scan_failed',
  CITATION_CLICKED: 'citation_clicked',
  EXPORT_INITIATED: 'export_initiated',
  FILTER_APPLIED: 'filter_applied',
  SEARCH_PERFORMED: 'search_performed',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded'
} as const;
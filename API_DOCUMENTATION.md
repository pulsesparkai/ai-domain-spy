# API Endpoints Documentation

## Overview
PulseSpark uses a combination of internal Supabase Edge Functions and external AI APIs to provide comprehensive brand monitoring, citation extraction, and website analysis capabilities.

## Authentication
All API calls require authentication. Include the Bearer token from Supabase session in the Authorization header:

```
Authorization: Bearer {supabase_session_token}
```

## Base URLs

### Production
- **Primary API**: `https://api.pulsespark.ai`
- **Supabase Functions**: `https://ljhcqubwczhtwrfpploa.supabase.co/functions/v1`

### Staging
- **Primary API**: `https://staging-api.pulsespark.ai`
- **Supabase Functions**: `https://ljhcqubwczhtwrfpploa.supabase.co/functions/v1`

### Development
- **Primary API**: `http://localhost:3000`
- **Supabase Functions**: `https://ljhcqubwczhtwrfpploa.supabase.co/functions/v1`

## Core Endpoints

### 1. Website Analysis & Scanning

#### Perplexity Scan
```http
POST /functions/v1/perplexity-scan
Content-Type: application/json
Authorization: Bearer {token}

{
  "targetUrl": "https://example.com",
  "queries": ["brand reputation", "user reviews"],
  "analysisDepth": "detailed"
}
```

**Response:**
```json
{
  "scanId": "uuid",
  "status": "completed",
  "results": {
    "citations": [
      {
        "url": "https://source.com",
        "title": "Article Title",
        "snippet": "Relevant content snippet",
        "platform": "AI Search",
        "relevanceScore": 0.85,
        "sentiment": "positive"
      }
    ],
    "rankings": [...],
    "entities": [...],
    "sentiment": {...}
  }
}
```

#### OpenAI Analysis
```http
POST /functions/v1/openai-scan
Content-Type: application/json
Authorization: Bearer {token}

{
  "targetUrl": "https://example.com",
  "scanType": "comprehensive",
  "options": {
    "includeCompetitors": true,
    "analysisDepth": "detailed"
  }
}
```

#### DeepSeek Analysis
```http
POST /functions/v1/deepseek-scan
Content-Type: application/json
Authorization: Bearer {token}

{
  "content": "Website content to analyze",
  "analysisType": "optimization"
}
```

### 2. Brand Monitoring

#### Get Brand Mentions
```http
GET /api/brand-mentions?brand={brandName}&limit=50&platform={platform}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "mentions": [
    {
      "id": "uuid",
      "platform": "AI Search Results",
      "mentionText": "Brand mention content",
      "url": "https://source.com",
      "sentiment": "positive",
      "relevanceScore": 0.90,
      "contextType": "review",
      "aiGenerated": true,
      "mentionDate": "2024-01-15T10:30:00Z"
    }
  ],
  "totalCount": 123,
  "platforms": ["AI Search Results", "News Articles", "Blog Posts"]
}
```

#### Store Brand Mention
```http
POST /api/brand-mentions
Content-Type: application/json
Authorization: Bearer {token}

{
  "brandName": "Your Brand",
  "platform": "AI Search Results",
  "mentionText": "Content mentioning the brand",
  "url": "https://source.com",
  "sentiment": "positive",
  "relevanceScore": 0.85,
  "contextType": "review",
  "aiGenerated": true
}
```

### 3. Citation Management

#### Get Citations
```http
GET /api/citations?scanId={scanId}&status={status}&platform={platform}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "citations": [
    {
      "id": "uuid",
      "url": "https://cited-source.com",
      "title": "Article Title",
      "snippet": "Citation content",
      "platform": "AI Search",
      "relevanceScore": 0.88,
      "domainAuthority": 75,
      "sentiment": "positive",
      "status": "active",
      "aiModel": "perplexity",
      "queryContext": "brand reputation",
      "clickable": true,
      "lastVerified": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Store Citation
```http
POST /api/citations
Content-Type: application/json
Authorization: Bearer {token}

{
  "scanId": "uuid",
  "url": "https://source.com",
  "title": "Citation Title",
  "snippet": "Relevant snippet",
  "platform": "AI Search",
  "relevanceScore": 0.85,
  "domainAuthority": 70,
  "sentiment": "positive",
  "aiModel": "perplexity",
  "queryContext": "brand analysis"
}
```

### 4. Trend Analysis

#### Get Trending Searches
```http
GET /functions/v1/trending-pages
Authorization: Bearer {token}
```

#### Google Trends Analysis
```http
POST /api/trends-analysis
Content-Type: application/json
Authorization: Bearer {token}

{
  "keywords": ["your brand", "competitor"],
  "timeframe": "today 3-m",
  "geo": "US"
}
```

### 5. User Management

#### Get User Profile
```http
GET /api/profile
Authorization: Bearer {token}
```

#### Update Profile
```http
PUT /api/profile
Content-Type: application/json
Authorization: Bearer {token}

{
  "fullName": "User Name",
  "brandProfile": {
    "brandName": "Your Brand",
    "brandDomain": "yourbrand.com",
    "industry": "Technology",
    "keywords": ["keyword1", "keyword2"],
    "competitors": ["competitor1", "competitor2"]
  }
}
```

### 6. Scan History

#### Get Scan History
```http
GET /api/scans?limit=20&offset=0&type={scanType}
Authorization: Bearer {token}
```

#### Get Scan Details
```http
GET /api/scans/{scanId}
Authorization: Bearer {token}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Invalid or expired token",
    "details": "Additional error details"
  }
}
```

### Common Error Codes
- `AUTHENTICATION_ERROR`: Invalid or missing authentication
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INSUFFICIENT_CREDITS`: Not enough scan credits
- `VALIDATION_ERROR`: Invalid request data
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `INTERNAL_SERVER_ERROR`: Server-side error

## Rate Limits

### Standard Plan
- **Scans**: 100 per month
- **API Calls**: 1000 per day
- **Citations**: 500 per month

### Premium Plan
- **Scans**: 500 per month
- **API Calls**: 5000 per day
- **Citations**: Unlimited

## Webhooks

### Scan Completion
```http
POST {your_webhook_url}
Content-Type: application/json

{
  "event": "scan.completed",
  "scanId": "uuid",
  "userId": "uuid",
  "results": {...},
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### New Citation Found
```http
POST {your_webhook_url}
Content-Type: application/json

{
  "event": "citation.discovered",
  "citationId": "uuid",
  "brandName": "Your Brand",
  "citation": {...},
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## SDK Examples

### JavaScript/TypeScript
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Perform a scan
async function performScan(targetUrl, queries) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch('/functions/v1/perplexity-scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      targetUrl,
      queries,
      analysisDepth: 'detailed'
    })
  });
  
  return response.json();
}

// Store citation
async function storeCitation(citation) {
  const { data, error } = await supabase
    .from('citations')
    .insert(citation)
    .select();
    
  return { data, error };
}
```

### Python
```python
import requests
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def perform_scan(target_url, queries, token):
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    
    data = {
        'targetUrl': target_url,
        'queries': queries,
        'analysisDepth': 'detailed'
    }
    
    response = requests.post(
        f'{SUPABASE_URL}/functions/v1/perplexity-scan',
        headers=headers,
        json=data
    )
    
    return response.json()
```

## Testing

### Development Environment
Use the development endpoints with test data:
- All scans return mock results
- No external API calls are made
- No credits are consumed

### Staging Environment
Use staging for integration testing:
- Real API calls with reduced rate limits
- Test data is automatically cleaned up
- Separate database from production

## Support

For API support and questions:
- **Documentation**: [https://docs.pulsespark.ai](https://docs.pulsespark.ai)
- **Support Email**: support@pulsespark.ai
- **Discord Community**: [PulseSpark Discord](https://discord.gg/pulsespark)
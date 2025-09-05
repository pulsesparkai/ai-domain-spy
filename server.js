import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['https://app.pulsespark.ai', 'https://ai-domain-spy.lovable.app', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: "PulseSpark AI Backend", 
    status: "running",
    timestamp: new Date().toISOString()
  });
});

app.post('/api/analyze-website', async (req, res) => {
  try {
    const { url } = req.body;
    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
    
    if (!PERPLEXITY_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const queries = [
      `What is ${domain}?`,
      `${domain} services and features`,
      `${domain} company information`
    ];
    
    let mentions = 0;
    let citations = 0;
    
    for (const query of queries) {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: query }],
          temperature: 0.2,
          return_citations: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content.toLowerCase();
        if (content.includes(domain.toLowerCase())) mentions++;
        if (data.citations) citations += data.citations.length;
      }
    }
    
    const visibilityScore = Math.min(100, Math.round((mentions * 30) + (citations * 10)));
    
    res.json({
      domain,
      visibilityScore,
      metrics: {
        totalQueries: queries.length,
        mentionedIn: mentions,
        citationsFound: citations
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
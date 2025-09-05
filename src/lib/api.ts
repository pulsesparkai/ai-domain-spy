const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.pulsespark.ai';

export const api = {
  // Test connection endpoint
  async testConnection() {
    const response = await fetch(`${API_BASE_URL}/api/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('API connection failed');
    return response.json();
  },

  // Analyze website endpoint
  async analyzeWebsite(url: string) {
    const response = await fetch(`${API_BASE_URL}/api/deepseek/analyze-website`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) throw new Error('Analysis failed');
    return response.json();
  }
};
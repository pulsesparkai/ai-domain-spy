const API_BASE_URL = 'https://api.pulsespark.ai';

export const api = {
  // Test connection endpoint
  async testConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error: ${response.status} - ${errorText}`);
      }
      return response.json();
    } catch (error) {
      console.error('API connection failed:', error);
      throw error;
    }
  },

  // Analyze website endpoint
  async analyzeWebsite(url: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-website`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error: ${response.status} - ${errorText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Website analysis failed:', error);
      throw error;
    }
  }
};
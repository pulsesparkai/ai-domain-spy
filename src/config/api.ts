// API Configuration
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pulsespark-api-3000.onrender.com';

console.log('API_BASE_URL:', API_BASE_URL); // Debug log

// Remove any /api prefix from frontend routes
export const api = {
  baseUrl: API_BASE_URL,
  
  // For any logging endpoints (if needed)
  async sendLog(data: any) {
    // If logs aren't needed, remove this function entirely
    return Promise.resolve(); // Disable logging for now
  },
  
  // Test connection
  async testConnection() {
    const response = await fetch(`${API_BASE_URL}/`);
    if (!response.ok) throw new Error('API connection failed');
    return response.json();
  },
  
  // Analyze website
  async analyzeWebsite(url: string) {
    const response = await fetch(`${API_BASE_URL}/api/deepseek/analyze-website`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!response.ok) throw new Error('Analysis failed');
    return response.json();
  }
};
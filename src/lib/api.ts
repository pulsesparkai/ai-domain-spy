import { supabase } from '@/integrations/supabase/client';

const API_BASE_URL = 'https://api.pulsespark.ai';

export const api = {
  async testConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/test`);
      if (!response.ok) throw new Error('API connection failed');
      return response.json();
    } catch (error) {
      console.error('API connection failed:', error);
      throw error;
    }
  },

  async analyzeWebsite(url: string, userId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${API_BASE_URL}/api/analyze-website`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': session ? `Bearer ${session.access_token}` : ''
      },
      body: JSON.stringify({ url, userId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis failed');
    }
    
    return response.json();
  }
};
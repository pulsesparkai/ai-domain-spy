import axios from 'axios';

export class DuckDuckGoAPI {
  static async getTrending(query: string) {
    try {
      const response = await axios.get('https://api.duckduckgo.com/', {
        params: {
          q: query,
          format: 'json',
          no_redirect: '1'
        }
      });

      return {
        results: response.data.Results || [],
        relatedTopics: response.data.RelatedTopics || []
      };
    } catch (error) {
      console.error('DuckDuckGo API error:', error);
      return { results: [], relatedTopics: [] };
    }
  }
}
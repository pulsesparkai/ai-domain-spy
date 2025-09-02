import googleTrends from 'google-trends-api';

export class GoogleTrendsAPI {
  static async getInterest(keyword: string) {
    try {
      const results = await googleTrends.interestOverTime({
        keyword,
        startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        granularTimeResolution: true
      });

      return JSON.parse(results);
    } catch (error) {
      console.error('Google Trends API error:', error);
      return { default: { timelineData: [] } };
    }
  }
}
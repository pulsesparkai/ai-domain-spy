import { useEffect, useState } from 'react';

export const useMockData = () => {
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('dev-mode');
    setDevMode(stored === 'true');
  }, []);

  const mockScanResults = {
    queries: [
      {
        query: "AI search optimization",
        perplexity: {
          content: "AI search optimization involves techniques to improve visibility in AI-powered search engines...",
          citations: ["https://example.com/ai-seo", "https://example.com/optimization"]
        },
        sentiment: { sentiment: "positive" },
        mentions: ["PulseSpark", "AI optimization"],
        rank: "primary",
        trends: {
          default: {
            timelineData: [
              { time: "1640995200", formattedTime: "Jan 1, 2022", value: [45] },
              { time: "1643673600", formattedTime: "Feb 1, 2022", value: [52] },
              { time: "1646092800", formattedTime: "Mar 1, 2022", value: [48] }
            ]
          }
        }
      }
    ],
    aggregates: {
      totalMentions: 24,
      primaryRank: 8,
      secondaryRank: 12,
      noRank: 4,
      sentimentBreakdown: {
        positive: 15,
        neutral: 7,
        negative: 2
      }
    }
  };

  return {
    devMode,
    mockScanResults
  };
};
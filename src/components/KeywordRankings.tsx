import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const KeywordRankings = () => {
  const keywords = [
    { keyword: 'AI visibility tracker', position: 3, change: 2, volume: 1200 },
    { keyword: 'Perplexity SEO tool', position: 5, change: -1, volume: 800 },
    { keyword: 'LLM optimization', position: 8, change: 0, volume: 2500 },
    { keyword: 'AI search analytics', position: 2, change: 5, volume: 3200 },
    { keyword: 'ChatGPT ranking tool', position: 12, change: -3, volume: 1800 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyword Rankings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {keywords.map((kw) => (
            <div key={kw.keyword} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
              <div className="flex-1">
                <p className="font-medium">{kw.keyword}</p>
                <p className="text-sm text-muted-foreground">Volume: {kw.volume.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={kw.position <= 3 ? 'default' : kw.position <= 10 ? 'secondary' : 'outline'}>
                  #{kw.position}
                </Badge>
                <div className="flex items-center gap-1">
                  {kw.change > 0 && <TrendingUp className="w-4 h-4 text-green-500" />}
                  {kw.change < 0 && <TrendingDown className="w-4 h-4 text-red-500" />}
                  {kw.change === 0 && <Minus className="w-4 h-4 text-gray-500" />}
                  <span className={`text-sm font-medium ${kw.change > 0 ? 'text-green-500' : kw.change < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {Math.abs(kw.change)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
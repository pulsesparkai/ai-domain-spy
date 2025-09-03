import { memo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Globe } from 'lucide-react';
import { callEdgeFunction } from '@/lib/api-client';

interface TrendingPagesProps {
  scanData?: any;
}

export const TrendingPages = memo(({ scanData }: TrendingPagesProps) => {
  const [pagesData, setPagesData] = useState<any[]>([]);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const competitors = Object.keys(scanData?.aggregates?.citationDomains || {})
          .slice(0, 3);

        if (competitors.length > 0) {
          const data = await callEdgeFunction('trending-pages', {
            competitors,
            days: 30
          });

          if (data?.pages) {
            setPagesData(data.pages);
          }
        }
      } catch (error) {
        console.error('Error fetching trending pages:', error);
      }
    };

    if (scanData) {
      fetchPages();
    }
  }, [scanData]);

  const groupedPages = pagesData.reduce((acc, page) => {
    if (!acc[page.competitor]) acc[page.competitor] = [];
    acc[page.competitor].push(page);
    return acc;
  }, {});

  return (
    <Card className="shadow-card animate-fade-in">
      <CardHeader>
        <CardTitle className="text-h3 flex items-center gap-2">
          <Globe className="w-5 h-5 text-accent" />
          Trending Pages
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(groupedPages).length > 0 ? (
          <Accordion type="single" collapsible>
            {Object.entries(groupedPages).map(([competitor, pages]: [string, any]) => (
              <AccordionItem key={competitor} value={competitor}>
                <AccordionTrigger className="text-sm font-medium hover-scale">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
                    <span className="text-left">{competitor}</span>
                    <span className="text-xs text-muted-foreground mt-1 sm:mt-0">
                      {pages.length} pages
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {pages.slice(0, 5).map((page: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3 text-xs sm:text-sm hover-scale transition-all duration-200 bg-card">
                        <div className="font-medium mb-2 line-clamp-2">{page.title}</div>
                        <div className="text-muted-foreground">
                          {new Date(page.publishedDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            No trending pages data available
          </p>
        )}
      </CardContent>
    </Card>
  );
});

TrendingPages.displayName = 'TrendingPages';
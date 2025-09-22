import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Eye, 
  Globe, 
  TrendingUp, 
  FileText, 
  Users, 
  Target,
  ExternalLink,
  Award,
  Lightbulb,
  Activity
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
  isNew?: boolean;
}

interface DashboardNavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
  scanData?: any;
}

const DashboardNavigation: React.FC<DashboardNavigationProps> = ({
  activeView,
  onViewChange,
  scanData
}) => {
  const navigationItems: NavigationItem[] = [
    {
      id: 'visibility',
      label: 'Visibility Score',
      icon: <Eye className="h-4 w-4" />,
      description: 'Overall AI visibility metrics and trends'
    },
    {
      id: 'brand-monitoring',
      label: 'Brand Monitoring',
      icon: <Activity className="h-4 w-4" />,
      description: 'Track brand mentions across AI platforms',
      isNew: true
    },
    {
      id: 'citation-extractor',
      label: 'Citation Tracking',
      icon: <ExternalLink className="h-4 w-4" />,
      description: 'Real-time citation extraction and analysis',
      isNew: true
    },
    {
      id: 'domain-ranking',
      label: 'Domain Rankings',
      icon: <Award className="h-4 w-4" />,
      description: 'Domain authority and ranking analysis',
      isNew: true
    },
    {
      id: 'content-optimizer',
      label: 'Content Optimizer',
      icon: <Lightbulb className="h-4 w-4" />,
      description: 'AI-powered content optimization suggestions',
      isNew: true
    },
    {
      id: 'perplexity',
      label: 'Perplexity Insights',
      icon: <Target className="h-4 w-4" />,
      description: 'Deep insights from Perplexity AI analysis'
    },
    {
      id: 'trends',
      label: 'Trending Searches',
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'Current trending topics and keywords'
    },
    {
      id: 'citations',
      label: 'Citations List',
      icon: <FileText className="h-4 w-4" />,
      description: 'All citations from latest scans',
      badge: scanData?.citations?.length?.toString()
    },
    {
      id: 'sentiment',
      label: 'Sentiment Analysis',
      icon: <Users className="h-4 w-4" />,
      description: 'Brand sentiment across platforms'
    },
    {
      id: 'rankings',
      label: 'Rankings Table',
      icon: <BarChart3 className="h-4 w-4" />,
      description: 'Detailed ranking breakdowns'
    },
    {
      id: 'reports',
      label: 'Scan History',
      icon: <Globe className="h-4 w-4" />,
      description: 'Historical scan data and reports'
    }
  ];

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant={activeView === item.id ? 'default' : 'ghost'}
              onClick={() => onViewChange(item.id)}
              className="flex flex-col items-center gap-2 h-auto p-3 relative"
            >
              {item.isNew && (
                <Badge className="absolute -top-1 -right-1 px-1 py-0 text-xs bg-green-500">
                  New
                </Badge>
              )}
              <div className="flex items-center gap-1">
                {item.icon}
                {item.badge && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <div className="text-center">
                <div className="text-xs font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground hidden md:block">
                  {item.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardNavigation;
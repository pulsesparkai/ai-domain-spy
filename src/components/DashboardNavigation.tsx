import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Workflow, 
  Network, 
  Search, 
  BarChart3, 
  TrendingUp, 
  Quote, 
  Heart, 
  Target 
} from 'lucide-react';

interface DashboardNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navigationItems = [
  { id: 'overview', label: 'AI Visibility', icon: Eye },
  { id: 'workflow', label: 'Workflow', icon: Workflow },
  { id: 'network-map', label: 'Network Map', icon: Network },
  { id: 'discover', label: 'Discover Analysis', icon: Search },
  { id: 'domain', label: 'Enhanced Domain Analysis', icon: BarChart3 },
  { id: 'trends', label: 'Trending Searches', icon: TrendingUp },
  { id: 'citations', label: 'Citations', icon: Quote },
  { id: 'sentiment', label: 'Sentiment', icon: Heart },
  { id: 'rankings', label: 'Rankings', icon: Target },
];

const DashboardNavigation: React.FC<DashboardNavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(item.id)}
                className={`
                  flex items-center gap-2 whitespace-nowrap transition-all
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavigation;
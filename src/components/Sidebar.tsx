import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from '@/components/ui/navigation-menu';
import { 
  Eye, 
  Zap, 
  Network, 
  Search, 
  Globe, 
  TrendingUp, 
  Link, 
  Smile, 
  BarChart3, 
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const sidebarItems = [
  { id: 'overview', label: 'AI Visibility', icon: Eye },
  { id: 'workflow', label: 'Workflow', icon: Zap },
  { id: 'network', label: 'Network Map', icon: Network },
  { id: 'discover', label: 'Discover Analysis', icon: Search },
  { id: 'enhanced-domain', label: 'Enhanced Domain Analysis', icon: Globe },
  { id: 'trends', label: 'Trending Searches', icon: TrendingUp },
  { id: 'citations', label: 'Citations', icon: Link },
  { id: 'sentiment', label: 'Sentiment', icon: Smile },
  { id: 'rankings', label: 'Rankings', icon: BarChart3 },
];

export const Sidebar = ({ activeView, onViewChange }: SidebarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleViewChange = (view: string) => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <nav className="p-4 space-y-2">
      <NavigationMenu orientation="vertical" className="w-full">
        <NavigationMenuList className="flex-col space-y-2 w-full">
          {sidebarItems.map((item) => (
            <NavigationMenuItem key={item.id} className="w-full">
              <button
                onClick={() => handleViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                  activeView === item.id
                    ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                    : 'hover:bg-purple-100 text-muted-foreground hover:text-foreground dark:hover:bg-purple-900/20'
                }`}
                aria-current={activeView === item.id ? 'page' : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{item.label}</span>
              </button>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-card border-r min-h-[calc(100vh-73px)]">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="bg-card shadow-md"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-sidebar"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="w-64 bg-card p-0"
            id="mobile-sidebar"
            aria-label="Navigation menu"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold text-foreground">Navigation</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close menu</span>
                </Button>
              </div>

              {/* Navigation Content */}
              <div className="flex-1 overflow-y-auto">
                <SidebarContent />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default Sidebar;
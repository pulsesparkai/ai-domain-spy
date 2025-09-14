import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from '@/components/ui/navigation-menu';
import { 
  Home,
  Search,
  BarChart3,
  Link as LinkIcon,
  Heart,
  Settings,
  Eye, 
  Workflow, 
  Network, 
  Globe, 
  TrendingUp, 
  Quote, 
  Target,
  FileText,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  activeView?: string;
  onViewChange?: (view: string) => void;
}

// Top-level navigation items (routes)
const topLevelItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, route: '/dashboard' },
  { id: 'scan', label: 'Scan', icon: Search, route: '/scan' },
  { id: 'settings', label: 'Settings', icon: Settings, route: '/settings' },
];

// Dashboard sub-view items
const dashboardViewItems = [
  { id: 'visibility', label: 'AI Visibility', icon: Eye },
  { id: 'workflow', label: 'Workflow', icon: Workflow },
  { id: 'network-map', label: 'Network Map', icon: Network },
  { id: 'discover', label: 'Discover Analysis', icon: Search },
  { id: 'domain', label: 'Enhanced Domain Analysis', icon: Globe },
  { id: 'trends', label: 'Trending Searches', icon: TrendingUp },
  { id: 'citations', label: 'Citations', icon: Quote },
  { id: 'sentiment', label: 'Sentiment', icon: Heart },
  { id: 'rankings', label: 'Rankings', icon: Target },
  { id: 'reports', label: 'Reports', icon: FileText },
];

export const Sidebar = ({ activeView, onViewChange }: SidebarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Don't render sidebar if user is not authenticated
  if (!user) {
    return null;
  }

  const handleTopLevelNavigation = (route: string) => {
    navigate(route);
    setIsMobileMenuOpen(false);
  };

  const handleViewChange = (view: string) => {
    if (onViewChange) {
      onViewChange(view);
    }
    setIsMobileMenuOpen(false);
  };

  const isActiveRoute = (route: string) => {
    return location.pathname === route;
  };

  const isActiveView = (viewId: string) => {
    return activeView === viewId;
  };

  const SidebarContent = () => (
    <nav className="p-4 space-y-4">
      {/* Top-level navigation */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Navigation</h3>
        <NavigationMenu orientation="vertical" className="w-full">
          <NavigationMenuList className="flex-col space-y-1 w-full">
            {topLevelItems.map((item) => (
              <NavigationMenuItem key={item.id} className="w-full">
                <button
                  onClick={() => handleTopLevelNavigation(item.route)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    isActiveRoute(item.route)
                      ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                      : 'hover:bg-purple-100 text-muted-foreground hover:text-foreground dark:hover:bg-purple-900/20'
                  }`}
                  aria-current={isActiveRoute(item.route) ? 'page' : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{item.label}</span>
                </button>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Dashboard sub-views (only show when on dashboard route) */}
      {location.pathname === '/dashboard' && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">Dashboard Views</h3>
          <NavigationMenu orientation="vertical" className="w-full">
            <NavigationMenuList className="flex-col space-y-1 w-full">
              {dashboardViewItems.map((item) => (
                <NavigationMenuItem key={item.id} className="w-full">
                  <button
                    onClick={() => handleViewChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                      isActiveView(item.id)
                        ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                        : 'hover:bg-purple-100 text-muted-foreground hover:text-foreground dark:hover:bg-purple-900/20'
                    }`}
                    aria-current={isActiveView(item.id) ? 'page' : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      )}

      {/* Quick actions */}
      {location.pathname === '/dashboard' && (
        <div className="pt-4 border-t">
          <Button 
            onClick={() => handleTopLevelNavigation('/scan')} 
            variant="outline" 
            size="sm" 
            className="w-full"
          >
            Start New Scan
          </Button>
        </div>
      )}
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
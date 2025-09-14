import { 
  Home,
  Search, 
  BarChart3,
  Link,
  Heart,
  Settings,
  Eye, 
  Workflow, 
  Network, 
  Globe, 
  TrendingUp, 
  Quote, 
  Target,
  FileText 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface DashboardSidebarProps {
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

// Top-level navigation items (routes)
const topLevelItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, route: '/dashboard' },
  { id: 'scan', label: 'Scan', icon: Search, route: '/scan' },
  { id: 'settings', label: 'Settings', icon: Settings, route: '/settings' },
];

// Dashboard sub-view items (tabs within dashboard)
const dashboardItems = [
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

export function DashboardSidebar({ activeTab, onTabChange }: DashboardSidebarProps) {
  const { collapsed } = useSidebar();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Don't render sidebar if user is not authenticated
  if (!user) {
    return null;
  }

  const handleTopLevelNavigation = (route: string) => {
    navigate(route);
  };

  const handleDashboardTabChange = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const isActiveRoute = (route: string) => {
    return location.pathname === route;
  };

  const isActiveTab = (tabId: string) => {
    return activeTab === tabId;
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"}>
      <SidebarContent>
        {/* Top-level navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {topLevelItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    onClick={() => handleTopLevelNavigation(item.route)}
                    className={`cursor-pointer ${
                      isActiveRoute(item.route)
                        ? "bg-primary/10 text-primary font-medium" 
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Dashboard sub-views (only show when on dashboard route) */}
        {location.pathname === '/dashboard' && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
              Dashboard Views
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {dashboardItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton 
                      onClick={() => handleDashboardTabChange(item.id)}
                      className={`cursor-pointer ${
                        isActiveTab(item.id)
                          ? "bg-primary/10 text-primary font-medium" 
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Quick actions when no data */}
        {location.pathname === '/dashboard' && !collapsed && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-3 py-2">
                <Button 
                  onClick={() => navigate('/scan')} 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  Start New Scan
                </Button>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
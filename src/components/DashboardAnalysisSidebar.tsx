import { 
  Eye, 
  Globe, 
  TrendingUp, 
  Quote, 
  Heart, 
  Target,
  FileText,
  Terminal
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
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

interface DashboardAnalysisSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

// Main navigation items
const mainNavItems = [
  { id: 'command-center', label: 'Command Center', icon: Terminal, path: '/command-center' },
  { id: 'settings', label: 'Settings', icon: FileText, path: '/settings' },
];

// Only dashboard analysis views - for dashboard page internal navigation
const analysisViews = [
  { id: 'visibility', label: 'AI Visibility', icon: Eye },
  { id: 'domain', label: 'Domain Analysis', icon: Globe },
  { id: 'trends', label: 'Trending Prompts', icon: TrendingUp },
  { id: 'citations', label: 'Citations', icon: Quote },
  { id: 'sentiment', label: 'Sentiment Report', icon: Heart },
  { id: 'rankings', label: 'AI Rankings', icon: Target },
  { id: 'reports', label: 'Reports', icon: FileText },
];

export function DashboardAnalysisSidebar({ activeView, onViewChange }: DashboardAnalysisSidebarProps) {
  const { collapsed } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (item: typeof mainNavItems[0]) => {
    if (item.path === '/scan') {
      // For scan, navigate to the scan page
      navigate('/scan');
    } else if (item.path === '/command-center') {
      navigate('/command-center');
    } else if (item.path === '/dashboard') {
      navigate('/dashboard');
    } else if (item.path === '/settings') {
      navigate('/settings');
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const isDashboard = location.pathname === '/dashboard';

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"}>
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    onClick={() => handleNavigation(item)}
                    className={`cursor-pointer ${
                      isActive(item.path)
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

        {/* Dashboard Analysis Views - Only show when on dashboard */}
        {isDashboard && (
          <SidebarGroup>
            <SidebarGroupLabel>Analysis Views</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {analysisViews.map((view) => (
                  <SidebarMenuItem key={view.id}>
                  <SidebarMenuButton 
                      onClick={() => {
                        if (isDashboard) {
                          navigate(`/dashboard?view=${view.id}`);
                        }
                        onViewChange(view.id);
                      }}
                      className={`cursor-pointer ${
                        activeView === view.id
                          ? "bg-primary/10 text-primary font-medium" 
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <view.icon className="h-4 w-4" />
                      {!collapsed && <span>{view.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
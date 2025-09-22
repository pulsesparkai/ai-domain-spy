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

// All navigation items in one flat list
const allNavItems = [
  { id: 'command-center', label: 'Command Center', icon: Terminal, path: '/command-center' },
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

  const isDashboard = location.pathname === '/dashboard';
  
  const handleItemClick = (item: typeof allNavItems[0]) => {
    console.log('Navigating to:', item.path || `/dashboard?view=${item.id}`);
    if (item.path) {
      // Navigation items with paths
      navigate(item.path);
    } else {
      // Analysis view items
      if (isDashboard) {
        navigate(`/dashboard?view=${item.id}`);
      }
      onViewChange(item.id);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {allNavItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    onClick={() => handleItemClick(item)}
                    className={`cursor-pointer ${
                      (item.path && isActive(item.path)) || (!item.path && activeView === item.id)
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
      </SidebarContent>
    </Sidebar>
  );
}
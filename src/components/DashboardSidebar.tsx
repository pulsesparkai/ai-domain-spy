import { 
  Eye, 
  Workflow, 
  Network, 
  Search, 
  BarChart3, 
  TrendingUp, 
  Quote, 
  Heart, 
  Target,
  FileText 
} from 'lucide-react';
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
  activeTab: string;
  onTabChange: (value: string) => void;
}

const navigationItems = [
  { id: 'visibility', label: 'AI Visibility', icon: Eye },
  { id: 'workflow', label: 'Workflow', icon: Workflow },
  { id: 'network-map', label: 'Network Map', icon: Network },
  { id: 'discover', label: 'Discover Analysis', icon: Search },
  { id: 'domain', label: 'Enhanced Domain Analysis', icon: BarChart3 },
  { id: 'trends', label: 'Trending Searches', icon: TrendingUp },
  { id: 'citations', label: 'Citations', icon: Quote },
  { id: 'sentiment', label: 'Sentiment', icon: Heart },
  { id: 'rankings', label: 'Rankings', icon: Target },
  { id: 'reports', label: 'Reports', icon: FileText },
];

export function DashboardSidebar({ activeTab, onTabChange }: DashboardSidebarProps) {
  const { collapsed } = useSidebar();

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Dashboard
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    onClick={() => onTabChange(item.id)}
                    className={`cursor-pointer ${
                      activeTab === item.id 
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
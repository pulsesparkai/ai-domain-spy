import { 
  Eye, 
  Globe, 
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

interface DashboardAnalysisSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

// Only dashboard analysis views - no duplicate navigation
const analysisViews = [
  { id: 'visibility', label: 'AI Visibility', icon: Eye },
  { id: 'domain', label: 'Domain Analysis', icon: Globe },
  { id: 'trends', label: 'Trending Searches', icon: TrendingUp },
  { id: 'citations', label: 'Citations', icon: Quote },
  { id: 'sentiment', label: 'Sentiment', icon: Heart },
  { id: 'rankings', label: 'Rankings', icon: Target },
  { id: 'reports', label: 'Reports', icon: FileText },
];

export function DashboardAnalysisSidebar({ activeView, onViewChange }: DashboardAnalysisSidebarProps) {
  const { collapsed } = useSidebar();

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {analysisViews.map((view) => (
                <SidebarMenuItem key={view.id}>
                  <SidebarMenuButton 
                    onClick={() => onViewChange(view.id)}
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
      </SidebarContent>
    </Sidebar>
  );
}
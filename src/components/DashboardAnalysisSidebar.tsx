import { 
  Eye, 
  Globe, 
  TrendingUp, 
  Quote, 
  Heart, 
  Target,
  FileText,
  Command
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

const navigationItems = [
  { icon: Command, label: 'Command Center', path: '/command-center' },
  { icon: Eye, label: 'AI Visibility', path: '/dashboard?view=visibility' },
  { icon: Globe, label: 'Domain Analysis', path: '/dashboard?view=domain' },
  { icon: TrendingUp, label: 'Trending Prompts', path: '/dashboard?view=trends' },
  { icon: Quote, label: 'Citations', path: '/dashboard?view=citations' },
  { icon: Heart, label: 'Sentiment Report', path: '/dashboard?view=sentiment' },
  { icon: Target, label: 'AI Rankings', path: '/dashboard?view=rankings' },
  { icon: FileText, label: 'Reports', path: '/dashboard?view=reports' }
];

export function DashboardAnalysisSidebar({ activeView, onViewChange }: DashboardAnalysisSidebarProps) {
  const { collapsed } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname + location.search === path;

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.path)}
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
      </SidebarContent>
    </Sidebar>
  );
}
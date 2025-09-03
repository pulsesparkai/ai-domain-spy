import { memo, ReactNode } from "react";
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
  latestScan?: any;
  onNavigateToScan: () => void;
}

// Memoized Dashboard Header
const DashboardHeader = memo(({ latestScan, onNavigateToScan }: { 
  latestScan: any; 
  onNavigateToScan: () => void; 
}) => (
  <div className="mb-6 flex items-center justify-between animate-fade-in">
    <div>
      <h1 className="text-3xl font-bold text-foreground">AI Visibility Dashboard</h1>
      <p className="text-muted-foreground">
        {latestScan ? 
          `Last scan: ${new Date(latestScan.created_at).toLocaleDateString()}` :
          'Run your first scan to see data here'
        }
      </p>
    </div>
    <div className="flex space-x-2">
      <Button 
        onClick={onNavigateToScan}
        variant="default"
        className="hover-scale"
      >
        Run New Scan
      </Button>
      <SidebarTrigger />
    </div>
  </div>
));

DashboardHeader.displayName = 'DashboardHeader';

// Memoized Navigation Sidebar
const DashboardSidebar = memo(() => (
  <Sidebar className="w-64 border-r border-border bg-sidebar animate-slide-in-right">
    <SidebarContent className="p-4">
      <div className="space-y-4">
        <div className="text-sidebar-foreground font-semibold">Dashboard</div>
        <nav className="space-y-2">
          <a href="#visibility" className="block px-3 py-2 rounded-md bg-primary text-primary-foreground story-link">
            AI Visibility
          </a>
          <a href="#citations" className="block px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent story-link">
            Citations
          </a>
          <a href="#sentiment" className="block px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent story-link">
            Sentiment
          </a>
          <a href="#rankings" className="block px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent story-link">
            Rankings
          </a>
        </nav>
      </div>
    </SidebarContent>
  </Sidebar>
));

DashboardSidebar.displayName = 'DashboardSidebar';

export const DashboardLayout = ({ children, latestScan, onNavigateToScan }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <DashboardSidebar />

          <main className="flex-1 overflow-auto p-6">
            <DashboardHeader 
              latestScan={latestScan} 
              onNavigateToScan={onNavigateToScan}
            />
            {children}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};
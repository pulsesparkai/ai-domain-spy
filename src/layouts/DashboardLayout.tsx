import { DashboardAnalysisSidebar } from '@/components/DashboardAnalysisSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useLocation, Outlet, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children?: React.ReactNode;
  activeView?: string;
  onViewChange?: (view: string) => void;
}

export const DashboardLayout = ({ children, activeView, onViewChange }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDashboard = location.pathname === '/dashboard';
  
  // Get active view from URL for dashboard
  const currentView = isDashboard ? (searchParams.get('view') || 'visibility') : 'visibility';

  const handleViewChange = (view: string) => {
    if (isDashboard) {
      navigate(`/dashboard?view=${view}`);
    }
    if (onViewChange) {
      onViewChange(view);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DashboardAnalysisSidebar 
          activeView={activeView || currentView} 
          onViewChange={handleViewChange} 
        />
        <main className="flex-1">
          <header className="h-12 flex items-center border-b bg-background px-4 justify-between">
            <SidebarTrigger />
            <Button 
              variant="outline"
              onClick={() => navigate('/scan')}
              size="sm"
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              New Scan
            </Button>
          </header>
          {children || <Outlet />}
        </main>
      </div>
    </SidebarProvider>
  );
};
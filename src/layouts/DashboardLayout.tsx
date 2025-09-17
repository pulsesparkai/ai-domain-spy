import { DashboardAnalysisSidebar } from '@/components/DashboardAnalysisSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useLocation, Outlet } from 'react-router-dom';
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
  const isDashboard = location.pathname === '/dashboard';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DashboardAnalysisSidebar 
          activeView={activeView || 'visibility'} 
          onViewChange={onViewChange || (() => {})} 
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
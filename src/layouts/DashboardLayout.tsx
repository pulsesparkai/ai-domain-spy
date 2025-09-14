import { DashboardAnalysisSidebar } from '@/components/DashboardAnalysisSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeView?: string;
  onViewChange?: (view: string) => void;
}

export const DashboardLayout = ({ children, activeView, onViewChange }: DashboardLayoutProps) => {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {isDashboard && activeView && onViewChange && (
          <DashboardAnalysisSidebar 
            activeView={activeView} 
            onViewChange={onViewChange} 
          />
        )}
        <main className="flex-1">
          {isDashboard && (
            <header className="h-12 flex items-center border-b bg-background px-4">
              <SidebarTrigger />
            </header>
          )}
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};
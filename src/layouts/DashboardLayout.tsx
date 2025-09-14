import { Sidebar } from '@/components/Sidebar';
import { useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const showSidebar = ['/dashboard', '/scan', '/settings'].some(path => 
    location.pathname.startsWith(path)
  );

  return (
    <div className="flex h-screen bg-background">
      {showSidebar && <Sidebar />}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};
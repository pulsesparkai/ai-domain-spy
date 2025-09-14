import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Home,
  Search,
  Settings,
  Eye, 
  Globe, 
  TrendingUp, 
  Quote, 
  Heart, 
  Target,
  FileText,
  BarChart3
} from 'lucide-react';

interface SidebarProps {
  activeView?: string;
  onViewChange?: (view: string) => void;
}

export const Sidebar = ({ activeView, onViewChange }: SidebarProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Main navigation items
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, route: '/dashboard' },
    { id: 'scan', label: 'New Scan', icon: Search, route: '/scan' },
    { id: 'settings', label: 'Settings', icon: Settings, route: '/settings' },
  ];

  // Dashboard view tabs (only show when on dashboard)
  const dashboardViews = [
    { id: 'visibility', label: 'AI Visibility', icon: Eye },
    { id: 'domain', label: 'Domain Analysis', icon: Globe },
    { id: 'trends', label: 'Trending Searches', icon: TrendingUp },
    { id: 'citations', label: 'Citations', icon: Quote },
    { id: 'sentiment', label: 'Sentiment', icon: Heart },
    { id: 'rankings', label: 'Rankings', icon: Target },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const handleNavigation = (route) => {
    navigate(route);
  };

  const isDashboard = location.pathname === '/dashboard';

  if (!user) {
    return null;
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-white font-bold">P</span>
          </div>
          <span className="font-semibold text-xl">pulsespark.ai</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.route;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.route)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Dashboard Views - Only show when on dashboard */}
        {isDashboard && (
          <>
            <div className="mt-8 mb-2">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase">
                Analysis Views
              </h3>
            </div>
            <div className="space-y-1">
              {dashboardViews.map((view) => {
                const Icon = view.icon;
                const isActive = activeView === view.id;
                
                return (
                  <button
                    key={view.id}
                    onClick={() => onViewChange?.(view.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                      isActive
                        ? 'bg-purple-50 text-purple-600'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {view.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* User section */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.email || 'User'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
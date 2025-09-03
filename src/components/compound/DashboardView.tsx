import { ReactNode, createContext, useContext } from "react";
import { cn } from "@/lib/utils";

// Context for compound component communication
interface DashboardViewContextType {
  scanData?: any;
  loading?: boolean;
}

const DashboardViewContext = createContext<DashboardViewContextType>({});

// Root component
interface DashboardViewProps {
  children: ReactNode;
  scanData?: any;
  loading?: boolean;
  className?: string;
}

const DashboardViewRoot = ({ children, scanData, loading, className }: DashboardViewProps) => {
  return (
    <DashboardViewContext.Provider value={{ scanData, loading }}>
      <div className={cn("scan-results grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
        {children}
      </div>
    </DashboardViewContext.Provider>
  );
};

// Grid item component
interface DashboardGridItemProps {
  children: ReactNode;
  span?: "1" | "2" | "3";
  id?: string;
  className?: string;
}

const DashboardGridItem = ({ children, span = "1", id, className }: DashboardGridItemProps) => {
  const spanClasses = {
    "1": "",
    "2": "lg:col-span-2",
    "3": "lg:col-span-3"
  };

  return (
    <div id={id} className={cn(spanClasses[span], className)}>
      {children}
    </div>
  );
};

// Section wrapper with loading state
interface DashboardSectionProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const DashboardSection = ({ children, fallback }: DashboardSectionProps) => {
  const { loading } = useContext(DashboardViewContext);
  
  if (loading) {
    return fallback || <div className="animate-pulse bg-muted h-64 rounded"></div>;
  }
  
  return <>{children}</>;
};

// Hook to access dashboard context
export const useDashboardView = () => {
  const context = useContext(DashboardViewContext);
  if (!context) {
    throw new Error("useDashboardView must be used within DashboardView");
  }
  return context;
};

// Compound component exports
export const DashboardView = {
  Root: DashboardViewRoot,
  GridItem: DashboardGridItem,
  Section: DashboardSection,
};
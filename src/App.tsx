import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster as HotToaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import DependencyLoading from "@/components/DependencyLoading";
import { DataFlowProvider } from "@/components/DataFlowProvider";
import { Suspense, useEffect } from "react";
import { 
  LazyAuth,
  LazyCommandCenter,
  LazyDashboard,
  LazyScan,
  LazyPricing,
  LazySettings,
  LazySuccess,
  LazyCancel,
  LazyNotFound,
  LazyPasswordReset,
  
  RouteLoadingSkeleton,
  preloadCriticalRoutes
} from "@/utils/lazyRoutes";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Header } from "@/components/Header";
import { DashboardLayout } from "@/layouts/DashboardLayout";

// QueryClient initialized and ready

const AppLayout = () => {
  const location = useLocation();
  const hideHeaderRoutes = ['/auth', '/reset-password'];
  const shouldShowHeader = !hideHeaderRoutes.includes(location.pathname);

  return (
    <>
      {shouldShowHeader && <Header />}
      <div className={shouldShowHeader ? "pt-20" : ""}>
        <Suspense fallback={<RouteLoadingSkeleton />}>
           <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<LazyAuth />} />
            <Route path="/pricing" element={<LazyPricing />} />
            <Route path="/success" element={<LazySuccess />} />
            <Route path="/cancel" element={<LazyCancel />} />
            <Route path="/reset-password" element={<LazyPasswordReset />} />
           
           {/* Protected routes with dashboard layout */}
           <Route element={
             <ProtectedRoute>
               <DashboardLayout />
             </ProtectedRoute>
           }>
             <Route path="/command-center" element={<LazyCommandCenter />} />
             <Route path="/dashboard" element={<LazyDashboard />} />
             <Route path="/scan" element={<LazyScan />} />
             <Route path="/settings" element={<LazySettings />} />
           </Route>
           
           {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
           <Route path="*" element={<LazyNotFound />} />
         </Routes>
        </Suspense>
      </div>
    </>
  );
};

const App = () => {
  // Preload critical routes after initial render
  useEffect(() => {
    preloadCriticalRoutes();
  }, []);

  return (
    <ErrorBoundary>
      <AppErrorBoundary showReportButton>
        <AuthProvider>
          <DataFlowProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <HotToaster position="top-right" />
              <DependencyLoading showProgress showDetails retryable>
                <BrowserRouter>
                  <AppLayout />
                </BrowserRouter>
              </DependencyLoading>
            </TooltipProvider>
          </DataFlowProvider>
        </AuthProvider>
      </AppErrorBoundary>
    </ErrorBoundary>
  );
};

export default App;
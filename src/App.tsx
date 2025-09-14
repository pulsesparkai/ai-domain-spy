import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster as HotToaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import DependencyLoading from "@/components/DependencyLoading";
import { AccessibilityIndicator, AccessibilityToolbar } from "@/components/AccessibilityIndicator";
import { PreviewModeIndicator } from "@/components/PreviewModeIndicator";
import { Suspense, useEffect } from "react";
import { 
  LazyIndex,
  LazyAuth,
  LazyDashboard,
  LazyScan,
  LazyPricing,
  LazySettings,
  LazySuccess,
  LazyCancel,
  LazyAbout,
  LazyContact,
  LazyNotFound,
  LazyPasswordReset,
  
  RouteLoadingSkeleton,
  preloadCriticalRoutes
} from "@/utils/lazyRoutes";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Header } from "@/components/Header";
import { DashboardLayout } from "@/layouts/DashboardLayout";

// Create QueryClient with optimized configuration
import { createOptimizedQueryClient } from '@/lib/react-query-optimization';

const queryClient = createOptimizedQueryClient();

console.log('QueryClient initialized:', queryClient);

const App = () => {
  // Preload critical routes after initial render
  useEffect(() => {
    preloadCriticalRoutes();
  }, []);

  return (
    <ErrorBoundary>
      <AppErrorBoundary showReportButton>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <HotToaster position="top-right" />
              <DependencyLoading showProgress showDetails retryable>
                <BrowserRouter>
                  <Header />
                  <div className="pt-20">
                    <Suspense fallback={<RouteLoadingSkeleton />}>
                    <Routes>
                      <Route path="/" element={<LazyIndex />} />
                      <Route path="/auth" element={<LazyAuth />} />
                      <Route path="/pricing" element={<LazyPricing />} />
                      <Route path="/about" element={<LazyAbout />} />
                      <Route path="/contact" element={<LazyContact />} />
                      <Route path="/success" element={<LazySuccess />} />
                      <Route path="/cancel" element={<LazyCancel />} />
                      <Route path="/reset-password" element={<LazyPasswordReset />} />
                      
                      {/* Protected routes without dashboard layout (handled by individual pages) */}
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <LazyDashboard />
                        </ProtectedRoute>
                      } />
                      <Route path="/scan" element={
                        <ProtectedRoute>
                          <LazyScan />
                        </ProtectedRoute>
                      } />
                      <Route path="/settings" element={
                        <ProtectedRoute>
                          <LazySettings />
                        </ProtectedRoute>
                      } />
                      
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<LazyNotFound />} />
                    </Routes>
                    </Suspense>
                  </div>
                  <AccessibilityIndicator />
                  <AccessibilityToolbar />
                  <PreviewModeIndicator />
                </BrowserRouter>
              </DependencyLoading>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </AppErrorBoundary>
    </ErrorBoundary>
  );
};

export default App;
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster as HotToaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import DependencyLoading from "@/components/DependencyLoading";
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
  LazyNotFound,
  LazyPasswordReset,
  RouteLoadingSkeleton,
  preloadCriticalRoutes
} from "@/utils/lazyRoutes";

// Create QueryClient with proper configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
    },
  },
});

console.log('QueryClient initialized:', queryClient);

const App = () => {
  // Preload critical routes after initial render
  useEffect(() => {
    preloadCriticalRoutes();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <HotToaster position="top-right" />
            <DependencyLoading showProgress showDetails retryable>
              <BrowserRouter>
                <Suspense fallback={<RouteLoadingSkeleton />}>
                  <Routes>
                    <Route path="/" element={<LazyIndex />} />
                    <Route path="/auth" element={<LazyAuth />} />
                    <Route path="/dashboard" element={<LazyDashboard />} />
                    <Route path="/scan" element={<LazyScan />} />
                    <Route path="/pricing" element={<LazyPricing />} />
                    <Route path="/settings" element={<LazySettings />} />
                    <Route path="/success" element={<LazySuccess />} />
                    <Route path="/cancel" element={<LazyCancel />} />
                    <Route path="/reset-password" element={<LazyPasswordReset />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<LazyNotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </DependencyLoading>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
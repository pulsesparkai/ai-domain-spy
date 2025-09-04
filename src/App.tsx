import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster as HotToaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import DependencyLoading from "@/components/DependencyLoading";
import { AccessibilityIndicator, AccessibilityToolbar } from "@/components/AccessibilityIndicator";
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
  LazyPerplexityOptimization,
  RouteLoadingSkeleton,
  preloadCriticalRoutes
} from "@/utils/lazyRoutes";

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
                    <Route path="/perplexity-optimization" element={<LazyPerplexityOptimization />} />
                    <Route path="/success" element={<LazySuccess />} />
                    <Route path="/cancel" element={<LazyCancel />} />
                    <Route path="/reset-password" element={<LazyPasswordReset />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<LazyNotFound />} />
                  </Routes>
                </Suspense>
                <AccessibilityIndicator />
                <AccessibilityToolbar />
              </BrowserRouter>
            </DependencyLoading>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
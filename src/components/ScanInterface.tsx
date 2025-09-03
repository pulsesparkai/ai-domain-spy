import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { showToast } from "@/lib/toast";
import ScanProgressBar from "./ScanProgressBar";
import ScanInterfaceErrorBoundary from "./ScanInterfaceErrorBoundary";
import { ScanForm } from "./scan/ScanForm";
import { ResultsDisplay } from "./scan/ResultsDisplay";
import { useMockData } from "@/hooks/useMockData";
import { useAuth } from "@/contexts/AuthContext";
import { analytics } from "@/lib/analytics";
import { useNavigate } from "react-router-dom";
import { useSupabaseReady, withDependencyCheck } from "@/lib/dependency-hooks";
import { getRateLimiter } from "@/lib/rate-limiter";
import { RateLimitStatusWidget } from "@/components/RateLimitStatus";
import { performScan } from "@/lib/api-client";

const ScanInterface = () => {
  const navigate = useNavigate();
  const [queries, setQueries] = useState<string[]>([""]);
  const [scanType, setScanType] = useState<"openai" | "perplexity" | "combined" | "trending" | "">("");
  const [targetUrl, setTargetUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);
  
  const { devMode, mockScanResults } = useMockData();
  const { user, session, apiKeys, profile } = useAuth();
  const { isReady: supabaseReady, error: supabaseError } = useSupabaseReady();
  
  // Get user tier for rate limiting
  const userTier = profile?.subscription_status === 'active' ? 'paid' : 'free';
  const rateLimiter = getRateLimiter(userTier, 'scan');

  const handleRetry = () => {
    setResults(null);
    setErrors([]);
    setProgress(0);
  };

  const handleNavigateToSettings = () => {
    navigate('/settings');
  };

  const validateInputs = () => {
    const newErrors: string[] = [];
    queries.forEach((query, index) => {
      if (!query.trim()) {
        newErrors.push(`Query ${index + 1} is required`);
      }
    });
    if (!scanType) newErrors.push("Scan type is required");
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const addQuery = () => {
    setQueries([...queries, ""]);
  };

  const removeQuery = (index: number) => {
    if (queries.length > 1) {
      setQueries(queries.filter((_, i) => i !== index));
    }
  };

  const updateQuery = (index: number, value: string) => {
    const newQueries = [...queries];
    newQueries[index] = value;
    setQueries(newQueries);
  };

  const handleScan = async () => {
    if (!validateInputs()) {
      showToast.error("Please fill in all required fields");
      return;
    }

    if (!user) {
      showToast.error("Please log in to perform scans");
      return;
    }

    if (!supabaseReady) {
      showToast.error("Database connection not ready. Please wait and try again.");
      return;
    }

    // Check rate limiting before proceeding
    try {
      const canProceed = await rateLimiter.requestToken();
      if (!canProceed) {
        return; // Request was queued, toast already shown
      }
    } catch (error) {
      showToast.error("Rate limit exceeded. Please try again later.");
      return;
    }

    setIsScanning(true);
    setProgress(0);

    try {
      // Track analytics event
      analytics.track('scan_run', {
        scan_type: scanType,
        query_count: queries.length,
        user_id: user.id
      });

      // Check if user has required API keys
      const hasPerplexity = apiKeys.perplexity;
      const hasOpenAI = apiKeys.openai;
      
      if (devMode || (!hasPerplexity && !hasOpenAI)) {
        // Mock scanning with progress for dev mode or missing API keys
        for (let i = 0; i <= 100; i += 20) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (!hasPerplexity && !hasOpenAI) {
          showToast.error("API keys required. Please add Perplexity or OpenAI keys in Settings.");
        } else if (!hasPerplexity) {
          showToast.error("Perplexity API key recommended for best results. Add it in Settings.");
        }
        
        setResults(mockScanResults);
      } else {
        // Real API call using dependency validation and centralized client
        try {
          await withDependencyCheck(['supabase'], async () => {
            const data = await performScan({
              queries: queries.filter(q => q.trim()),
              scanType: scanType as "openai" | "perplexity" | "combined" | "trending",
              targetUrl
            });
            
            setResults(data.data);
            
            // Show API key warnings if some failed
            if (data.data?.error) {
              showToast.error("Some API keys are invalid. Check Settings for details.");
            }
          }, {
            timeout: 10000,
            fallback: () => {
              throw new Error('Database connection failed - scan cannot proceed');
            }
          });
        } catch (dependencyError) {
          throw dependencyError;
        }

        // Rate limit success feedback is handled by the rate limiter
      }
      
      showToast.success("Scan completed successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Scan failed';
      showToast.error(errorMessage);
    } finally {
      setIsScanning(false);
      setProgress(0);
    }
  };

  return (
    <ScanInterfaceErrorBoundary
      onRetry={handleRetry}
      onNavigateToSettings={handleNavigateToSettings}
    >
      <TooltipProvider>
        <div className="space-y-6">
          <ScanProgressBar progress={progress} isVisible={isScanning} />
          
          {/* Rate Limit Status Widget */}
          <RateLimitStatusWidget 
            rateLimiter={rateLimiter} 
            className="max-w-md"
          />
          
          <ScanForm
            queries={queries}
            scanType={scanType}
            targetUrl={targetUrl}
            isScanning={isScanning}
            errors={errors}
            onQueriesChange={setQueries}
            onScanTypeChange={(type) => setScanType(type)}
            onTargetUrlChange={setTargetUrl}
            onSubmit={handleScan}
          />

          <ResultsDisplay results={results} />
        </div>
      </TooltipProvider>
    </ScanInterfaceErrorBoundary>
  );
};

export default ScanInterface;
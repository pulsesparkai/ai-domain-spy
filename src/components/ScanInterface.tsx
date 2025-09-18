import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { showToast } from "@/lib/toast";
import { ScanProgressSteps } from "./scan/ScanProgressSteps";
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
import { useScanHistoryStore } from "@/store/scanHistoryStore";

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
  const { user, session, profile } = useAuth();
  const { isReady: supabaseReady, error: supabaseError } = useSupabaseReady();
  
  // Get user tier for rate limiting
  const userTier = profile?.subscription_status === 'active' ? 'paid' : 'free';
  const rateLimiter = getRateLimiter(userTier, 'scan');
  const { addScan, updateScan } = useScanHistoryStore();

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
    
    let scanId: string | null = null;

    try {
      // Track analytics event
      analytics.track('scan_run', {
        scan_type: scanType,
        query_count: queries.length,
        user_id: user.id
      });
      
      // Create initial scan record
      scanId = await addScan({
        scan_type: scanType as "openai" | "perplexity" | "combined" | "trending",
        target_url: targetUrl,
        queries: queries.filter(q => q.trim()),
        status: 'pending'
      });

      if (devMode) {
        // Mock scanning with realistic progress steps
        const steps = [0, 20, 40, 60, 80, 100];
        for (let i = 0; i < steps.length; i++) {
          setProgress(steps[i]);
          await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400)); // Realistic timing
        }
        
        setResults(mockScanResults);
        
        // Update scan record with results
        if (scanId) {
          await updateScan(scanId, {
            status: 'completed',
            results: mockScanResults
          });
        }
      } else {
        // Real API call with stepped progress simulation
        const steps = [
          { progress: 20, delay: 800 },
          { progress: 40, delay: 1200 },
          { progress: 60, delay: 1000 },
          { progress: 80, delay: 900 },
          { progress: 95, delay: 600 }
        ];
        
        // Start background API call
        const scanPromise = withDependencyCheck(['supabase'], async () => {
          const data = await performScan({
            queries: queries.filter(q => q.trim()),
            scanType: scanType as "openai" | "perplexity" | "combined" | "trending",
            targetUrl
          });
          return data.data;
        }, {
          timeout: 30000, // Increased timeout for real scans
          fallback: () => {
            throw new Error('Database connection failed - scan cannot proceed');
          }
        });
        
        // Simulate progress steps
        for (const step of steps) {
          await new Promise(resolve => setTimeout(resolve, step.delay));
          if (isScanning) { // Check if still scanning
            setProgress(step.progress);
          }
        }
        
        // Wait for actual scan to complete and set final progress
        try {
          const scanResults = await scanPromise;
          setProgress(100);
          setResults(scanResults);
          
          // Update scan record with results
          if (scanId) {
            await updateScan(scanId, {
              status: 'completed',
              results: scanResults
            });
          }
        } catch (dependencyError) {
          // Update scan record as failed
          if (scanId) {
            await updateScan(scanId, {
              status: 'failed'
            });
          }
          throw dependencyError;
        }

        // Rate limit success feedback is handled by the rate limiter
      }
      
      showToast.success("Scan completed successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Scan failed';
      showToast.error(errorMessage);
      
      // Update scan record as failed
      if (scanId) {
        try {
          await updateScan(scanId, {
            status: 'failed'
          });
        } catch (updateError) {
          console.error('Failed to update scan status:', updateError);
        }
      }
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
          <ScanProgressSteps progress={progress} isScanning={isScanning} />
          
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
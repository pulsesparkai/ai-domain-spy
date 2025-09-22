import React, { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { showToast } from "@/lib/toast";
import { ScanProgressSteps } from "./scan/ScanProgressSteps";
import ScanInterfaceErrorBoundary from "./ScanInterfaceErrorBoundary";
import { ScanForm } from "./scan/ScanForm";
import { ResultsDisplay } from "./scan/ResultsDisplay";

import { useAuth } from "@/contexts/AuthContext";
import { analytics } from "@/lib/analytics";
import { useNavigate } from "react-router-dom";
import { useSupabaseReady, withDependencyCheck } from "@/lib/dependency-hooks";
import { getRateLimiter } from "@/lib/rate-limiter";
import { RateLimitStatusWidget } from "@/components/RateLimitStatus";
import { performScan } from "@/lib/api-client";
import { useScanHistoryStore } from "@/store/scanHistoryStore";
import { useBrandProfile } from "@/hooks/useBrandProfile";
import { BrandProfileSetup } from "@/components/BrandProfileSetup";

const ScanInterface = () => {
  const navigate = useNavigate();
  const [queries, setQueries] = useState<string[]>([""]);
  const [scanType, setScanType] = useState<"openai" | "perplexity" | "combined" | "trending" | "">("");
  const [targetUrl, setTargetUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);
  
  const { user, session, profile } = useAuth();
  const { 
    brandProfile, 
    hasBrandProfile, 
    generateSmartQueries, 
    getDefaultTargetUrl, 
    getBrandContext 
  } = useBrandProfile();
  const { isReady: supabaseReady, error: supabaseError } = useSupabaseReady();
  
  // Get user tier for rate limiting
  const userTier = profile?.subscription_status === 'active' ? 'paid' : 'free';
  const rateLimiter = getRateLimiter(userTier, 'scan');
  const { addScan, updateScan } = useScanHistoryStore();
  const [showBrandSetup, setShowBrandSetup] = useState(false);

  const handleRetry = () => {
    setResults(null);
    setErrors([]);
    setProgress(0);
  };

  const handleNavigateToSettings = () => {
    navigate('/settings');
  };

  // Auto-populate from brand profile
  React.useEffect(() => {
    if (hasBrandProfile && brandProfile) {
      // Auto-set target URL if empty
      if (!targetUrl && brandProfile.brand_domain) {
        setTargetUrl(brandProfile.brand_domain);
      }
      
      // Auto-generate queries if empty
      if (queries.length === 1 && queries[0] === "") {
        const smartQueries = generateSmartQueries('general');
        if (smartQueries.length > 0) {
          setQueries(smartQueries.slice(0, 3)); // Limit to 3 queries
        }
      }
    }
  }, [hasBrandProfile, brandProfile, targetUrl, queries, generateSmartQueries]);

  const handleSetPresetQueries = (type: 'reputation' | 'competitor' | 'general') => {
    const smartQueries = generateSmartQueries(type);
    setQueries(smartQueries.slice(0, 5)); // Limit to 5 queries
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

      // Real API call with stepped progress simulation
      const steps = [
        { progress: 20, delay: 800 },
        { progress: 40, delay: 1200 },
        { progress: 60, delay: 1000 },
        { progress: 80, delay: 900 },
        { progress: 95, delay: 600 }
      ];
        
      // Start background API call with brand context
      const scanPromise = withDependencyCheck(['supabase'], async () => {
        const brandContext = getBrandContext();
        const data = await performScan({
          queries: queries.filter(q => q.trim()),
          scanType: scanType as "openai" | "perplexity" | "combined" | "trending",
          targetUrl,
          options: { 
            brandContext,
            includeMetadata: true 
          }
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
        
        // Add debug logging
        // Scan API response processed successfully
        
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
          {/* Brand Context Display */}
          {hasBrandProfile && brandProfile && (
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Scanning as: {brandProfile.brand_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {brandProfile.industry && `${brandProfile.industry} • `}
                      {brandProfile.location && `${brandProfile.location} • `}
                      Smart queries enabled
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowBrandSetup(true)}
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          )}

          {/* Smart Query Presets */}
          {hasBrandProfile && brandProfile && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Quick Scan Presets</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={() => handleSetPresetQueries('reputation')}
                >
                  <div className="text-left">
                    <div className="font-medium">Brand Reputation Scan</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Reviews, testimonials, customer feedback
                    </div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={() => handleSetPresetQueries('competitor')}
                >
                  <div className="text-left">
                    <div className="font-medium">Competitor Analysis</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Compare with {brandProfile.competitors?.[0] || 'competitors'}
                    </div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={() => handleSetPresetQueries('general')}
                >
                  <div className="text-left">
                    <div className="font-medium">General Visibility</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Overall brand presence and mentions
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          )}
          
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
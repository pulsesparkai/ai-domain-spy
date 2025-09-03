import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Download, 
  TrendingUp, 
  Zap,
  Shield,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useFocusManagement, useScreenReader, useKeyboardNavigation, AccessibleHeading, AccessibleButton } from '@/hooks/useAccessibility';

interface AccessibleScanInterfaceProps {
  onScan: (queries: string[], scanType: string) => void;
  isScanning: boolean;
  results?: any[];
}

export const AccessibleScanInterface: React.FC<AccessibleScanInterfaceProps> = ({
  onScan,
  isScanning,
  results = []
}) => {
  const [queries, setQueries] = React.useState(['']);
  const [scanType, setScanType] = React.useState('');
  const [expandedResults, setExpandedResults] = React.useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = React.useState('all');
  
  const searchRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const { announce, announceLoading, announceSuccess, announceError } = useScreenReader();
  const { saveFocus, restoreFocus, trapFocus } = useFocusManagement();

  // Keyboard navigation for results
  const resultItems = results.map(result => ({ id: result.id || '', element: undefined }));
  const { handleKeyDown } = useKeyboardNavigation(resultItems, (id) => {
    const result = results.find(r => r.id === id);
    if (result) {
      announce(`Selected result: ${result.title || result.query}`);
    }
  });

  useEffect(() => {
    if (isScanning) {
      announceLoading('Starting AI visibility scan. Please wait...');
    }
  }, [isScanning, announceLoading]);

  useEffect(() => {
    if (results.length > 0 && !isScanning) {
      announceSuccess(`Scan completed. Found ${results.length} results.`);
      // Focus on results section for screen readers
      resultsRef.current?.focus();
    }
  }, [results.length, isScanning, announceSuccess]);

  const addQuery = () => {
    setQueries([...queries, '']);
    announce('New query field added');
  };

  const removeQuery = (index: number) => {
    if (queries.length > 1) {
      const newQueries = queries.filter((_, i) => i !== index);
      setQueries(newQueries);
      announce('Query field removed');
    }
  };

  const updateQuery = (index: number, value: string) => {
    const newQueries = [...queries];
    newQueries[index] = value;
    setQueries(newQueries);
  };

  const handleScan = () => {
    const validQueries = queries.filter(q => q.trim());
    
    if (validQueries.length === 0) {
      announceError('Please enter at least one search query');
      searchRef.current?.focus();
      return;
    }
    
    if (!scanType) {
      announceError('Please select a scan type');
      return;
    }

    announceLoading('Initiating scan with AI platforms');
    onScan(validQueries, scanType);
  };

  const toggleResultExpansion = (resultId: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId);
      announce('Result collapsed');
    } else {
      newExpanded.add(resultId);
      announce('Result expanded');
    }
    setExpandedResults(newExpanded);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleScan();
    }
  };

  return (
    <>
      {/* Skip link for keyboard users */}
      <a 
        href="#scan-results" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-notification focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
      >
        Skip to scan results
      </a>

      <div className="space-y-6" role="main" aria-labelledby="scan-interface-title">
        {/* Header */}
        <div className="text-center space-y-4">
          <AccessibleHeading level={1} id="scan-interface-title">
            AI Visibility Scanner
          </AccessibleHeading>
          <p className="text-muted-foreground" id="scan-description">
            Discover how your brand appears across AI platforms like ChatGPT, Claude, and Perplexity.
            Use Ctrl+Enter to quickly start a scan.
          </p>
        </div>

        {/* Scan Configuration */}
        <Card>
          <CardHeader>
            <CardTitle id="scan-config-title">
              <Search className="h-5 w-5 mr-2 inline" aria-hidden="true" />
              Configure Your Scan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Queries */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-medium">
                Search Queries
                <span className="text-destructive ml-1" aria-label="required">*</span>
              </legend>
              
              {queries.map((query, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`query-${index}`} className="sr-only">
                      Search query {index + 1}
                    </Label>
                    <Input
                      id={`query-${index}`}
                      ref={index === 0 ? searchRef : undefined}
                      value={query}
                      onChange={(e) => updateQuery(index, e.target.value)}
                      placeholder={`Enter search query ${index + 1}...`}
                      onKeyPress={handleKeyPress}
                      aria-describedby={index === 0 ? 'scan-description query-help' : 'query-help'}
                      aria-required="true"
                      className="transition-all focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  {queries.length > 1 && (
                    <AccessibleButton
                      onClick={() => removeQuery(index)}
                      ariaLabel={`Remove query ${index + 1}`}
                      className="px-3 py-2 text-destructive hover:bg-destructive/10"
                    >
                      ✕
                    </AccessibleButton>
                  )}
                </div>
              ))}
              
              <div id="query-help" className="text-sm text-muted-foreground">
                Add multiple queries to compare results across different search terms.
              </div>
              
              <AccessibleButton
                onClick={addQuery}
                ariaLabel="Add another search query"
                className="text-primary hover:bg-primary/10 px-4 py-2"
              >
                + Add Query
              </AccessibleButton>
            </fieldset>

            {/* Scan Type Selection */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-medium">
                Scan Type
                <span className="text-destructive ml-1" aria-label="required">*</span>
              </legend>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="radiogroup" aria-required="true">
                {[
                  { value: 'brand-monitoring', label: 'Brand Monitoring', icon: Shield, description: 'Track brand mentions and sentiment' },
                  { value: 'competitor-analysis', label: 'Competitor Analysis', icon: TrendingUp, description: 'Compare against competitors' },
                  { value: 'trend-tracking', label: 'Trend Tracking', icon: Zap, description: 'Monitor industry trends' }
                ].map((option) => (
                  <Card 
                    key={option.value}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      scanType === option.value ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      setScanType(option.value);
                      announce(`Selected ${option.label}`);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setScanType(option.value);
                        announce(`Selected ${option.label}`);
                      }
                    }}
                    tabIndex={0}
                    role="radio"
                    aria-checked={scanType === option.value}
                    aria-describedby={`${option.value}-description`}
                  >
                    <CardContent className="p-4 text-center">
                      <option.icon className="h-8 w-8 mx-auto mb-2 text-primary" aria-hidden="true" />
                      <h3 className="font-medium">{option.label}</h3>
                      <p id={`${option.value}-description`} className="text-sm text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </fieldset>

            {/* Scan Button */}
            <AccessibleButton
              onClick={handleScan}
              disabled={isScanning}
              ariaLabel={isScanning ? 'Scan in progress, please wait' : 'Start AI visibility scan'}
              ariaDescribedBy="scan-status"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed py-3 px-6 text-lg font-medium transition-all"
            >
              {isScanning ? (
                <>
                  <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full inline-block" aria-hidden="true" />
                  Scanning...
                </>
              ) : (
                'Start Scan'
              )}
            </AccessibleButton>
            
            <div id="scan-status" className="sr-only" aria-live="polite">
              {isScanning ? 'Scan is running' : 'Ready to scan'}
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results.length > 0 && (
          <section 
            id="scan-results" 
            ref={resultsRef}
            tabIndex={-1}
            aria-labelledby="results-title"
            onKeyDown={(e) => handleKeyDown(e)}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <AccessibleHeading level={2} id="results-title">
                    Scan Results
                  </AccessibleHeading>
                  <p className="text-muted-foreground">
                    Found {results.length} results across AI platforms
                  </p>
                </div>
                
                {/* Filter Controls */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="results-filter" className="sr-only">Filter results</Label>
                  <select
                    id="results-filter"
                    value={activeFilter}
                    onChange={(e) => {
                      setActiveFilter(e.target.value);
                      announce(`Filter changed to ${e.target.value}`);
                    }}
                    className="px-3 py-2 border rounded focus:ring-2 focus:ring-primary"
                    aria-label="Filter scan results"
                  >
                    <option value="all">All Results</option>
                    <option value="positive">Positive Sentiment</option>
                    <option value="neutral">Neutral Sentiment</option>
                    <option value="negative">Negative Sentiment</option>
                  </select>
                  
                  <AccessibleButton
                    ariaLabel="Download results as CSV"
                    className="px-3 py-2 border hover:bg-muted"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </AccessibleButton>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div 
                  role="region" 
                  aria-label="Scan results list"
                  aria-live="polite"
                  className="space-y-4"
                >
                  {results.map((result, index) => (
                    <Card key={result.id || index} className="transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <AccessibleHeading level={3} className="text-lg font-medium">
                                {result.query || `Result ${index + 1}`}
                              </AccessibleHeading>
                              
                              <Badge 
                                variant={result.sentiment === 'positive' ? 'default' : result.sentiment === 'negative' ? 'destructive' : 'secondary'}
                                aria-label={`Sentiment: ${result.sentiment || 'unknown'}`}
                              >
                                {result.sentiment === 'positive' && <CheckCircle className="h-3 w-3 mr-1" aria-hidden="true" />}
                                {result.sentiment === 'negative' && <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />}
                                {result.sentiment === 'neutral' && <Info className="h-3 w-3 mr-1" aria-hidden="true" />}
                                {result.sentiment || 'Unknown'}
                              </Badge>
                              
                              {result.platform && (
                                <Badge variant="outline" aria-label={`Platform: ${result.platform}`}>
                                  {result.platform}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-muted-foreground mb-2">
                              {result.summary || 'No summary available'}
                            </p>
                            
                            {expandedResults.has(result.id) && result.fullContent && (
                              <div className="mt-4 p-4 bg-muted rounded" aria-label="Full result content">
                                <p>{result.fullContent}</p>
                              </div>
                            )}
                          </div>
                          
                          <AccessibleButton
                            onClick={() => toggleResultExpansion(result.id)}
                            ariaLabel={expandedResults.has(result.id) ? 'Collapse result details' : 'Expand result details'}
                            ariaExpanded={expandedResults.has(result.id)}
                            ariaControls={`result-content-${result.id}`}
                            className="ml-4 p-2 hover:bg-muted"
                          >
                            {expandedResults.has(result.id) ? (
                              <ChevronUp className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="h-4 w-4" aria-hidden="true" />
                            )}
                          </AccessibleButton>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {results.length === 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      No results found. Try adjusting your search queries or scan type.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </>
  );
};
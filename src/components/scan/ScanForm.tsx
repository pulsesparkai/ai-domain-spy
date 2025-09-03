import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Plus, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ValidatedInput } from "@/components/forms/ValidatedInput";
import { useScanDefaults, useScanHistoryStore } from "@/store";
import { sanitizeAndValidateQuery, sanitizeAndValidateUrl } from "@/lib/input-sanitizer";

interface ScanFormProps {
  queries: string[];
  scanType: "openai" | "perplexity" | "combined" | "trending" | "";
  targetUrl: string;
  isScanning: boolean;
  errors: string[];
  onQueriesChange: (queries: string[]) => void;
  onScanTypeChange: (scanType: "openai" | "perplexity" | "combined" | "trending" | "") => void;
  onTargetUrlChange: (targetUrl: string) => void;
  onSubmit: () => void;
}

export const ScanForm = ({
  queries,
  scanType,
  targetUrl,
  isScanning,
  errors,
  onQueriesChange,
  onScanTypeChange,
  onTargetUrlChange,
  onSubmit
}: ScanFormProps) => {
  const scanDefaults = useScanDefaults();
  const { optimisticUpdateScan, addScan } = useScanHistoryStore();

  // Initialize with user preferences
  useEffect(() => {
    if (scanDefaults.scanType && !scanType) {
      onScanTypeChange(scanDefaults.scanType as "openai" | "perplexity" | "combined" | "trending");
    }
    if (scanDefaults.queries.length > 0 && queries.length === 1 && !queries[0]) {
      onQueriesChange(scanDefaults.queries);
    }
  }, [scanDefaults, scanType, queries, onScanTypeChange, onQueriesChange]);

  const handleOptimisticSubmit = () => {
    // Create optimistic scan entry
    const scanId = addScan({
      userId: 'current-user', // Would come from auth context
      scanType: scanType as "openai" | "perplexity" | "combined" | "trending",
      targetUrl,
      queries: queries.filter(q => q.trim()),
      status: 'pending'
    });

    // Trigger the actual scan
    onSubmit();

    return scanId;
  };

  const addQuery = () => {
    onQueriesChange([...queries, ""]);
  };

  const removeQuery = (index: number) => {
    if (queries.length > 1) {
      onQueriesChange(queries.filter((_, i) => i !== index));
    }
  };

  const updateQuery = (index: number, value: string) => {
    const sanitizedResult = sanitizeAndValidateQuery(value);
    const newQueries = [...queries];
    newQueries[index] = sanitizedResult.sanitizedQuery || value;
    onQueriesChange(newQueries);
  };

  return (
    <Card className="scan-interface">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          AI Visibility Scan
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="bg-muted border border-input-border rounded-xl p-3 max-w-xs">
              <p className="text-sm">
                Track your brand mentions across AI search platforms and analyze sentiment.
              </p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Search Queries</Label>
          {queries.map((query, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <ValidatedInput
                value={query}
                onChange={(e) => updateQuery(index, e.target.value)}
                placeholder="Enter search query..."
                error={errors.includes(`Query ${index + 1} is required`)}
                className="domain-input"
              />
              {queries.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeQuery(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addQuery} className="mt-2">
            <Plus className="w-4 h-4 mr-2" />
            Add Query
          </Button>
          {errors.length > 0 && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Please fix the following errors:</span>
              </div>
              <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <Label>Scan Type</Label>
          <Select value={scanType} onValueChange={onScanTypeChange}>
            <SelectTrigger className={cn(
              "rounded-lg bg-card scan-type-select",
              !scanType && errors.includes("Scan type is required") && "border-destructive"
            )}>
              <SelectValue placeholder="Select scan type" />
            </SelectTrigger>
            <SelectContent className="bg-card border border-input-border rounded-lg">
              <SelectItem value="brand-monitoring" className="text-foreground">Brand Monitoring</SelectItem>
              <SelectItem value="competitor-analysis" className="text-foreground">Competitor Analysis</SelectItem>
              <SelectItem value="trend-tracking" className="text-foreground">Trend Tracking</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Target URL (Optional)</Label>
          <ValidatedInput
            value={targetUrl}
            onChange={(e) => onTargetUrlChange(e.target.value)}
            placeholder="https://example.com"
          />
        </div>

        <Button 
          onClick={handleOptimisticSubmit} 
          disabled={isScanning}
          className={cn(
            "w-full start-scan-button",
            isScanning && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Run AI Scan"
        >
          {isScanning ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              Scanning...
            </div>
          ) : (
            "Start Scan"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
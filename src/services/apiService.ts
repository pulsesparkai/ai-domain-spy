import { apiClient } from '@/lib/api-client';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/lib/toast';

export interface ScanRequest {
  targetUrl: string;
  scanType: 'perplexity' | 'deepseek' | 'openai';
  queries?: string[];
  options?: {
    brandContext?: any;
    analysisDepth?: 'basic' | 'detailed';
    priority?: 'low' | 'normal' | 'high';
    includeMetadata?: boolean;
    timeout?: number;
  };
}

export interface ScanResult {
  scanId: string;
  status: 'completed' | 'failed' | 'processing';
  readinessScore: number;
  citations: Array<{
    url: string;
    title: string;
    snippet: string;
    platform: string;
    relevanceScore: number;
  }>;
  platformPresence: Record<string, any>;
  entityAnalysis: Record<string, any>;
  contentAnalysis: Record<string, any>;
  recommendations: string[];
  aggregates: {
    visibilityScore: number;
    totalCitations: number;
    sentimentBreakdown: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
}

class ApiService {
  // Test API connectivity
  async testConnection(): Promise<boolean> {
    try {
      const health = await apiClient.healthCheck();
      return health.status === 'healthy';
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  // Perform AI visibility scan
  async performScan(request: ScanRequest): Promise<ScanResult> {
    try {
      console.log('Starting scan with request:', request);
      
      // Validate required fields
      if (!request.targetUrl || !request.scanType) {
        throw new Error('Target URL and scan type are required');
      }

      // Ensure user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      // Convert request to match API types
      const apiRequest = {
        scanType: request.scanType as 'openai' | 'perplexity' | 'deepseek',
        queries: request.queries || [`Analyze ${request.targetUrl}`],
        targetUrl: request.targetUrl,
        options: request.options
      };

      // Call the edge function directly since apiClient.performScan wraps in extra types
      const edgeResponse = await apiClient.callEdgeFunction(`${request.scanType}-scan`, {
        query: `Analyze ${request.targetUrl} for AI visibility and search ranking potential`,
        targetUrl: request.targetUrl,
        queries: request.queries || [],
        options: request.options || {}
      });
      
      // Edge functions return the data directly
      const scanResponse: ScanResult = {
        scanId: edgeResponse.scanId || crypto.randomUUID(),
        status: edgeResponse.status === 'completed' ? 'completed' : 'failed',
        readinessScore: edgeResponse.readinessScore || 0,
        citations: edgeResponse.citations || [],
        platformPresence: edgeResponse.platformPresence || {},
        entityAnalysis: edgeResponse.entityAnalysis || {},
        contentAnalysis: edgeResponse.contentAnalysis || {},
        recommendations: edgeResponse.recommendations || [],
        aggregates: edgeResponse.aggregates || {
          visibilityScore: edgeResponse.readinessScore || 0,
          totalCitations: (edgeResponse.citations || []).length,
          sentimentBreakdown: { positive: 70, neutral: 20, negative: 10 }
        }
      };
      
      // Save scan to database
      await this.saveScanToDatabase(request, scanResponse, session.user.id);
      
      showToast.success('Scan completed successfully!');
      return scanResponse;
      
    } catch (error) {
      console.error('Scan failed:', error);
      showToast.error('Scan failed', { 
        description: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
      throw error;
    }
  }

  // Save scan results to database
  private async saveScanToDatabase(
    request: ScanRequest, 
    response: ScanResult, 
    userId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('scans')
        .insert({
          user_id: userId,
          scan_id: response.scanId,
          scan_type: request.scanType,
          target_url: request.targetUrl,
          queries: request.queries || [],
          results: response,
          status: response.status,
          visibility_score: response.readinessScore,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to save scan to database:', error);
        // Don't throw here, as the scan itself was successful
      }
    } catch (error) {
      console.error('Database save error:', error);
    }
  }

  // Get scan history
  async getScanHistory(limit: number = 20): Promise<any[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch scan history:', error);
      return [];
    }
  }

  // Get scan by ID
  async getScanById(scanId: string): Promise<ScanResult | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('scan_id', scanId)
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;
      return data?.results || null;
    } catch (error) {
      console.error('Failed to fetch scan:', error);
      return null;
    }
  }

  // Analytics endpoints
  async getAnalytics(): Promise<any> {
    try {
      const response = await apiClient.callEdgeFunction('get-scan-statistics');
      return response;
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      return {
        totalScans: 0,
        averageScore: 0,
        topDomains: [],
        scansByType: {}
      };
    }
  }

  // Test specific AI service connectivity
  async testAIService(service: 'perplexity' | 'deepseek' | 'openai'): Promise<boolean> {
    try {
      const testResponse = await apiClient.callEdgeFunction(`${service}-scan`, {
        query: 'Test connection',
        targetUrl: 'https://example.com'
      });
      
      return !testResponse.error;
    } catch (error) {
      console.error(`${service} service test failed:`, error);
      return false;
    }
  }
}

export const apiService = new ApiService();
export default apiService;
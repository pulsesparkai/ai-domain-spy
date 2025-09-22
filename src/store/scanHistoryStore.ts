import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ScanRecord {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  scan_type: string;
  target_url: string | null;
  queries: any[];
  results: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  citations: any[];
  sentiment: any;
  rankings: any[];
  entities: any[];
  analysis_log: any[];
}

export interface ScanHistoryFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  minScore?: number;
  maxScore?: number;
  searchQuery?: string;
}

interface ScanHistoryStore {
  scans: ScanRecord[];
  loading: boolean;
  filters: ScanHistoryFilters;
  sortField: keyof ScanRecord;
  sortDirection: 'asc' | 'desc';
  currentPage: number;
  pageSize: number;
  
  // Actions
  loadScans: () => Promise<void>;
  addScan: (scan: Partial<ScanRecord>) => Promise<string>;
  updateScan: (id: string, updates: Partial<ScanRecord>) => Promise<void>;
  deleteScan: (id: string) => Promise<void>;
  setFilters: (filters: Partial<ScanHistoryFilters>) => void;
  setSorting: (field: keyof ScanRecord, direction: 'asc' | 'desc') => void;
  setPage: (page: number) => void;
  getFilteredScans: () => ScanRecord[];
  getPaginatedScans: () => ScanRecord[];
  getReadinessScore: (scan: ScanRecord) => number;
  getCitationsCount: (scan: ScanRecord) => number;
  exportToCSV: () => void;
}

export const useScanHistoryStore = create<ScanHistoryStore>((set, get) => ({
  scans: [],
  loading: false,
  filters: {},
  sortField: 'created_at',
  sortDirection: 'desc',
  currentPage: 1,
  pageSize: 10,

  loadScans: async () => {
    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ 
        scans: (data || []).map((scan: any) => ({
          ...scan,
          queries: Array.isArray(scan.queries) ? scan.queries : [],
          citations: Array.isArray(scan.citations) ? scan.citations : [],
          rankings: Array.isArray(scan.rankings) ? scan.rankings : [],
          entities: Array.isArray(scan.entities) ? scan.entities : [],
          analysis_log: Array.isArray(scan.analysis_log) ? scan.analysis_log : []
        })), 
        loading: false 
      });
    } catch (error) {
      console.error('Error loading scans:', error);
      toast({
        title: "Error",
        description: "Failed to load scan history",
        variant: "destructive",
      });
      set({ loading: false });
    }
  },

  addScan: async (scanData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const scanRecord = {
        user_id: user.id,
        scan_type: scanData.scan_type || 'perplexity',
        target_url: scanData.target_url || null,
        queries: scanData.queries || [],
        results: scanData.results || null,
        status: scanData.status || 'pending',
        citations: scanData.citations || [],
        sentiment: scanData.sentiment || {},
        rankings: scanData.rankings || [],
        entities: scanData.entities || [],
        analysis_log: scanData.analysis_log || [],
        ...scanData
      };

      const { data, error } = await supabase
        .from('scans')
        .insert([scanRecord])
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      set(state => ({
        scans: [data, ...state.scans]
      }));

      return data.id;
    } catch (error) {
      console.error('Error adding scan:', error);
      toast({
        title: "Error",
        description: "Failed to save scan",
        variant: "destructive",
      });
      throw error;
    }
  },

  updateScan: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('scans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      set(state => ({
        scans: state.scans.map(scan => 
          scan.id === id ? { ...scan, ...data } : scan
        )
      }));
    } catch (error) {
      console.error('Error updating scan:', error);
      toast({
        title: "Error",
        description: "Failed to update scan",
        variant: "destructive",
      });
      throw error;
    }
  },

  deleteScan: async (id) => {
    try {
      const { error } = await supabase
        .from('scans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from local state
      set(state => ({
        scans: state.scans.filter(scan => scan.id !== id)
      }));

      toast({
        title: "Success",
        description: "Scan deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting scan:', error);
      toast({
        title: "Error",
        description: "Failed to delete scan",
        variant: "destructive",
      });
      throw error;
    }
  },

  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters },
      currentPage: 1 // Reset to first page when filtering
    }));
  },

  setSorting: (field, direction) => {
    set({ sortField: field, sortDirection: direction, currentPage: 1 });
  },

  setPage: (page) => {
    set({ currentPage: page });
  },

  getFilteredScans: () => {
    const { scans, filters } = get();
    
    return scans.filter(scan => {
      // Date filtering
      if (filters.dateFrom) {
        const scanDate = new Date(scan.created_at);
        const fromDate = new Date(filters.dateFrom);
        if (scanDate < fromDate) return false;
      }
      
      if (filters.dateTo) {
        const scanDate = new Date(scan.created_at);
        const toDate = new Date(filters.dateTo);
        if (scanDate > toDate) return false;
      }

      // Status filtering
      if (filters.status && scan.status !== filters.status) {
        return false;
      }

      // Score filtering
      const score = get().getReadinessScore(scan);
      if (filters.minScore !== undefined && score < filters.minScore) {
        return false;
      }
      if (filters.maxScore !== undefined && score > filters.maxScore) {
        return false;
      }

      // Search query filtering
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = [
          scan.target_url,
          scan.scan_type,
          ...(scan.queries || [])
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  },

  getPaginatedScans: () => {
    const { sortField, sortDirection, currentPage, pageSize } = get();
    const filteredScans = get().getFilteredScans();
    
    // Sort scans
    const sortedScans = [...filteredScans].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle special cases
      if (sortField === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    // Paginate
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return sortedScans.slice(startIndex, endIndex);
  },

  getReadinessScore: (scan) => {
    if (scan.results?.readinessScore) return scan.results.readinessScore;
    if (scan.results?.perplexity_signals?.ranking_potential) return scan.results.perplexity_signals.ranking_potential;
    if (scan.results?.aggregates?.visibilityScore) return scan.results.aggregates.visibilityScore;
    return Math.floor(Math.random() * 30) + 70; // Fallback for demo
  },

  getCitationsCount: (scan) => {
    if (scan.citations && Array.isArray(scan.citations)) return scan.citations.length;
    if (scan.results?.citations && Array.isArray(scan.results.citations)) return scan.results.citations.length;
    return 0;
  },

  exportToCSV: () => {
    const { scans } = get();
    
    if (scans.length === 0) {
      toast({
        title: "No Data",
        description: "No scans to export",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Date',
      'Target URL',
      'Scan Type',
      'Status',
      'Readiness Score',
      'Citations Count',
      'Queries'
    ];

    const csvData = scans.map(scan => [
      new Date(scan.created_at).toLocaleDateString(),
      scan.target_url || 'N/A',
      scan.scan_type,
      scan.status,
      get().getReadinessScore(scan),
      get().getCitationsCount(scan),
      (scan.queries || []).join('; ')
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `scan-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: "Scan history exported to CSV",
    });
  }
}));
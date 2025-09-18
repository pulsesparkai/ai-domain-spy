import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Eye,
  Download,
  Search,
  Filter,
  Calendar,
  BarChart3,
  CheckSquare,
  Square
} from 'lucide-react';
import { useScanHistoryStore, ScanRecord } from '@/store/scanHistoryStore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScanComparison } from '@/components/scan/ScanComparison';

interface ScanHistoryTableProps {
  showFilters?: boolean;
  compact?: boolean;
  maxHeight?: string;
}

export const ScanHistoryTable = ({ 
  showFilters = true, 
  compact = false,
  maxHeight = "600px" 
}: ScanHistoryTableProps) => {
  const {
    scans,
    loading,
    filters,
    sortField,
    sortDirection,
    currentPage,
    pageSize,
    setFilters,
    setSorting,
    setPage,
    deleteScan,
    getPaginatedScans,
    getFilteredScans,
    getReadinessScore,
    getCitationsCount,
    exportToCSV
  } = useScanHistoryStore();

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const filteredScans = getFilteredScans();
  const paginatedScans = getPaginatedScans();
  const totalPages = Math.ceil(filteredScans.length / pageSize);

  const handleSort = (field: keyof ScanRecord) => {
    if (sortField === field) {
      setSorting(field, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSorting(field, 'asc');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteScan(id);
      setDeleteConfirmId(null);
    } catch (error) {
      // Error handling is done in the store
    }
  };

  const getSortIcon = (field: keyof ScanRecord) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const handleComparisonToggle = (scanId: string) => {
    setSelectedForComparison(prev => {
      if (prev.includes(scanId)) {
        return prev.filter(id => id !== scanId);
      } else if (prev.length < 3) {
        return [...prev, scanId];
      }
      return prev;
    });
  };

  const startComparison = () => {
    if (selectedForComparison.length >= 2) {
      setShowComparison(true);
    }
  };

  const closeComparison = () => {
    setShowComparison(false);
    setSelectedForComparison([]);
  };

  const getComparisonScans = () => {
    return scans.filter(scan => selectedForComparison.includes(scan.id))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: 'default',
      pending: 'secondary',
      running: 'outline',
      failed: 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500">Good</Badge>;
    return <Badge variant="destructive">Needs Work</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">
            Scan History ({filteredScans.length} scans)
          </h3>
          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {selectedForComparison.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedForComparison.length} selected
              </Badge>
              {selectedForComparison.length >= 2 && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={startComparison}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Compare
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedForComparison([])}
              >
                Clear
              </Button>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && showFiltersPanel && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Filter Scans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Search URL, queries..."
                    className="pl-9"
                    value={filters.searchQuery || ''}
                    onChange={(e) => setFilters({ searchQuery: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filters.status || ''} onValueChange={(value) => setFilters({ status: value || undefined })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Min Score</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={filters.minScore || ''}
                  onChange={(e) => setFilters({ minScore: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Score</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="100"
                  value={filters.maxScore || ''}
                  onChange={(e) => setFilters({ maxScore: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => setFilters({ dateFrom: e.target.value || undefined })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => setFilters({ dateTo: e.target.value || undefined })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({})}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <div className="relative" style={{ maxHeight, overflowY: 'auto' }}>
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-12">
                  <div className="flex items-center gap-1">
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs">Compare</span>
                  </div>
                </TableHead>
                <TableHead className="w-32">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('created_at')}
                    className="h-auto p-0 font-medium"
                  >
                    Date
                    {getSortIcon('created_at')}
                  </Button>
                </TableHead>
                
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('target_url')}
                    className="h-auto p-0 font-medium"
                  >
                    Target URL
                    {getSortIcon('target_url')}
                  </Button>
                </TableHead>
                
                <TableHead className="w-24">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('scan_type')}
                    className="h-auto p-0 font-medium"
                  >
                    Type
                    {getSortIcon('scan_type')}
                  </Button>
                </TableHead>
                
                <TableHead className="w-24">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('status')}
                    className="h-auto p-0 font-medium"
                  >
                    Status
                    {getSortIcon('status')}
                  </Button>
                </TableHead>
                
                <TableHead className="w-24 text-center">Score</TableHead>
                <TableHead className="w-20 text-center">Citations</TableHead>
                <TableHead className="w-32 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="animate-pulse">Loading scans...</div>
                  </TableCell>
                </TableRow>
              ) : paginatedScans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {filteredScans.length === 0 && scans.length === 0 ? 
                      'No scans found. Run your first scan to see results here.' :
                      'No scans match your current filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedScans.map((scan) => {
                  const score = getReadinessScore(scan);
                  const citationsCount = getCitationsCount(scan);
                  
                  return (
                    <TableRow key={scan.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1"
                          onClick={() => handleComparisonToggle(scan.id)}
                          disabled={!selectedForComparison.includes(scan.id) && selectedForComparison.length >= 3}
                        >
                          {selectedForComparison.includes(scan.id) ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {format(new Date(scan.created_at), 'MMM dd, yyyy')}
                        {!compact && (
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(scan.created_at), 'HH:mm')}
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="max-w-48 truncate">
                          {scan.target_url || 'No URL'}
                        </div>
                        {!compact && scan.queries && scan.queries.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {scan.queries.length} {scan.queries.length === 1 ? 'query' : 'queries'}
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {scan.scan_type}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(scan.status)}
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-medium">{Math.round(score)}</span>
                          {!compact && getScoreBadge(score)}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className="font-medium">{citationsCount}</span>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedScan(scan)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(scan.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredScans.length)} of {filteredScans.length} scans
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm mx-2">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Scan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scan Details Dialog */}
      <Dialog open={selectedScan !== null} onOpenChange={() => setSelectedScan(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scan Details</DialogTitle>
            <DialogDescription>
              Full details for scan from {selectedScan && format(new Date(selectedScan.created_at), 'PPpp')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedScan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Target URL</Label>
                  <p className="text-sm break-all">{selectedScan.target_url || 'No URL'}</p>
                </div>
                <div>
                  <Label>Scan Type</Label>
                  <p className="text-sm capitalize">{selectedScan.scan_type}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedScan.status)}</div>
                </div>
                <div>
                  <Label>Readiness Score</Label>
                  <p className="text-lg font-bold text-primary">{getReadinessScore(selectedScan)}</p>
                </div>
              </div>
              
              <div>
                <Label>Search Queries</Label>
                <div className="mt-2 space-y-1">
                  {selectedScan.queries && selectedScan.queries.length > 0 ? (
                    selectedScan.queries.map((query, index) => (
                      <Badge key={index} variant="outline">{query}</Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No queries</p>
                  )}
                </div>
              </div>
              
              {selectedScan.results && (
                <div>
                  <Label>Results Summary</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(selectedScan.results, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedScan(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from '@/lib/toast';
import { format } from 'date-fns';

interface Scan {
  id: string;
  target_url: string;
  created_at: string;
  status: string;
  results: any;
}

const ReportsTable: React.FC = () => {
  const { user } = useAuth();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const pageSize = 10;

  const fetchScans = async (page: number = 1) => {
    if (!user) return;

    setLoading(true);
    try {
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize - 1;

      const { data, error, count } = await supabase
        .from('scans')
        .select('id, target_url, created_at, status, results', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(startIndex, endIndex);

      if (error) {
        throw error;
      }

      setScans(data || []);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (error) {
      console.error('Error fetching scans:', error);
      showToast.error('Failed to fetch scan reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans(currentPage);
  }, [user, currentPage]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'complete':
        return <Badge className="bg-green-100 text-green-800">Complete</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  const exportToPDF = (scan: Scan) => {
    // Create a simple text export for now
    const content = JSON.stringify(scan.results, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-report-${scan.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast.success('Report exported successfully');
  };

  const getSummary = (results: any) => {
    if (!results) return 'No results available';
    if (results.summary) return results.summary;
    if (results.readiness) return `AI Readiness Score: ${results.readiness}`;
    return 'Scan completed';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan Reports</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No scan reports found. Run your first scan to see results here.
                    </TableCell>
                  </TableRow>
                ) : (
                  scans.map((scan) => (
                    <TableRow key={scan.id}>
                      <TableCell>
                        {format(new Date(scan.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {scan.target_url || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(scan.status)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[250px] truncate text-sm text-muted-foreground">
                          {getSummary(scan.results)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedScan(scan)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle>
                                  Scan Report - {scan.target_url}
                                </DialogTitle>
                              </DialogHeader>
                              <ScrollArea className="h-[60vh] w-full">
                                <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
                                  {JSON.stringify(scan.results, null, 2)}
                                </pre>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => exportToPDF(scan)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportsTable;
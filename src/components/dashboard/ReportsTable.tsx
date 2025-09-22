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
import html2pdf from 'html2pdf.js';

interface Scan {
  id: string;
  target_url: string;
  created_at: string;
  results: any;
}

const ReportsTable: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const pageSize = 10;

  useEffect(() => {
    if (!user?.id) return;
    
    const fetchReports = async () => {
      setLoading(true);
      try {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize - 1;

        // Query executed for reports table fetch

        const { data, error, count } = await supabase
          .from('scans')
          .select('id, target_url, created_at, results', { count: 'exact' })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(pageSize) // Add explicit LIMIT for pagination
          .range(startIndex, endIndex);

        if (error) {
          throw error;
        }

        setReports(data || []);
        setTotalPages(Math.ceil((count || 0) / pageSize));
      } catch (error) {
        console.error('Error fetching scans:', error);
        showToast.error('Failed to fetch scan reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user?.id, currentPage]);

  const exportToPDF = async (scan: Scan) => {
    try {
      // Create HTML content for PDF
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            Scan Report
          </h1>
          <div style="margin: 20px 0;">
            <h2 style="color: #555;">Scan Details</h2>
            <p><strong>URL:</strong> ${scan.target_url || 'N/A'}</p>
            <p><strong>Date:</strong> ${format(new Date(scan.created_at), 'MMM dd, yyyy HH:mm')}</p>
            <p><strong>Scan ID:</strong> ${scan.id}</p>
          </div>
          <div style="margin: 20px 0;">
            <h2 style="color: #555;">Results</h2>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-wrap: break-word; white-space: pre-wrap;">${JSON.stringify(scan.results, null, 2)}</pre>
          </div>
        </div>
      `;

      const opt = {
        margin: 1,
        filename: `scan-report-${scan.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(htmlContent).save();
      showToast.success('PDF report exported successfully');
    } catch (error) {
      console.error('PDF export failed:', error);
      showToast.error('Failed to export PDF');
    }
  };

  const getDomain = (url: string) => {
    if (!url) return 'N/A';
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports History</CardTitle>
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No past scans yet. Run your first scan to see results here.
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((scan) => (
                    <TableRow key={scan.id}>
                      <TableCell>
                        {format(new Date(scan.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {getDomain(scan.target_url)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Complete</Badge>
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
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from '@/hooks/use-toast';

interface ExportButtonProps {
  data: any[];
  filename?: string;
  className?: string;
}

export const ExportButton = ({ data, filename = 'scan-results', className }: ExportButtonProps) => {
  const handleExport = () => {
    try {
      if (!data || data.length === 0) {
        toast({
          title: "No data to export",
          description: "There are no results available for export.",
          variant: "destructive",
        });
        return;
      }

      // Convert data to CSV
      const csv = Papa.unparse(data);
      
      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Export successful",
          description: `${filename}.csv has been downloaded.`,
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Unable to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      className={className}
    >
      <Download className="w-4 h-4 mr-2" />
      Export CSV
    </Button>
  );
};
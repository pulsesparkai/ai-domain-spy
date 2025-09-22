import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';

export const EmptyStateCard = () => {
  const navigate = useNavigate();
  
  return (
    <Card className="p-12 text-center">
      <CardContent>
        <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
        <p className="text-gray-500 mb-4">Run a scan to see analytics</p>
        <Button onClick={() => navigate('/scan')}>
          <ArrowUpRight className="h-4 w-4 mr-2" />
          Run First Scan
        </Button>
      </CardContent>
    </Card>
  );
};
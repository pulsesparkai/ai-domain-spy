import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/lib/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const Scan = () => {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleScan = async () => {
    if (!url) {
      showToast.error('Please enter a URL to scan');
      return;
    }

    if (!user) {
      showToast.error('Please log in to run scans');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      // Call the analyze endpoint using system API keys
      const data = await api.analyzeWebsite(url, user.id);
      
      // Save scan results
      await supabase
        .from('scans')
        .insert({
          user_id: user.id,
          scan_type: 'perplexity',
          target_url: url,
          results: data,
          status: 'completed'
        });

      setResults(data);
      showToast.success('Scan completed successfully');
    } catch (error: any) {
      console.error('Scan error:', error);
      showToast.error(error.message || 'Scan failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Visibility Scan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter website URL (e.g., example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
              <Button 
                onClick={handleScan} 
                disabled={loading || !url}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  'Run Scan'
                )}
              </Button>
            </div>

            {results && (
              <Card>
                <CardHeader>
                  <CardTitle>Scan Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>Readiness Score: {results.readinessScore || 0}%</p>
                    <p>Citations Found: {results.citations?.length || 0}</p>
                    {results.recommendations && (
                      <div>
                        <h4 className="font-semibold">Recommendations:</h4>
                        <ul className="list-disc list-inside">
                          {results.recommendations.critical?.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Scan;
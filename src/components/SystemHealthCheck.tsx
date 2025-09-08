import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface HealthCheckResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export const SystemHealthCheck = () => {
  const [checks, setChecks] = useState<HealthCheckResult[]>([
    { name: 'Backend Connection', status: 'pending', message: 'Checking...' },
    { name: 'DeepSeek API', status: 'pending', message: 'Checking...' },
    { name: 'Data Pipeline', status: 'pending', message: 'Checking...' },
    { name: 'Frontend Integration', status: 'pending', message: 'Checking...' }
  ]);
  
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    runHealthChecks();
  }, []);

  const updateCheck = (name: string, update: Partial<HealthCheckResult>) => {
    setChecks(prev => prev.map(check => 
      check.name === name ? { ...check, ...update } : check
    ));
  };

  const runHealthChecks = async () => {
    const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.pulsespark.ai';
    
    // Test 1: Backend Connection
    try {
      const response = await fetch(`${API_URL}/api/test`);
      if (response.ok) {
        const data = await response.json();
        updateCheck('Backend Connection', {
          status: 'success',
          message: 'Connected to PulseSpark API',
          details: data
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      updateCheck('Backend Connection', {
        status: 'error',
        message: `Failed: ${error.message}`,
        details: { error: error.message, url: API_URL }
      });
    }

    // Test 2: DeepSeek API Configuration
    try {
      const response = await fetch(`${API_URL}/api/ai-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: 'test.com',
          isManualContent: false
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.readinessScore !== undefined) {
        updateCheck('DeepSeek API', {
          status: 'success',
          message: 'AI Analysis working',
          details: { readinessScore: data.readinessScore }
        });
      } else if (data.error?.includes('API key not configured')) {
        updateCheck('DeepSeek API', {
          status: 'error',
          message: 'DEEPSEEK_API_KEY not set in Render',
          details: data
        });
      } else {
        updateCheck('DeepSeek API', {
          status: 'warning',
          message: 'Partial functionality',
          details: data
        });
      }
    } catch (error: any) {
      updateCheck('DeepSeek API', {
        status: 'error',
        message: `Failed: ${error.message}`
      });
    }

    // Test 3: Data Pipeline
    try {
      const response = await fetch(`${API_URL}/api/ai-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: '<html><body><h1>Test</h1><p>FAQ: Test question?</p></body></html>',
          isManualContent: true
        })
      });
      
      const data = await response.json();
      
      // Check if all expected fields exist
      const requiredFields = ['readinessScore', 'entityAnalysis', 'contentAnalysis', 'citations'];
      const missingFields = requiredFields.filter(field => !(field in data));
      
      if (missingFields.length === 0) {
        updateCheck('Data Pipeline', {
          status: 'success',
          message: 'All data fields present',
          details: { fields: requiredFields }
        });
      } else {
        updateCheck('Data Pipeline', {
          status: 'warning',
          message: `Missing fields: ${missingFields.join(', ')}`,
          details: { missing: missingFields, received: Object.keys(data) }
        });
      }
    } catch (error: any) {
      updateCheck('Data Pipeline', {
        status: 'error',
        message: `Failed: ${error.message}`
      });
    }

    // Test 4: Frontend Integration
    try {
      // Check if PulseSparkAIAgent exists
      const { PulseSparkAIAgent } = await import('@/services/ai');
      const agent = new PulseSparkAIAgent();
      
      // Test the agent
      const result = await agent.analyzeWebsite('example.com', { isManualContent: false });
      
      if (result && typeof result === 'object') {
        updateCheck('Frontend Integration', {
          status: 'success',
          message: 'PulseSparkAIAgent working',
          details: { hasResult: true, fields: Object.keys(result).length }
        });
      } else {
        throw new Error('Invalid response from agent');
      }
    } catch (error: any) {
      updateCheck('Frontend Integration', {
        status: 'error',
        message: `Failed: ${error.message}`
      });
    }

    setIsComplete(true);
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <Loader2 className="w-5 h-5 animate-spin text-gray-500" />;
    }
  };

  const allSuccess = checks.every(c => c.status === 'success');
  const hasErrors = checks.some(c => c.status === 'error');

  return (
    <Card className={`${hasErrors ? 'border-red-500' : allSuccess ? 'border-green-500' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          System Health Check
          {isComplete && (allSuccess ? 
            <CheckCircle className="w-6 h-6 text-green-500" /> : 
            <AlertCircle className="w-6 h-6 text-yellow-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checks.map((check) => (
            <div key={check.name} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              {getIcon(check.status)}
              <div className="flex-1">
                <div className="font-medium">{check.name}</div>
                <div className="text-sm text-muted-foreground">{check.message}</div>
                {check.details && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer">View Details</summary>
                    <pre className="text-xs mt-1 p-2 bg-background rounded overflow-auto">
                      {JSON.stringify(check.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {isComplete && (
          <div className={`mt-4 p-3 rounded-lg ${
            allSuccess ? 'bg-green-50 text-green-900' : 
            hasErrors ? 'bg-red-50 text-red-900' : 
            'bg-yellow-50 text-yellow-900'
          }`}>
            {allSuccess ? '✅ All systems operational' : 
             hasErrors ? '❌ System issues detected - check details above' :
             '⚠️ System partially operational'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ApiKeyValidatorProps {
  apiKeys: {
    openai: string;
    perplexity: string;
    google_analytics: string;
    screaming_frog: string;
  };
}

export const ApiKeyValidator = ({ apiKeys }: ApiKeyValidatorProps) => {
  const { user } = useAuth();
  const [validating, setValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    openai?: boolean;
    perplexity?: boolean;
  }>({});

  const validatePerplexity = async (apiKey: string): Promise<boolean> => {
    try {
      // Use our test-scan edge function for validation
      const response = await fetch(`${process.env.SUPABASE_URL || 'https://ljhcqubwczhtwrfpploa.supabase.co'}/functions/v1/test-scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'test validation',
          perplexityKey: apiKey
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.apis?.perplexity?.success === true;
      }
      return false;
    } catch (error) {
      console.error('Perplexity validation error:', error);
      return false;
    }
  };

  const validateOpenAI = async (apiKey: string): Promise<boolean> => {
    try {
      // Use our test-scan edge function for validation
      const response = await fetch(`${process.env.SUPABASE_URL || 'https://ljhcqubwczhtwrfpploa.supabase.co'}/functions/v1/test-scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'test validation',
          openaiKey: apiKey
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.apis?.openai?.success === true;
      }
      return false;
    } catch (error) {
      console.error('OpenAI validation error:', error);
      return false;
    }
  };

  const handleValidateKeys = async () => {
    setValidating(true);
    const results: typeof validationResults = {};

    try {
      // Validate OpenAI key
      if (apiKeys.openai) {
        console.log('Validating OpenAI key...');
        results.openai = await validateOpenAI(apiKeys.openai);
      }

      // Validate Perplexity key
      if (apiKeys.perplexity) {
        console.log('Validating Perplexity key...');
        results.perplexity = await validatePerplexity(apiKeys.perplexity);
      }

      setValidationResults(results);
      
      const validKeys = Object.values(results).filter(Boolean).length;
      const totalKeys = Object.keys(results).length;
      
      if (validKeys === totalKeys) {
        toast({
          title: "All API keys validated",
          description: `${validKeys} API key(s) are working correctly.`,
        });
      } else {
        toast({
          title: "Some API keys failed validation",
          description: `${validKeys}/${totalKeys} API key(s) are valid. Check invalid keys.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Validation failed",
        description: "Unable to validate API keys. Please try again.",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  const getValidationIcon = (key: keyof typeof validationResults) => {
    if (validating) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (validationResults[key] === true) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (validationResults[key] === false) return <XCircle className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">API Key Validation</Label>
        <Button
          onClick={handleValidateKeys}
          disabled={validating || (!apiKeys.openai && !apiKeys.perplexity)}
          variant="outline"
          size="sm"
        >
          {validating ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Validate Keys
        </Button>
      </div>
      
      {(apiKeys.openai || apiKeys.perplexity) && (
        <div className="space-y-2 text-sm">
          {apiKeys.openai && (
            <div className="flex items-center justify-between">
              <span>OpenAI API Key</span>
              {getValidationIcon('openai')}
            </div>
          )}
          {apiKeys.perplexity && (
            <div className="flex items-center justify-between">
              <span>Perplexity API Key</span>
              {getValidationIcon('perplexity')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const SampleDataScript = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createSampleData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Please log in first",
          variant: "destructive",
        });
        return;
      }

      // Create sample scan data
      const sampleScanResults = {
        visibility_score: 87,
        citations: [
          { domain: "perplexity.ai", count: 12, queries: ["AI tools", "machine learning"] },
          { domain: "openai.com", count: 8, queries: ["ChatGPT", "AI assistant"] },
          { domain: "competitor.com", count: 4, queries: ["AI platform"] }
        ],
        sentiment: {
          positive: 65,
          neutral: 25,
          negative: 10
        },
        rankings: [
          { query: "AI tools", engine: "Perplexity", rank: 3, position_change: 1 },
          { query: "machine learning", engine: "ChatGPT", rank: 5, position_change: -1 }
        ],
        prompt_trends: {
          gained: ["AI automation", "smart assistant"],
          lost: ["chatbot platform"],
          improved: ["AI tools"]
        },
        competitor_traffic: [
          { competitor: "OpenAI", score: 85 },
          { competitor: "Anthropic", score: 72 },
          { competitor: "Google AI", score: 90 }
        ],
        trending_pages: [
          { 
            competitor: "OpenAI", 
            pages: [
              { url: "https://openai.com/gpt-4", title: "GPT-4 Overview", date: "2024-01-15" },
              { url: "https://openai.com/api", title: "OpenAI API", date: "2024-01-14" }
            ]
          }
        ]
      };

      const { error } = await supabase
        .from('scans')
        .insert({
          user_id: user.id,
          scan_type: 'visibility',
          target_url: 'example.com',
          results: sampleScanResults,
          status: 'completed'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Sample data created successfully",
      });
    } catch (error) {
      console.error('Error creating sample data:', error);
      toast({
        title: "Error",
        description: "Failed to create sample data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border border-border rounded-lg bg-muted/50">
      <h3 className="text-lg font-semibold mb-2">Development Tools</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Create sample scan data for testing the dashboard features.
      </p>
      <Button 
        onClick={createSampleData}
        disabled={loading}
        variant="outline"
      >
        {loading ? "Creating..." : "Create Sample Data"}
      </Button>
    </div>
  );
};
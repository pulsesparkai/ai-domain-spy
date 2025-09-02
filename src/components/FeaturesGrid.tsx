import { Search, BarChart3, TrendingUp, Users, Brain, Target, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "AI Visibility Score",
    description: "Get a comprehensive score showing how visible your domain is across AI search platforms"
  },
  {
    icon: BarChart3,
    title: "Citation Tracking",
    description: "Monitor when and how your content is cited by AI models in their responses"
  },
  {
    icon: TrendingUp,
    title: "Sentiment Analysis",
    description: "Understand the sentiment and context when AI models reference your brand"
  },
  {
    icon: Target,
    title: "AI Rankings",
    description: "Track your ranking position for key queries across different AI platforms"
  },
  {
    icon: Search,
    title: "Prompt Trends",
    description: "Discover trending prompts and queries that drive traffic to your domain"
  },
  {
    icon: Users,
    title: "Competitor Analysis",
    description: "Compare your AI search presence against competitors in your industry"
  },
  {
    icon: Globe,
    title: "Content Optimization",
    description: "Get insights on how to optimize your content for better AI search visibility"
  },
  {
    icon: BarChart3,
    title: "Performance Reports",
    description: "Comprehensive reports and analytics to track your AI search performance over time"
  }
];

const FeaturesGrid = () => {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-h2 text-foreground font-semibold mb-4">
            Comprehensive AI Search Analytics
          </h2>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Everything you need to understand, track, and optimize your presence in AI search results
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="shadow-card border-border hover:shadow-lg transition-base">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-h3 text-foreground font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-caption text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
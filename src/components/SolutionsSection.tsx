import { Megaphone, Settings, Headphones, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const solutions = [
  {
    icon: Megaphone,
    title: "Marketing Teams",
    description: "Track brand mentions and optimize content strategy for AI search engines. Monitor competitor positioning and discover trending topics.",
    color: "solution-marketing",
    link: "/solutions/marketing"
  },
  {
    icon: Settings,
    title: "Product Teams",
    description: "Understand how your product is represented in AI responses. Identify feature gaps and opportunities for product positioning.",
    color: "solution-product", 
    link: "/solutions/product"
  },
  {
    icon: Headphones,
    title: "Support Teams",
    description: "Monitor customer sentiment and common questions across AI platforms. Improve support content based on AI search trends.",
    color: "solution-support",
    link: "/solutions/support"
  },
  {
    icon: Database,
    title: "Data Teams",
    description: "Access comprehensive analytics and reporting on AI search performance. Export data for deeper analysis and integration.",
    color: "solution-data",
    link: "/solutions/data"
  }
];

const SolutionsSection = () => {
  return (
    <section className="py-16 bg-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-h2 text-foreground font-semibold mb-4">
            Solutions for Every Team
          </h2>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Tailored insights and analytics to help different teams optimize their AI search presence
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {solutions.map((solution, index) => (
            <Card key={index} className="shadow-card border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 bg-${solution.color}/10`}
                >
                  <solution.icon className={`w-5 h-5 text-${solution.color}`} />
                </div>
                <h3 className="text-lg text-foreground font-semibold mb-3">
                  {solution.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {solution.description}
                </p>
                <a 
                  href={solution.link}
                  className="text-sm text-primary font-medium hover:text-primary/80 transition-colors"
                >
                  Learn more →
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionsSection;
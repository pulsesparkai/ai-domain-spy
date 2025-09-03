import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Star, ChevronDown } from 'lucide-react';

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Marketing Director",
    company: "TechCorp",
    quote: "PulseSpark.ai transformed how we track our AI visibility. We increased our citation rate by 300% in just 2 months.",
    rating: 5,
    avatar: "#F0F0F0"
  },
  {
    name: "Michael Rodriguez", 
    role: "Founder",
    company: "StartupXYZ",
    quote: "Finally, a tool that shows how our brand appears in AI search results. The insights are invaluable for our SEO strategy.",
    rating: 5,
    avatar: "#F0F0F0"
  },
  {
    name: "Emma Thompson",
    role: "Content Manager", 
    company: "MediaFlow",
    quote: "The real-time tracking across platforms like Perplexity and ChatGPT gives us a competitive edge we never had before.",
    rating: 5,
    avatar: "#F0F0F0"
  }
];

const faqs = [
  {
    question: "How does the AI visibility scoring work?",
    answer: "Our composite scoring algorithm analyzes citations, mentions, and ranking positions across major AI platforms like Perplexity, ChatGPT, and Claude. Scores range from 0-100, with higher scores indicating better visibility."
  },
  {
    question: "Which AI platforms do you monitor?",
    answer: "We currently track Perplexity.ai, ChatGPT, Claude, and other major AI search platforms. We're constantly adding new platforms as they emerge in the market."
  },
  {
    question: "How often is the data updated?",
    answer: "Real-time scans provide immediate results, while our background monitoring updates visibility scores every 24 hours for Pro subscribers."
  },
  {
    question: "Can I export my scan results?",
    answer: "Yes! Pro subscribers can export all scan data to CSV format for further analysis and reporting. The export includes citations, sentiment analysis, and trend data."
  },
  {
    question: "Do I need API keys to use the platform?",
    answer: "For basic functionality, no API keys are required. However, to unlock real-time scanning with Perplexity and OpenAI, you'll need to provide your own API keys in the Settings page."
  },
  {
    question: "What's included in the free trial?",
    answer: "The 7-day free trial includes up to 100 scans, access to all AI platforms, sentiment analysis, and basic reporting. No credit card required to start."
  }
];

export const TestimonialsSection = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Trusted by Marketing Teams Worldwide
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how companies are using PulseSpark.ai to dominate AI search results
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-white border border-border rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div 
                    className="rounded-full mr-4"
                    style={{ 
                      backgroundColor: testimonial.avatar,
                      width: '60px',
                      height: '60px'
                    }}
                  />
                  <div>
                    <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </div>
                
                <p className="mb-4 italic text-muted-foreground text-base">
                  "{testimonial.quote}"
                </p>
                
                <div className="flex items-center">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star 
                      key={i} 
                      className="w-4 h-4 fill-current text-warning"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export const FAQSection = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about AI visibility tracking
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-left font-medium text-foreground text-lg">
                      {faq.question}
                    </span>
                    <ChevronDown 
                      className="w-5 h-5 ml-4 transition-transform text-primary"
                    />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <p className="leading-relaxed text-muted-foreground text-sm">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
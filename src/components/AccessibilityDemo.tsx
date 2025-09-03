import React from 'react';
import { AccessibleScanInterface } from '@/components/AccessibleScanInterface';
import { AccessibleNavigation, defaultNavigationItems } from '@/components/AccessibleNavigation';
import { SkipLink } from '@/hooks/useAccessibility';

export const AccessibilityDemoPage: React.FC = () => {
  const [scanResults, setScanResults] = React.useState([]);
  const [isScanning, setIsScanning] = React.useState(false);

  const handleScan = async (queries: string[], scanType: string) => {
    setIsScanning(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockResults = queries.map((query, index) => ({
        id: `result-${index}`,
        query,
        sentiment: ['positive', 'neutral', 'negative'][index % 3],
        platform: ['ChatGPT', 'Claude', 'Perplexity'][index % 3],
        summary: `AI platform analysis for "${query}" shows ${['positive', 'neutral', 'negative'][index % 3]} sentiment with relevant mentions.`,
        fullContent: `Detailed analysis of "${query}" across AI platforms reveals comprehensive insights about brand perception, competitive positioning, and market trends. This content provides valuable data for strategic decision making.`
      }));
      setScanResults(mockResults);
      setIsScanning(false);
    }, 3000);
  };

  const handleNavigate = (href: string) => {
    console.log(`Navigating to: ${href}`);
    // In a real app, this would use your router
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Links */}
      <SkipLink href="#main-navigation">Skip to navigation</SkipLink>
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#scan-interface">Skip to scan interface</SkipLink>

      {/* Screen reader live region for announcements */}
      <div id="announcements" aria-live="polite" aria-atomic="true" className="sr-only" />

      {/* Header with Navigation */}
      <header role="banner" className="bg-card border-b">
        <div className="container mx-auto px-4">
          <AccessibleNavigation
            items={defaultNavigationItems}
            currentPath="/scan"
            onNavigate={handleNavigate}
            variant="horizontal"
            showSearch={true}
            logo={
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg" aria-hidden="true" />
                <span className="font-bold text-lg">AI Scanner</span>
              </div>
            }
          />
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" role="main" className="container mx-auto px-4 py-8">
        <div id="scan-interface">
          <AccessibleScanInterface
            onScan={handleScan}
            isScanning={isScanning}
            results={scanResults}
          />
        </div>
      </main>

      {/* Footer */}
      <footer role="contentinfo" className="bg-muted mt-16 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-muted-foreground">
              © 2024 AI Visibility Scanner. Built with accessibility in mind.
            </p>
            <nav aria-label="Footer navigation" className="mt-4">
              <ul className="flex justify-center gap-6 text-sm">
                <li>
                  <a href="/privacy" className="text-muted-foreground hover:text-foreground">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="text-muted-foreground hover:text-foreground">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/accessibility" className="text-muted-foreground hover:text-foreground">
                    Accessibility Statement
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-muted-foreground hover:text-foreground">
                    Contact Support
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
};
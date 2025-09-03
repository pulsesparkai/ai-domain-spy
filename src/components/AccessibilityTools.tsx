import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX,
  Keyboard,
  MousePointer,
  Contrast,
  Type
} from 'lucide-react';
import { checkColorContrast } from '@/hooks/useAccessibility';

interface AccessibilityToolsProps {
  className?: string;
}

export const AccessibilityTools: React.FC<AccessibilityToolsProps> = ({ className = '' }) => {
  const [highContrast, setHighContrast] = React.useState(false);
  const [fontSize, setFontSize] = React.useState(16);
  const [keyboardOnly, setKeyboardOnly] = React.useState(false);
  const [screenReader, setScreenReader] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    // Apply accessibility settings
    document.documentElement.style.fontSize = `${fontSize}px`;
    
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    if (keyboardOnly) {
      document.documentElement.classList.add('keyboard-only');
      // Hide mouse cursor
      document.body.style.cursor = 'none';
    } else {
      document.documentElement.classList.remove('keyboard-only');
      document.body.style.cursor = 'auto';
    }

    if (reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [highContrast, fontSize, keyboardOnly, reducedMotion]);

  const runAccessibilityCheck = () => {
    const issues = [];
    
    // Check for missing alt text
    const images = document.querySelectorAll('img:not([alt])');
    if (images.length > 0) {
      issues.push(`${images.length} images missing alt text`);
    }

    // Check for missing form labels
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    const unlabeledInputs = Array.from(inputs).filter(input => {
      const labels = document.querySelectorAll(`label[for="${input.id}"]`);
      return labels.length === 0;
    });
    if (unlabeledInputs.length > 0) {
      issues.push(`${unlabeledInputs.length} form inputs missing labels`);
    }

    // Check for missing heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    let hierarchyIssues = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        hierarchyIssues++;
      }
      previousLevel = level;
    });
    if (hierarchyIssues > 0) {
      issues.push(`${hierarchyIssues} heading hierarchy issues`);
    }

    // Check color contrast
    const colorElements = document.querySelectorAll('[class*="text-"], [class*="bg-"]');
    let contrastIssues = 0;
    colorElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      if (color && backgroundColor) {
        const contrast = checkColorContrast(color, backgroundColor);
        if (contrast < 4.5) {
          contrastIssues++;
        }
      }
    });
    if (contrastIssues > 0) {
      issues.push(`${contrastIssues} potential color contrast issues`);
    }

    return issues;
  };

  const [accessibilityIssues, setAccessibilityIssues] = React.useState<string[]>([]);

  React.useEffect(() => {
    const issues = runAccessibilityCheck();
    setAccessibilityIssues(issues);
  }, []);

  const getAccessibilityScore = () => {
    const maxIssues = 20; // Baseline for scoring
    const currentIssues = accessibilityIssues.length;
    return Math.max(0, Math.round(((maxIssues - currentIssues) / maxIssues) * 100));
  };

  const score = getAccessibilityScore();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Accessibility Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" aria-hidden="true" />
            Accessibility Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{score}/100</span>
              <Badge 
                variant={score >= 90 ? 'default' : score >= 70 ? 'secondary' : 'destructive'}
                className="text-sm"
              >
                {score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
            <Progress value={score} className="w-full" />
            
            {accessibilityIssues.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Issues Found:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {accessibilityIssues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* High Contrast Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Contrast className="h-4 w-4" aria-hidden="true" />
              <span>High Contrast Mode</span>
            </div>
            <Button
              variant={highContrast ? 'default' : 'outline'}
              size="sm"
              onClick={() => setHighContrast(!highContrast)}
              aria-label={`${highContrast ? 'Disable' : 'Enable'} high contrast mode`}
            >
              {highContrast ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          {/* Font Size Control */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4" aria-hidden="true" />
              <span>Font Size: {fontSize}px</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                aria-label="Decrease font size"
              >
                A-
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFontSize(16)}
                aria-label="Reset font size to default"
              >
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                aria-label="Increase font size"
              >
                A+
              </Button>
            </div>
          </div>

          {/* Keyboard Only Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" aria-hidden="true" />
              <span>Keyboard Only Navigation</span>
            </div>
            <Button
              variant={keyboardOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setKeyboardOnly(!keyboardOnly)}
              aria-label={`${keyboardOnly ? 'Disable' : 'Enable'} keyboard only navigation`}
            >
              {keyboardOnly ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          {/* Screen Reader Simulation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {screenReader ? (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              )}
              <span>Screen Reader Simulation</span>
            </div>
            <Button
              variant={screenReader ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScreenReader(!screenReader)}
              aria-label={`${screenReader ? 'Disable' : 'Enable'} screen reader simulation`}
            >
              {screenReader ? 'On' : 'Off'}
            </Button>
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MousePointer className="h-4 w-4" aria-hidden="true" />
              <span>Reduced Motion</span>
            </div>
            <Button
              variant={reducedMotion ? 'default' : 'outline'}
              size="sm"
              onClick={() => setReducedMotion(!reducedMotion)}
              aria-label={`${reducedMotion ? 'Disable' : 'Enable'} reduced motion`}
            >
              {reducedMotion ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>WCAG 2.1 Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
              <span className="text-sm">Level A: Basic accessibility features</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
              <span className="text-sm">Level AA: Enhanced accessibility</span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <span className="text-sm">Level AAA: Advanced accessibility (partial)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Quick Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>Use Tab and Shift+Tab to navigate through interactive elements</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>Press Enter or Space to activate buttons and links</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>Use arrow keys to navigate through lists and menus</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>Press Escape to close modals and dropdown menus</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
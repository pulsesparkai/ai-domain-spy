import React from 'react';
import { EnhancedTooltip } from '@/components/ui/enhanced-tooltip';
import { Info } from 'lucide-react';

// Example usage of the enhanced tooltip system
export const TooltipExamples = () => {
  return (
    <div className="space-y-8 p-8">
      <h2 className="text-2xl font-bold">Enhanced Tooltip Examples</h2>
      
      {/* Basic tooltip */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Tooltip</h3>
        <EnhancedTooltip content="This is a basic tooltip with proper positioning">
          <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
            Hover me
          </button>
        </EnhancedTooltip>
      </div>

      {/* Mobile-friendly tooltip */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Mobile-Friendly (Click to show)</h3>
        <EnhancedTooltip 
          content="On mobile, tap to show this tooltip. Tap outside to hide it."
          mobile="click"
        >
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80">
            Tap me (mobile)
          </button>
        </EnhancedTooltip>
      </div>

      {/* Rich content tooltip */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Rich Content Tooltip</h3>
        <EnhancedTooltip 
          content={
            <div className="space-y-2">
              <p className="font-medium">Advanced Features:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Automatic boundary detection</li>
                <li>Mobile-friendly interactions</li>
                <li>Proper z-index handling</li>
                <li>Arrow pointing to trigger</li>
              </ul>
            </div>
          }
          side="right"
          mobile="click"
        >
          <div className="inline-flex items-center gap-2 p-3 border border-border rounded-lg bg-card hover:bg-accent/50 cursor-help">
            <Info className="w-4 h-4" />
            <span>Rich Content</span>
          </div>
        </EnhancedTooltip>
      </div>

      {/* Different positioning */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Different Positions</h3>
        <div className="flex gap-4 justify-center">
          <EnhancedTooltip content="Top tooltip" side="top">
            <button className="px-3 py-2 bg-muted text-muted-foreground rounded">Top</button>
          </EnhancedTooltip>
          <EnhancedTooltip content="Right tooltip" side="right">
            <button className="px-3 py-2 bg-muted text-muted-foreground rounded">Right</button>
          </EnhancedTooltip>
          <EnhancedTooltip content="Bottom tooltip" side="bottom">
            <button className="px-3 py-2 bg-muted text-muted-foreground rounded">Bottom</button>
          </EnhancedTooltip>
          <EnhancedTooltip content="Left tooltip" side="left">
            <button className="px-3 py-2 bg-muted text-muted-foreground rounded">Left</button>
          </EnhancedTooltip>
        </div>
      </div>

      {/* Boundary detection demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Boundary Detection</h3>
        <div className="text-sm text-muted-foreground mb-4">
          These tooltips will automatically reposition to stay within the viewport:
        </div>
        <div className="flex justify-between">
          <EnhancedTooltip content="This tooltip will flip to stay in bounds" side="left">
            <button className="px-3 py-2 bg-warning text-warning-foreground rounded">
              Edge Left
            </button>
          </EnhancedTooltip>
          <EnhancedTooltip content="This tooltip will also flip to stay in bounds" side="right">
            <button className="px-3 py-2 bg-warning text-warning-foreground rounded">
              Edge Right
            </button>
          </EnhancedTooltip>
        </div>
      </div>
    </div>
  );
};
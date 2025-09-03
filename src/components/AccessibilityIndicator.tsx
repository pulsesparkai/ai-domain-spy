import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Keyboard, Eye, MousePointer } from 'lucide-react';

interface AccessibilityIndicatorProps {
  showKeyboardMode?: boolean;
  className?: string;
}

export const AccessibilityIndicator: React.FC<AccessibilityIndicatorProps> = ({
  showKeyboardMode = true,
  className
}) => {
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [lastInteraction, setLastInteraction] = useState<'keyboard' | 'mouse'>('mouse');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardMode(true);
        setLastInteraction('keyboard');
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardMode(false);
      setLastInteraction('mouse');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  if (!showKeyboardMode) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-notification ${className}`}>
      <Badge 
        variant={isKeyboardMode ? 'default' : 'secondary'}
        className="flex items-center gap-2 px-3 py-2"
      >
        {isKeyboardMode ? (
          <>
            <Keyboard className="w-4 h-4" />
            <span>Keyboard Navigation</span>
          </>
        ) : (
          <>
            <MousePointer className="w-4 h-4" />
            <span>Mouse Navigation</span>
          </>
        )}
      </Badge>
    </div>
  );
};

interface AccessibilityToolbarProps {
  onToggleHighContrast?: () => void;
  onToggleFocusMode?: () => void;
  onToggleScreenReader?: () => void;
  className?: string;
}

export const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({
  onToggleHighContrast,
  onToggleFocusMode,
  onToggleScreenReader,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleKeyDown = (e: KeyboardEvent) => {
    // Alt + A to toggle accessibility toolbar
    if (e.altKey && e.key === 'a') {
      e.preventDefault();
      setIsVisible(!isVisible);
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  if (!isVisible) {
    return (
      <div className="sr-only">
        Press Alt + A to open accessibility tools
      </div>
    );
  }

  return (
    <div 
      className={`fixed top-20 right-4 z-notification bg-background border rounded-lg p-4 shadow-lg ${className}`}
      role="toolbar"
      aria-label="Accessibility tools"
    >
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleHighContrast}
          className="justify-start"
        >
          <Eye className="w-4 h-4 mr-2" />
          High Contrast
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFocusMode}
          className="justify-start"
        >
          <Keyboard className="w-4 h-4 mr-2" />
          Focus Mode
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="justify-start text-muted-foreground"
        >
          Close (Alt + A)
        </Button>
      </div>
    </div>
  );
};
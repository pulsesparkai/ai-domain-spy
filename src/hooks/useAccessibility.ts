import React, { useCallback, useEffect, useRef } from 'react';

// Enhanced focus management
export const useFocusManagement = () => {
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    lastFocusedElement.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (lastFocusedElement.current && lastFocusedElement.current.focus) {
      lastFocusedElement.current.focus();
    }
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: Event) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key !== 'Tab') return;

      if (keyEvent.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          keyEvent.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          keyEvent.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  return { saveFocus, restoreFocus, trapFocus };
};

// Keyboard navigation hook
export const useKeyboardNavigation = (
  items: Array<{ id: string; element?: HTMLElement }>,
  onSelect?: (id: string) => void
) => {
  const currentIndex = useRef(0);

  const navigateToIndex = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      currentIndex.current = index;
      const item = items[index];
      if (item.element) {
        item.element.focus();
      }
    }
  }, [items]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        navigateToIndex((currentIndex.current + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        navigateToIndex(currentIndex.current - 1 < 0 ? items.length - 1 : currentIndex.current - 1);
        break;
      case 'Home':
        e.preventDefault();
        navigateToIndex(0);
        break;
      case 'End':
        e.preventDefault();
        navigateToIndex(items.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (onSelect && items[currentIndex.current]) {
          onSelect(items[currentIndex.current].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        // Handle escape logic
        break;
    }
  }, [items, navigateToIndex, onSelect]);

  return { handleKeyDown, navigateToIndex };
};

// Screen reader announcements
export const useScreenReader = () => {
  const announcementRef = useRef<HTMLDivElement | null>(null);

  const createAnnouncementElement = useCallback(() => {
    if (!announcementRef.current) {
      const element = document.createElement('div');
      element.setAttribute('aria-live', 'polite');
      element.setAttribute('aria-atomic', 'true');
      element.className = 'sr-only';
      element.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(element);
      announcementRef.current = element;
    }
    return announcementRef.current;
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const element = createAnnouncementElement();
    element.setAttribute('aria-live', priority);
    
    // Clear previous message
    element.textContent = '';
    
    // Add new message after a brief delay to ensure screen readers notice the change
    setTimeout(() => {
      element.textContent = message;
    }, 100);

    // Clear message after announcement
    setTimeout(() => {
      element.textContent = '';
    }, 1000);
  }, [createAnnouncementElement]);

  const announceError = useCallback((message: string) => {
    announce(`Error: ${message}`, 'assertive');
  }, [announce]);

  const announceSuccess = useCallback((message: string) => {
    announce(`Success: ${message}`, 'polite');
  }, [announce]);

  const announceLoading = useCallback((message: string = 'Loading') => {
    announce(message, 'polite');
  }, [announce]);

  useEffect(() => {
    return () => {
      if (announcementRef.current) {
        document.body.removeChild(announcementRef.current);
      }
    };
  }, []);

  return { announce, announceError, announceSuccess, announceLoading };
};

// Color contrast checker
export const checkColorContrast = (foreground: string, background: string): number => {
  // Convert HSL to RGB then calculate luminance
  const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;
    
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / (1/12)) % 12;
      return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };
    
    return [f(0) * 255, f(8) * 255, f(4) * 255];
  };

  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  // Parse HSL values (simplified for this example)
  const parseHSL = (hsl: string) => {
    const matches = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (matches) {
      return [parseInt(matches[1]), parseInt(matches[2]), parseInt(matches[3])];
    }
    return [0, 0, 0];
  };

  const [h1, s1, l1] = parseHSL(foreground);
  const [h2, s2, l2] = parseHSL(background);

  const [r1, g1, b1] = hslToRgb(h1, s1, l1);
  const [r2, g2, b2] = hslToRgb(h2, s2, l2);

  const lum1 = getLuminance(r1, g1, b1);
  const lum2 = getLuminance(r2, g2, b2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

// Skip link component for navigation
export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => {
  return React.createElement('a', {
    href,
    className: "sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:no-underline",
    style: { zIndex: 9999 }
  }, children);
};

// Accessible heading component with proper hierarchy
export const AccessibleHeading: React.FC<{ 
  level: 1 | 2 | 3 | 4 | 5 | 6; 
  children: React.ReactNode; 
  className?: string;
  id?: string;
}> = ({ level, children, className = '', id }) => {
  return React.createElement(`h${level}`, {
    id,
    className: `heading-${level} ${className}`,
    tabIndex: -1
  }, children);
};

// Accessible button with enhanced ARIA support
export const AccessibleButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaPressed?: boolean;
  ariaControls?: string;
  ariaCurrent?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  [key: string]: any;
}> = ({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaPressed,
  ariaControls,
  ariaCurrent,
  type = 'button',
  className = '',
  ...props
}) => {
  return React.createElement('button', {
    type,
    onClick,
    disabled,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-expanded': ariaExpanded,
    'aria-pressed': ariaPressed,
    'aria-controls': ariaControls,
    'aria-current': ariaCurrent,
    className: `focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`,
    ...props
  }, children);
};

// Form validation with screen reader support
export const useAccessibleForm = () => {
  const { announceError } = useScreenReader();

  const validateField = useCallback((
    value: string, 
    rules: Array<{ test: (val: string) => boolean; message: string }>,
    fieldName: string
  ) => {
    for (const rule of rules) {
      if (!rule.test(value)) {
        announceError(`${fieldName}: ${rule.message}`);
        return { isValid: false, message: rule.message };
      }
    }
    return { isValid: true, message: '' };
  }, [announceError]);

  return { validateField };
};
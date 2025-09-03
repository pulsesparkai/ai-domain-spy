import React, { useEffect, useCallback } from 'react';
import { useKeyboardNavigation } from '@/hooks/useAccessibility';

interface KeyboardNavigationProps {
  children: React.ReactNode;
  onEscape?: () => void;
  trapFocus?: boolean;
  restoreFocus?: boolean;
}

export const KeyboardNavigationProvider: React.FC<KeyboardNavigationProps> = ({
  children,
  onEscape,
  trapFocus = false,
  restoreFocus = false
}) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Global escape key handler
    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      onEscape();
    }
  }, [onEscape]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div role="application" aria-label="Application content">
      {children}
    </div>
  );
};

interface NavigableListProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  loop?: boolean;
  className?: string;
  role?: string;
}

export const NavigableList: React.FC<NavigableListProps> = ({
  children,
  orientation = 'vertical',
  loop = true,
  className,
  role = 'menu'
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Basic keyboard navigation - can be enhanced based on needs
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const focusableElements = Array.from(
        (e.currentTarget as HTMLElement).querySelectorAll('[tabindex="0"], button, a, input, select, textarea')
      ) as HTMLElement[];
      
      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
      let nextIndex;
      
      if (e.key === 'ArrowDown') {
        nextIndex = currentIndex + 1;
        if (nextIndex >= focusableElements.length) {
          nextIndex = loop ? 0 : currentIndex;
        }
      } else {
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) {
          nextIndex = loop ? focusableElements.length - 1 : currentIndex;
        }
      }
      
      focusableElements[nextIndex]?.focus();
    }
  };

  return (
    <div
      role={role}
      className={`focus-visible-ring ${className}`}
      onKeyDown={handleKeyDown}
      aria-orientation={orientation}
    >
      {children}
    </div>
  );
};

interface NavigableItemProps {
  children: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
}

export const NavigableItem: React.FC<NavigableItemProps> = ({
  children,
  onSelect,
  disabled = false,
  className
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onSelect && !disabled) {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      className={`interactive-element focus-visible-ring ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={disabled ? undefined : onSelect}
      onKeyDown={handleKeyDown}
      aria-disabled={disabled}
    >
      {children}
    </div>
  );
};
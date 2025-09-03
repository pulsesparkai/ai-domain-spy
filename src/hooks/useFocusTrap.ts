import { useEffect, useRef, useCallback } from 'react';

interface FocusTrapOptions {
  active: boolean;
  restoreFocus?: boolean;
  allowOutsideClick?: boolean;
}

export const useFocusTrap = ({
  active,
  restoreFocus = true,
  allowOutsideClick = false
}: FocusTrapOptions) => {
  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback((container: HTMLElement) => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }, []);

  const focusFirstElement = useCallback(() => {
    if (!containerRef.current) return;
    
    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [getFocusableElements]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!active || !containerRef.current) return;

    const focusableElements = getFocusableElements(containerRef.current);
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [active, getFocusableElements]);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (!active || !containerRef.current || allowOutsideClick) return;

    if (!containerRef.current.contains(e.target as Node)) {
      e.preventDefault();
      focusFirstElement();
    }
  }, [active, allowOutsideClick, focusFirstElement]);

  useEffect(() => {
    if (active) {
      // Save current focus
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Add body class to indicate focus trap is active
      document.body.classList.add('focus-trap-active');
      
      // Focus first element
      setTimeout(focusFirstElement, 0);
      
      // Add event listeners
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleClickOutside);
        document.body.classList.remove('focus-trap-active');
        
        // Restore focus if needed
        if (restoreFocus && previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [active, handleKeyDown, handleClickOutside, focusFirstElement, restoreFocus]);

  return containerRef;
};
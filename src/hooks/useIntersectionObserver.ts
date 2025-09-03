import { useEffect, useRef, useState, RefObject } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  elementRef: RefObject<Element>,
  {
    threshold = 0,
    root = null,
    rootMargin = '50px',
    freezeOnceVisible = false,
  }: UseIntersectionObserverProps = {}
): boolean {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // If freezeOnceVisible is true and element has been visible, don't observe anymore
    if (freezeOnceVisible && hasBeenVisible) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const elementIsVisible = entry.isIntersecting;
        setIsVisible(elementIsVisible);
        
        if (elementIsVisible && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, threshold, root, rootMargin, freezeOnceVisible, hasBeenVisible]);

  return freezeOnceVisible ? hasBeenVisible : isVisible;
}

// Hook for lazy loading components when they come into view
export function useLazyLoad(threshold = 0, rootMargin = '50px') {
  const elementRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(elementRef, {
    threshold,
    rootMargin,
    freezeOnceVisible: true,
  });

  return { elementRef, isVisible };
}
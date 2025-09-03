import { memo } from 'react';
import { useLazyLoad } from '@/hooks/useIntersectionObserver';
import { CardSkeleton } from './DashboardSkeleton';

interface LazyComponentWrapperProps {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  fallback?: React.ReactNode;
}

export const LazyComponentWrapper = memo(({ 
  children, 
  threshold = 0, 
  rootMargin = '100px',
  fallback = <CardSkeleton />
}: LazyComponentWrapperProps) => {
  const { elementRef, isVisible } = useLazyLoad(threshold, rootMargin);

  return (
    <div ref={elementRef}>
      {isVisible ? children : fallback}
    </div>
  );
});

LazyComponentWrapper.displayName = 'LazyComponentWrapper';
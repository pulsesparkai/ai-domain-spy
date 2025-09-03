// Lazy-loaded code block component with proper chunking
import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load PrismJS with proper chunking
const PrismCodeBlock = lazy(() => 
  import('./PrismCodeBlock').then(module => ({
    default: module.PrismCodeBlock
  }))
);

interface LazyCodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

const CodeBlockSkeleton = ({ className }: { className?: string }) => (
  <div className={`space-y-2 ${className}`}>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

export const LazyCodeBlock = ({ code, language = 'javascript', className = '' }: LazyCodeBlockProps) => {
  return (
    <Suspense fallback={<CodeBlockSkeleton className={className} />}>
      <PrismCodeBlock code={code} language={language} className={className} />
    </Suspense>
  );
};
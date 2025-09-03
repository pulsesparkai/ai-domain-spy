import { cn } from '@/lib/utils';

interface ImageSkeletonProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const ImageSkeleton: React.FC<ImageSkeletonProps> = ({
  className,
  width,
  height,
}) => {
  return (
    <div 
      className={cn(
        "animate-pulse bg-muted rounded-md flex items-center justify-center",
        className
      )}
      style={{ width, height }}
    >
      <div className="w-8 h-8 bg-muted-foreground/20 rounded flex items-center justify-center">
        <span className="text-muted-foreground/40 text-xs">📷</span>
      </div>
    </div>
  );
};
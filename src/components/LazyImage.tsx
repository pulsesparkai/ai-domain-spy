import React, { useState } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { cn } from '@/lib/utils';
import { ImageSkeleton } from '@/components/ImageSkeleton';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  effect?: 'blur' | 'black-and-white' | 'opacity';
  placeholder?: React.ReactNode;
  errorImage?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  effect = 'blur',
  placeholder,
  errorImage = '/placeholder.svg',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div className={cn("flex items-center justify-center bg-muted text-muted-foreground border border-border rounded-md", className)}>
        <div className="text-center p-4">
          <div className="text-sm mb-2">Failed to load image</div>
          <div className="w-8 h-8 mx-auto bg-muted-foreground/20 rounded flex items-center justify-center">
            <span className="text-xs">📷</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        placeholder || (
          <ImageSkeleton 
            className={cn("absolute inset-0 w-full h-full", className)}
            width={width}
            height={height}
          />
        )
      )}
      <LazyLoadImage
        src={src}
        alt={alt}
        effect={effect}
        className={cn(className, isLoading && "opacity-0")}
        width={width}
        height={height}
        onError={handleError}
        onLoad={handleLoad}
        placeholder={
          <ImageSkeleton 
            className={cn("w-full h-full", className)}
            width={width}
            height={height}
          />
        }
      />
    </div>
  );
};
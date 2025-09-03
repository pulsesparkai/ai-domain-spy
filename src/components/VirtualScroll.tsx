import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (props: { index: number; item: T }) => React.ReactElement;
  className?: string;
  overscan?: number;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  height,
  renderItem,
  className,
  overscan = 5,
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate visible range
  const containerHeight = height;
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + overscan,
    items.length
  );

  // Memoize visible items
  const visibleItems = useMemo(() => {
    return items.slice(Math.max(0, visibleStart - overscan), visibleEnd);
  }, [items, visibleStart, visibleEnd, overscan]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  if (items.length === 0) {
    return (
      <div 
        className={cn(className, "flex items-center justify-center h-full text-muted-foreground")}
        style={{ height }}
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No items to display
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(className, "overflow-auto")}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div className="relative" style={{ height: totalHeight }}>
        {visibleItems.map((item, index) => {
          const actualIndex = Math.max(0, visibleStart - overscan) + index;
          return (
            <div
              key={actualIndex}
              className="absolute w-full"
              style={{
                top: actualIndex * itemHeight,
                height: itemHeight,
              }}
            >
              {renderItem({ index: actualIndex, item })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Hook for paginated data fetching with cursor-based pagination
export function useCursorPagination<T>(
  fetchFunction: (cursor?: string, limit?: number) => Promise<{ data: T[], nextCursor?: string }>,
  limit = 50
) {
  const [data, setData] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction(nextCursor, limit);
      
      setData(prev => [...prev, ...result.data]);
      setNextCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, nextCursor, limit, loading, hasMore]);

  const reset = useCallback(() => {
    setData([]);
    setNextCursor(undefined);
    setHasMore(true);
    setError(null);
  }, []);

  // Load initial data
  useEffect(() => {
    if (data.length === 0 && hasMore && !loading) {
      loadMore();
    }
  }, [data.length, hasMore, loading, loadMore]);

  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
  };
}
// Query optimization utilities for Supabase
import { SupabaseClient } from '@supabase/supabase-js';

// In-memory cache for query results
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class QueryCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const keysToDelete = Array.from(this.cache.keys()).filter(key =>
      key.includes(pattern)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  size(): number {
    return this.cache.size;
  }
}

export const queryCache = new QueryCache();

// Generate cache key from query parameters
export function generateCacheKey(
  table: string,
  operation: string,
  params: Record<string, any> = {}
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {} as Record<string, any>);

  return `${table}:${operation}:${JSON.stringify(sortedParams)}`;
}

// Optimized query builder with caching
export class OptimizedQueryBuilder {
  constructor(
    private supabase: SupabaseClient,
    private tableName: string
  ) {}

  async selectOptimized(
    columns: string = '*',
    filters: Record<string, any> = {},
    options: {
      useCache?: boolean;
      cacheTTL?: number;
      limit?: number;
      orderBy?: { column: string; ascending?: boolean };
    } = {}
  ) {
    const cacheKey = generateCacheKey(this.tableName, 'select', {
      columns,
      filters,
      ...options,
    });

    // Check cache first
    if (options.useCache !== false) {
      const cached = queryCache.get(cacheKey);
      if (cached) {
        return { data: cached, error: null, fromCache: true };
      }
    }

    // Build optimized query
    let query = this.supabase.from(this.tableName).select(columns);

    // Apply filters efficiently
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    // Apply ordering (use indexed columns)
    if (options.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? false,
      });
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    // Cache successful results
    if (!error && options.useCache !== false) {
      queryCache.set(cacheKey, data, options.cacheTTL);
    }

    return { data, error, fromCache: false };
  }

  async insertOptimized(
    data: any | any[],
    options: {
      returning?: string;
      invalidateCache?: boolean;
    } = {}
  ) {
    const query = this.supabase.from(this.tableName).insert(data);

    const result = options.returning 
      ? await query.select(options.returning)
      : await query;

    // Invalidate related cache entries
    if (options.invalidateCache !== false) {
      queryCache.invalidate(this.tableName);
    }

    return result;
  }

  async updateOptimized(
    updates: Record<string, any>,
    filters: Record<string, any>,
    options: {
      returning?: string;
      invalidateCache?: boolean;
    } = {}
  ) {
    let query = this.supabase.from(this.tableName).update(updates);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const result = options.returning 
      ? await query.select(options.returning)
      : await query;

    // Invalidate related cache entries
    if (options.invalidateCache !== false) {
      queryCache.invalidate(this.tableName);
    }

    return result;
  }
}

// Batch query utility
export class QueryBatcher {
  private batches: Map<string, Array<{ 
    resolve: (value: any) => void; 
    reject: (error: any) => void; 
    params: any; 
  }>> = new Map();

  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private supabase: SupabaseClient,
    private batchDelay: number = 50 // 50ms delay to batch queries
  ) {}

  async batchSelect(
    tableName: string,
    columns: string,
    filters: Record<string, any>
  ): Promise<any> {
    const batchKey = `${tableName}:${columns}`;

    return new Promise((resolve, reject) => {
      // Add to batch
      if (!this.batches.has(batchKey)) {
        this.batches.set(batchKey, []);
      }

      this.batches.get(batchKey)!.push({ resolve, reject, params: filters });

      // Clear existing timeout
      if (this.timeouts.has(batchKey)) {
        clearTimeout(this.timeouts.get(batchKey)!);
      }

      // Set new timeout to execute batch
      const timeout = setTimeout(() => {
        this.executeBatch(tableName, columns, batchKey);
      }, this.batchDelay);

      this.timeouts.set(batchKey, timeout);
    });
  }

  private async executeBatch(
    tableName: string,
    columns: string,
    batchKey: string
  ) {
    const batch = this.batches.get(batchKey);
    if (!batch || batch.length === 0) return;

    this.batches.delete(batchKey);
    this.timeouts.delete(batchKey);

    try {
      // Collect all unique filter values
      const allFilters = batch.map(item => item.params);
      const uniqueValues = new Set();
      const filterKey = Object.keys(allFilters[0])[0]; // Assume single filter key for batching

      allFilters.forEach(filter => {
        if (filter[filterKey]) {
          uniqueValues.add(filter[filterKey]);
        }
      });

      // Execute single query with IN clause
      const { data, error } = await this.supabase
        .from(tableName)
        .select(columns)
        .in(filterKey, Array.from(uniqueValues));

      if (error) throw error;

      // Distribute results back to original requests
      batch.forEach(({ resolve, params }) => {
        const matchingData = data?.filter(item => 
          item[filterKey] === params[filterKey]
        ) || [];
        resolve(matchingData);
      });

    } catch (error) {
      // Reject all promises in the batch
      batch.forEach(({ reject }) => reject(error));
    }
  }
}

// Connection pool manager (simulated for client-side)
export class ConnectionManager {
  private activeConnections = 0;
  private readonly maxConnections = 10;
  private queue: Array<() => void> = [];

  async withConnection<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        if (this.activeConnections >= this.maxConnections) {
          this.queue.push(execute);
          return;
        }

        this.activeConnections++;
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeConnections--;
          
          // Process next in queue
          if (this.queue.length > 0) {
            const next = this.queue.shift();
            if (next) next();
          }
        }
      };

      execute();
    });
  }

  getStats() {
    return {
      activeConnections: this.activeConnections,
      queuedOperations: this.queue.length,
      maxConnections: this.maxConnections,
    };
  }
}

// Optimized query presets
export const OptimizedQueries = {
  // User-specific queries with proper indexing
  getUserProfile: (supabase: SupabaseClient, userId: string) =>
    new OptimizedQueryBuilder(supabase, 'profiles').selectOptimized(
      'id, user_id, email, full_name, avatar_url, subscription_status, trial_ends_at',
      { user_id: userId },
      { useCache: true, cacheTTL: 2 * 60 * 1000 } // Cache for 2 minutes
    ),

  getUserScans: (
    supabase: SupabaseClient, 
    userId: string, 
    limit: number = 50,
    status?: string
  ) =>
    new OptimizedQueryBuilder(supabase, 'scans').selectOptimized(
      'id, scan_type, status, target_url, created_at, updated_at',
      { user_id: userId, ...(status && { status }) },
      { 
        useCache: true, 
        limit,
        orderBy: { column: 'created_at', ascending: false }
      }
    ),

  getRecentScans: (supabase: SupabaseClient, userId: string) =>
    new OptimizedQueryBuilder(supabase, 'scans').selectOptimized(
      'id, scan_type, status, created_at',
      { user_id: userId, status: 'completed' },
      {
        limit: 10,
        orderBy: { column: 'created_at', ascending: false },
        useCache: true,
        cacheTTL: 60 * 1000 // Cache for 1 minute
      }
    ),

  // Analytics queries optimized for reporting
  getScanStats: async (supabase: SupabaseClient, userId: string) => {
    const cacheKey = generateCacheKey('scans', 'stats', { userId });
    const cached = queryCache.get(cacheKey);
    
    if (cached) {
      return { data: cached, error: null, fromCache: true };
    }

    // Use edge function for complex aggregations
    const { data, error } = await supabase.functions.invoke('get-scan-statistics', {
      body: { target_user_id: userId }
    });

    if (!error) {
      queryCache.set(cacheKey, data, 5 * 60 * 1000); // Cache for 5 minutes
    }

    return { data, error, fromCache: false };
  },
};

// Export configured instances
export const connectionManager = new ConnectionManager();
export const queryBatcher = new QueryBatcher(undefined as any); // Will be initialized with supabase client
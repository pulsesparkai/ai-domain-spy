// Query cache for minimizing schema introspection and optimizing database operations
import { supabase } from '@/integrations/supabase/client';

// In-memory cache for table schemas and definitions
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface TableSchema {
  table_name: string;
  columns: Array<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>;
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 1000 * 60 * 60; // 1 hour
  private readonly SCHEMA_TTL = 1000 * 60 * 60 * 24; // 24 hours for schema

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
export const queryCache = new QueryCache();

// Cached query builder for common operations
export class CachedQueryBuilder {
  private static tableSchemas = new Map<string, TableSchema>();

  // Cache table schema to avoid repeated introspection
  static async getTableSchema(tableName: string): Promise<TableSchema | null> {
    const cacheKey = `schema:${tableName}`;
    const cached = queryCache.get<TableSchema>(cacheKey);
    
    if (cached) {
      // Query cache hit for schema
      return cached;
    }

    try {
      // Schema introspection query executed
      
      // This is a minimal schema check - only get what we need
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

      if (error) {
        console.error(`Schema introspection error for ${tableName}:`, error);
        return null;
      }

      // Mock schema - in real implementation, you'd extract this from metadata
      const schema: TableSchema = {
        table_name: tableName,
        columns: [
          { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()' },
          { column_name: 'created_at', data_type: 'timestamp with time zone', is_nullable: 'NO', column_default: 'now()' },
          { column_name: 'updated_at', data_type: 'timestamp with time zone', is_nullable: 'NO', column_default: 'now()' },
        ],
      };

      queryCache.set(cacheKey, schema, queryCache['SCHEMA_TTL']);
      console.log(`Query completed: schema-introspection-${tableName}`, { cached: true });
      
      return schema;
    } catch (error) {
      console.error(`Failed to get schema for ${tableName}:`, error);
      return null;
    }
  }

  // Optimized select with prepared statement pattern
  static async selectWithPagination(
    tableName: string,
    columns: string = '*',
    filters: Record<string, any> = {},
    options: {
      limit?: number;
      offset?: number;
      orderBy?: { column: string; ascending?: boolean };
    } = {}
  ) {
    const cacheKey = `select:${tableName}:${JSON.stringify({ columns, filters, options })}`;
    const cached = queryCache.get(cacheKey);
    
    if (cached) {
      // Query cache hit
      return cached;
    }

    try {
      // SELECT query executed

      let query = supabase.from(tableName).select(columns);

      // Apply filters using prepared statement pattern
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (value === null) {
          query = query.is(key, null);
        } else {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        });
      }

      // Apply pagination with LIMIT/OFFSET
      if (options.limit) {
        if (options.offset) {
          query = query.range(options.offset, options.offset + options.limit - 1);
        } else {
          query = query.limit(options.limit);
        }
      }

      const result = await query;

      if (result.error) {
        console.error(`Query error for ${tableName}:`, result.error);
        throw result.error;
      }

      // Cache successful queries for 5 minutes
      queryCache.set(cacheKey, result, 1000 * 60 * 5);
      
      console.log('Query completed:', {
        operation: 'SELECT',
        table: tableName,
        count: result.data?.length || 0,
        cached: true,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error(`Select query failed for ${tableName}:`, error);
      throw error;
    }
  }

  // Optimized insert with batching capability
  static async insertOptimized(
    tableName: string,
    data: Record<string, any> | Record<string, any>[],
    options: { returning?: string; upsert?: boolean } = {}
  ) {
    try {
      // INSERT query executed

      let query;
      
      if (options.upsert) {
        query = supabase.from(tableName).upsert(data);
      } else {
        query = supabase.from(tableName).insert(data);
      }

      if (options.returning) {
        query = query.select(options.returning);
      }

      const result = await query;

      if (result.error) {
        console.error(`Insert error for ${tableName}:`, result.error);
        throw result.error;
      }

      // Invalidate related cache entries
      queryCache.invalidatePattern(`select:${tableName}:`);

      console.log('Query completed:', {
        operation: 'INSERT',
        table: tableName,
        success: true,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error(`Insert query failed for ${tableName}:`, error);
      throw error;
    }
  }

  // Optimized update with prepared statements
  static async updateOptimized(
    tableName: string,
    updates: Record<string, any>,
    filters: Record<string, any>,
    options: { returning?: string } = {}
  ) {
    try {
      // UPDATE query executed

      // Start with update and immediately apply first filter to get FilterBuilder type
      const filterEntries = Object.entries(filters);
      if (filterEntries.length === 0) {
        throw new Error('Update operation requires at least one filter for security');
      }

      const [firstKey, firstValue] = filterEntries[0];
      
      // Build query step by step to maintain proper types
      let baseQuery = supabase.from(tableName).update(updates);

      // Apply first filter to convert TransformBuilder to FilterBuilder
      let filteredQuery;
      if (Array.isArray(firstValue)) {
        filteredQuery = baseQuery.in(firstKey, firstValue);
      } else if (firstValue === null) {
        filteredQuery = baseQuery.is(firstKey, null);
      } else {
        filteredQuery = baseQuery.eq(firstKey, firstValue);
      }

      // Apply remaining filters
      let finalQuery = filteredQuery;
      filterEntries.slice(1).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          finalQuery = finalQuery.in(key, value);
        } else if (value === null) {
          finalQuery = finalQuery.is(key, null);
        } else {
          finalQuery = finalQuery.eq(key, value);
        }
      });

      // Apply select if needed
      const queryToExecute = options.returning ? finalQuery.select(options.returning) : finalQuery;
      const result = await queryToExecute;

      if (result.error) {
        console.error(`Update error for ${tableName}:`, result.error);
        throw result.error;
      }

      // Invalidate related cache entries
      queryCache.invalidatePattern(`select:${tableName}:`);

      console.log('Query completed:', {
        operation: 'UPDATE',
        table: tableName,
        success: true,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error(`Update query failed for ${tableName}:`, error);
      throw error;
    }
  }
}

// Predefined optimized queries for common operations
export const OptimizedQueries = {
  // Get user scans with pagination
  getUserScans: async (userId: string, limit: number = 20, offset: number = 0) => {
    return CachedQueryBuilder.selectWithPagination(
      'scans',
      'id, scan_type, target_url, status, created_at, updated_at, results',
      { user_id: userId },
      {
        limit,
        offset,
        orderBy: { column: 'created_at', ascending: false }
      }
    );
  },

  // Get user profile
  getUserProfile: async (userId: string) => {
    return CachedQueryBuilder.selectWithPagination(
      'profiles',
      '*',
      { user_id: userId },
      { limit: 1 }
    );
  },

  // Get recent trending searches
  getTrendingSearches: async (limit: number = 10) => {
    return CachedQueryBuilder.selectWithPagination(
      'trending_searches',
      '*',
      {},
      {
        limit,
        orderBy: { column: 'created_at', ascending: false }
      }
    );
  },

  // Get optimization scans for user
  getOptimizationScans: async (userId: string, limit: number = 10, offset: number = 0) => {
    return CachedQueryBuilder.selectWithPagination(
      'optimization_scans',
      '*',
      { user_id: userId },
      {
        limit,
        offset,
        orderBy: { column: 'created_at', ascending: false }
      }
    );
  },
};

// Cache statistics for monitoring
export const getCacheStats = () => ({
  size: queryCache.size(),
  // Add more stats as needed
});
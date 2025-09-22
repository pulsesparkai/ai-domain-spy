import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Type-safe table names
type TableName = keyof Database['public']['Tables'];

// Valid table names for strict typing
const VALID_TABLES: TableName[] = [
  'brand_profiles',
  'device_fingerprints', 
  'discover_analyses',
  'login_attempts',
  'optimization_scans',
  'profiles',
  'scans',
  'trending_searches',
  'user_security_settings',
  'user_sessions'
];

/**
 * Enhanced query cache with type safety and performance optimizations
 */
class QueryCacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private defaultTTL = 300000; // 5 minutes

  /**
   * Get cached data or fetch from Supabase
   */
  async get<T>(
    tableName: TableName,
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cacheKey = `${tableName}_${key}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    try {
      const data = await queryFn();
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl
      });
      return data;
    } catch (error) {
      // Return cached data if available, even if expired
      if (cached) {
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Invalidate cache for specific table or key
   */
  invalidate(tableName?: TableName, key?: string): void {
    if (!tableName) {
      this.cache.clear();
      return;
    }

    if (key) {
      this.cache.delete(`${tableName}_${key}`);
      return;
    }

    // Remove all entries for the table
    for (const cacheKey of this.cache.keys()) {
      if (cacheKey.startsWith(`${tableName}_`)) {
        this.cache.delete(cacheKey);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalEntries = this.cache.size;
    const expiredEntries = Array.from(this.cache.values()).filter(
      entry => Date.now() - entry.timestamp >= entry.ttl
    ).length;

    return {
      totalEntries,
      expiredEntries,
      activeEntries: totalEntries - expiredEntries
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global instance
export const queryCache = new QueryCacheManager();

/**
 * Type-safe query builder
 */
export class TypeSafeQueryBuilder {
  /**
   * Build a basic select query with caching
   */
  static async selectWithCache<T>(
    tableName: TableName,
    options: {
      select?: string;
      filters?: Record<string, any>;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
      cacheKey?: string;
      cacheTTL?: number;
    } = {}
  ): Promise<T[]> {
    const { select = '*', filters = {}, orderBy, limit, cacheKey, cacheTTL } = options;
    
    const key = cacheKey || `select_${JSON.stringify({ select, filters, orderBy, limit })}`;
    
    return queryCache.get(tableName, key, async () => {
      let query = supabase.from(tableName).select(select);

      // Apply filters
      Object.entries(filters).forEach(([column, value]) => {
        if (Array.isArray(value)) {
          query = query.in(column, value);
        } else if (value !== undefined && value !== null) {
          query = query.eq(column, value);
        }
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }, cacheTTL);
  }

  /**
   * Upsert data with cache invalidation
   */
  static async upsert<T>(
    tableName: TableName,
    data: any,
    options: {
      onConflict?: string;
      returning?: string;
    } = {}
  ): Promise<T[]> {
    const { onConflict, returning = '*' } = options;

    const query = supabase
      .from(tableName)
      .upsert(data, { onConflict })
      .select(returning);

    const { data: result, error } = await query;
    if (error) throw error;

    // Invalidate cache for this table
    queryCache.invalidate(tableName);

    return result || [];
  }

  /**
   * Update data with cache invalidation
   */
  static async update<T>(
    tableName: TableName,
    updates: any,
    filters: Record<string, any>,
    returning: string = '*'
  ): Promise<T[]> {
    let query = supabase.from(tableName).update(updates);

    // Apply filters
    Object.entries(filters).forEach(([column, value]) => {
      query = query.eq(column, value);
    });

    const { data, error } = await query.select(returning);
    if (error) throw error;

    // Invalidate cache for this table
    queryCache.invalidate(tableName);

    return data || [];
  }

  /**
   * Delete data with cache invalidation
   */
  static async delete(
    tableName: TableName,
    filters: Record<string, any>
  ): Promise<void> {
    let query = supabase.from(tableName).delete();

    // Apply filters
    Object.entries(filters).forEach(([column, value]) => {
      query = query.eq(column, value);
    });

    const { error } = await query;
    if (error) throw error;

    // Invalidate cache for this table
    queryCache.invalidate(tableName);
  }
}

// Cleanup expired cache entries every 5 minutes
setInterval(() => {
  queryCache.cleanup();
}, 300000);

export default queryCache;
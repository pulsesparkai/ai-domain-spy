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
 * Simplified query operations for scans
 */
export class SimpleQueryBuilder {
  /**
   * Get scans with caching
   */
  static async getScans(userId?: string): Promise<any[]> {
    const key = `scans_${userId || 'all'}`;
    
    return queryCache.get('scans', key, async () => {
      let query = supabase.from('scans').select('*');
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    });
  }

  /**
   * Insert scan and invalidate cache
   */
  static async insertScan(scanData: any): Promise<any> {
    const { data, error } = await supabase
      .from('scans')
      .insert(scanData)
      .select()
      .single();

    if (error) throw error;
    queryCache.invalidate('scans');
    return data;
  }

  /**
   * Update scan and invalidate cache
   */
  static async updateScan(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('scans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    queryCache.invalidate('scans');
    return data;
  }
}

// Cleanup expired cache entries every 5 minutes
setInterval(() => {
  queryCache.cleanup();
}, 300000);

export default queryCache;
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Type-safe table names
type TableName = keyof Database['public']['Tables'];

/**
 * Enhanced query cache with type safety
 * This replaces the problematic dynamic query cache
 */
class SafeQueryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private defaultTTL = 300000; // 5 minutes

  /**
   * Get cached data or fetch from Supabase with type safety
   */
  async get<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    try {
      const data = await queryFn();
      this.cache.set(key, {
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
   * Invalidate cache entries
   */
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
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
export const queryCache = new SafeQueryCache();

/**
 * Type-safe query helpers for specific tables
 */
export const QueryHelpers = {
  /**
   * Get user scans with caching
   */
  async getUserScans(userId: string): Promise<any[]> {
    return queryCache.get(
      `scans_user_${userId}`,
      async () => {
        const { data, error } = await supabase
          .from('scans')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      }
    );
  },

  /**
   * Get user profile with caching
   */
  async getUserProfile(userId: string): Promise<any> {
    return queryCache.get(
      `profile_${userId}`,
      async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;
        return data;
      }
    );
  },

  /**
   * Get brand profile with caching
   */
  async getBrandProfile(userId: string): Promise<any> {
    return queryCache.get(
      `brand_profile_${userId}`,
      async () => {
        const { data, error } = await supabase
          .from('brand_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;
        return data;
      }
    );
  },

  /**
   * Invalidate user-related caches
   */
  invalidateUserCache(userId: string): void {
    queryCache.invalidate(`user_${userId}`);
    queryCache.invalidate(`profile_${userId}`);
    queryCache.invalidate(`brand_profile_${userId}`);
    queryCache.invalidate(`scans_user_${userId}`);
  }
};

// Cache cleanup every 5 minutes
setInterval(() => {
  queryCache.cleanup();
}, 300000);

export default queryCache;
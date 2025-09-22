import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Type-safe table names from Database schema
type TableName = keyof Database['public']['Tables'];

/**
 * SQL Injection Prevention utilities
 * Provides type-safe database operations with built-in protection
 */

/**
 * Sanitize string inputs to prevent SQL injection
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove potentially dangerous characters
  return input
    .replace(/['"\\;]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comment start
    .replace(/\*\//g, '') // Remove block comment end
    .replace(/\bUNION\b/gi, '') // Remove UNION keywords
    .replace(/\bSELECT\b/gi, '') // Remove SELECT keywords
    .replace(/\bINSERT\b/gi, '') // Remove INSERT keywords
    .replace(/\bUPDATE\b/gi, '') // Remove UPDATE keywords
    .replace(/\bDELETE\b/gi, '') // Remove DELETE keywords
    .replace(/\bDROP\b/gi, '') // Remove DROP keywords
    .trim()
    .slice(0, 1000); // Limit length
}

/**
 * Validate and sanitize table name
 */
export function validateTableName(tableName: string): TableName | null {
  const validTables: TableName[] = [
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
  
  return validTables.includes(tableName as TableName) ? (tableName as TableName) : null;
}

/**
 * Type-safe database operations with SQL injection prevention
 */
export class SafeDatabaseOperations {
  /**
   * Safe select operation
   */
  static async safeSelect(
    tableName: TableName,
    options: {
      select?: string;
      filters?: Record<string, any>;
      limit?: number;
      orderBy?: { column: string; ascending?: boolean };
    } = {}
  ): Promise<any[]> {
    const { select = '*', filters = {}, limit, orderBy } = options;
    
    // Start with base query
    let query = supabase.from(tableName).select(select);
    
    // Apply filters safely
    Object.entries(filters).forEach(([column, value]) => {
      if (value !== undefined && value !== null) {
        // Sanitize column name
        const safeColumn = sanitizeString(column);
        if (safeColumn && safeColumn.length > 0) {
          if (Array.isArray(value)) {
            query = query.in(safeColumn, value);
          } else {
            query = query.eq(safeColumn, value);
          }
        }
      }
    });
    
    // Apply ordering
    if (orderBy?.column) {
      const safeColumn = sanitizeString(orderBy.column);
      if (safeColumn) {
        query = query.order(safeColumn, { ascending: orderBy.ascending ?? true });
      }
    }
    
    // Apply limit
    if (limit && typeof limit === 'number' && limit > 0 && limit <= 1000) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data || [];
  }

  /**
   * Safe insert operation
   */
  static async safeInsert(
    tableName: TableName,
    data: Record<string, any>
  ): Promise<any[]> {
    // Sanitize the data object
    const sanitizedData: Record<string, any> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      const safeKey = sanitizeString(key);
      if (safeKey && safeKey.length > 0) {
        if (typeof value === 'string') {
          sanitizedData[safeKey] = sanitizeString(value);
        } else {
          sanitizedData[safeKey] = value;
        }
      }
    });
    
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(sanitizedData)
      .select();
    
    if (error) throw error;
    return result || [];
  }

  /**
   * Safe update operation
   */
  static async safeUpdate(
    tableName: TableName,
    updates: Record<string, any>,
    filters: Record<string, any>
  ): Promise<any[]> {
    // Sanitize updates
    const sanitizedUpdates: Record<string, any> = {};
    Object.entries(updates).forEach(([key, value]) => {
      const safeKey = sanitizeString(key);
      if (safeKey && safeKey.length > 0) {
        if (typeof value === 'string') {
          sanitizedUpdates[safeKey] = sanitizeString(value);
        } else {
          sanitizedUpdates[safeKey] = value;
        }
      }
    });
    
    // Start with base query
    let query = supabase.from(tableName).update(sanitizedUpdates);
    
    // Apply filters safely
    Object.entries(filters).forEach(([column, value]) => {
      const safeColumn = sanitizeString(column);
      if (safeColumn && value !== undefined && value !== null) {
        query = query.eq(safeColumn, value);
      }
    });
    
    const { data, error } = await query.select();
    if (error) throw error;
    
    return data || [];
  }

  /**
   * Safe delete operation
   */
  static async safeDelete(
    tableName: TableName,
    filters: Record<string, any>
  ): Promise<void> {
    // Require at least one filter for safety
    if (!filters || Object.keys(filters).length === 0) {
      throw new Error('Delete operation requires at least one filter');
    }
    
    let query = supabase.from(tableName).delete();
    
    // Apply filters safely
    Object.entries(filters).forEach(([column, value]) => {
      const safeColumn = sanitizeString(column);
      if (safeColumn && value !== undefined && value !== null) {
        query = query.eq(safeColumn, value);
      }
    });
    
    const { error } = await query;
    if (error) throw error;
  }
}

/**
 * Input validation helpers
 */
export const InputValidation = {
  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate URL format
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validate UUID format
   */
  isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  /**
   * Validate scan type
   */
  isValidScanType(scanType: string): boolean {
    const validTypes = ['brand-monitoring', 'competitor-analysis', 'content-optimization', 'domain-ranking'];
    return validTypes.includes(scanType);
  },

  /**
   * Validate scan status
   */
  isValidScanStatus(status: string): boolean {
    const validStatuses = ['pending', 'running', 'completed', 'failed'];
    return validStatuses.includes(status);
  }
};

export default SafeDatabaseOperations;
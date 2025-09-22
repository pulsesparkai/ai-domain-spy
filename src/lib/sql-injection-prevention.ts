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
 * Simple database operations with SQL injection prevention
 */
export class SafeDatabaseOperations {
  /**
   * Safe select operation for scans table
   */
  static async selectScans(filters: Record<string, any> = {}): Promise<any[]> {
    let query = supabase.from('scans').select('*');
    
    Object.entries(filters).forEach(([column, value]) => {
      if (value !== undefined && value !== null) {
        if (column === 'user_id') {
          query = query.eq(column, value);
        }
      }
    });
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Safe insert for scans table
   */
  static async insertScan(data: {
    user_id: string;
    scan_type: string;
    target_url?: string;
    queries?: any[];
    results?: any;
    status?: string;
    citations?: any[];
    sentiment?: any;
    rankings?: any[];
    entities?: any[];
    analysis_log?: any[];
  }): Promise<any> {
    const { data: result, error } = await supabase
      .from('scans')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return result;
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
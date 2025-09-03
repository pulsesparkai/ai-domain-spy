import { supabase } from '@/integrations/supabase/client';

// Safe query builders for Supabase operations
export class SafeQueryBuilder {
  
  // Safe select with parameterized filtering
  static async safeSelect(
    table: string,
    columns: string = '*',
    filters?: Record<string, any>,
    options?: {
      limit?: number;
      offset?: number;
      order?: { column: string; ascending?: boolean };
    }
  ) {
    let query = supabase.from(table).select(columns);
    
    // Apply filters safely using Supabase's built-in parameterization
    if (filters) {
      Object.entries(filters).forEach(([column, value]) => {
        // Validate column name to prevent injection
        if (!this.isValidColumnName(column)) {
          throw new Error(`Invalid column name: ${column}`);
        }
        
        if (Array.isArray(value)) {
          query = query.in(column, value);
        } else if (value === null) {
          query = query.is(column, null);
        } else {
          query = query.eq(column, value);
        }
      });
    }
    
    // Apply pagination and ordering
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }
    
    if (options?.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
    }
    
    return query;
  }
  
  // Safe insert with data validation
  static async safeInsert(
    table: string,
    data: Record<string, any> | Record<string, any>[],
    options?: { onConflict?: string; upsert?: boolean }
  ) {
    // Validate and sanitize data
    const sanitizedData = Array.isArray(data) 
      ? data.map(item => this.sanitizeInsertData(item))
      : this.sanitizeInsertData(data);
    
    if (options?.upsert) {
      return supabase.from(table).upsert(sanitizedData);
    }
    
    return supabase.from(table).insert(sanitizedData);
  }
  
  // Safe update with parameterized conditions
  static async safeUpdate(
    table: string,
    data: Record<string, any>,
    conditions: Record<string, any>
  ) {
    // Validate and sanitize update data
    const sanitizedData = this.sanitizeUpdateData(data);
    
    let query = supabase.from(table).update(sanitizedData);
    
    // Apply conditions safely
    Object.entries(conditions).forEach(([column, value]) => {
      if (!this.isValidColumnName(column)) {
        throw new Error(`Invalid column name: ${column}`);
      }
      query = query.eq(column, value);
    });
    
    return query;
  }
  
  // Safe delete with parameterized conditions
  static async safeDelete(
    table: string,
    conditions: Record<string, any>
  ) {
    let query = supabase.from(table).delete();
    
    // Apply conditions safely
    Object.entries(conditions).forEach(([column, value]) => {
      if (!this.isValidColumnName(column)) {
        throw new Error(`Invalid column name: ${column}`);
      }
      query = query.eq(column, value);
    });
    
    return query;
  }
  
  // Validate column names to prevent injection
  private static isValidColumnName(columnName: string): boolean {
    // Only allow alphanumeric characters, underscores, and dots (for joins)
    const validPattern = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;
    return validPattern.test(columnName) && columnName.length <= 100;
  }
  
  // Sanitize data for insert operations
  private static sanitizeInsertData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (!this.isValidColumnName(key)) {
        throw new Error(`Invalid column name: ${key}`);
      }
      
      // Sanitize string values
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeStringValue(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? this.sanitizeStringValue(item) : item
        );
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }
  
  // Sanitize data for update operations
  private static sanitizeUpdateData(data: Record<string, any>): Record<string, any> {
    return this.sanitizeInsertData(data);
  }
  
  // Sanitize string values to prevent injection
  private static sanitizeStringValue(value: string): string {
    if (typeof value !== 'string') return value;
    
    // Remove or escape potentially dangerous characters
    return value
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/['"\\]/g, (char) => `\\${char}`) // Escape quotes and backslashes
      .trim()
      .substring(0, 10000); // Limit length
  }
}

// Pre-defined safe queries for common operations
export const SafeQueries = {
  // Get user profile safely
  getUserProfile: async (userId: string) => {
    return SafeQueryBuilder.safeSelect('profiles', '*', { user_id: userId });
  },
  
  // Get user scans safely
  getUserScans: async (userId: string, limit: number = 50, offset: number = 0) => {
    return SafeQueryBuilder.safeSelect(
      'scans', 
      '*', 
      { user_id: userId },
      { 
        limit, 
        offset, 
        order: { column: 'created_at', ascending: false } 
      }
    );
  },
  
  // Create scan safely
  createScan: async (scanData: {
    user_id: string;
    scan_type: string;
    target_url?: string;
    status?: string;
  }) => {
    return SafeQueryBuilder.safeInsert('scans', {
      ...scanData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  },
  
  // Update scan results safely
  updateScanResults: async (scanId: string, userId: string, results: any) => {
    return SafeQueryBuilder.safeUpdate(
      'scans',
      { 
        results,
        status: 'completed',
        updated_at: new Date().toISOString()
      },
      { id: scanId, user_id: userId }
    );
  },
  
  // Update user profile safely
  updateUserProfile: async (userId: string, profileData: Record<string, any>) => {
    return SafeQueryBuilder.safeUpdate(
      'profiles',
      {
        ...profileData,
        updated_at: new Date().toISOString()
      },
      { user_id: userId }
    );
  }
};

// Validate table and column names for dynamic queries
export const validateTableAccess = (tableName: string, operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'): boolean => {
  const allowedTables: Record<string, string[]> = {
    'profiles': ['SELECT', 'INSERT', 'UPDATE'],
    'scans': ['SELECT', 'INSERT', 'UPDATE'],
    // Add more tables as needed
  };
  
  return allowedTables[tableName]?.includes(operation) ?? false;
};
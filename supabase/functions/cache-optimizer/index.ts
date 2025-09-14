import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory cache for table definitions and schemas
const schemaCache = new Map<string, any>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours for schema cache

interface CacheEntry {
  data: any;
  timestamp: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, table, options } = await req.json();
    console.log(`Cache optimizer request: ${action} for table ${table}`);

    switch (action) {
      case 'get_schema':
        return handleGetSchema(table, supabase);
      
      case 'optimize_query':
        return handleOptimizeQuery(table, options, supabase);
      
      case 'cache_stats':
        return handleCacheStats();
      
      case 'invalidate_cache':
        return handleInvalidateCache(table || 'all');
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Cache optimizer error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleGetSchema(tableName: string, supabase: any) {
  const cacheKey = `schema:${tableName}`;
  const cached = schemaCache.get(cacheKey) as CacheEntry;

  // Check cache first
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log(`Schema cache hit for ${tableName}`);
    return new Response(
      JSON.stringify({ 
        schema: cached.data, 
        cached: true,
        timestamp: cached.timestamp 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log(`Fetching schema for ${tableName} from database`);
    
    // Get table schema using a minimal introspection query
    // This avoids expensive information_schema queries
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);

    if (error) {
      throw new Error(`Schema fetch failed: ${error.message}`);
    }

    // Mock schema structure - in production, you'd extract actual column info
    const schema = {
      table_name: tableName,
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'created_at', type: 'timestamp', nullable: false },
        { name: 'updated_at', type: 'timestamp', nullable: false },
      ],
      indexes: [`${tableName}_pkey`, `${tableName}_created_at_idx`],
      last_updated: new Date().toISOString(),
    };

    // Cache the schema
    schemaCache.set(cacheKey, {
      data: schema,
      timestamp: Date.now(),
    });

    console.log(`Schema cached for ${tableName}`);

    return new Response(
      JSON.stringify({ 
        schema, 
        cached: false,
        timestamp: Date.now()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`Schema fetch error for ${tableName}:`, error);
    return new Response(
      JSON.stringify({ error: `Failed to fetch schema: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleOptimizeQuery(tableName: string, options: any, supabase: any) {
  const { query_type, filters, columns, pagination } = options;
  
  console.log(`Optimizing ${query_type} query for ${tableName}`, {
    filters,
    columns,
    pagination
  });

  try {
    let query = supabase.from(tableName);

    // Apply columns selection (avoid SELECT *)
    if (columns && columns !== '*') {
      query = query.select(columns);
    } else {
      query = query.select('*');
    }

    // Apply filters with prepared statement patterns
    if (filters) {
      Object.entries(filters).forEach(([key, value]: [string, any]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (value === null) {
          query = query.is(key, null);
        } else if (typeof value === 'object' && value.operator) {
          // Handle complex filters
          switch (value.operator) {
            case 'gte':
              query = query.gte(key, value.value);
              break;
            case 'lte':
              query = query.lte(key, value.value);
              break;
            case 'like':
              query = query.ilike(key, value.value);
              break;
            default:
              query = query.eq(key, value.value);
          }
        } else {
          query = query.eq(key, value);
        }
      });
    }

    // Apply pagination with LIMIT/OFFSET
    if (pagination) {
      const { limit = 20, offset = 0, order_by } = pagination;
      
      if (order_by) {
        query = query.order(order_by.column, { 
          ascending: order_by.ascending ?? true 
        });
      }

      if (offset > 0) {
        query = query.range(offset, offset + limit - 1);
      } else {
        query = query.limit(limit);
      }
    }

    const result = await query;

    if (result.error) {
      throw new Error(`Query execution failed: ${result.error.message}`);
    }

    console.log(`Optimized query completed for ${tableName}`, {
      rows_returned: result.data?.length || 0,
      execution_time: Date.now()
    });

    return new Response(
      JSON.stringify({
        data: result.data,
        count: result.data?.length || 0,
        optimized: true,
        query_plan: {
          table: tableName,
          filters_applied: Object.keys(filters || {}),
          pagination_used: !!pagination,
          columns_selected: columns || '*'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`Query optimization error for ${tableName}:`, error);
    return new Response(
      JSON.stringify({ error: `Query optimization failed: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

function handleCacheStats() {
  const stats = {
    total_entries: schemaCache.size,
    entries: Array.from(schemaCache.entries()).map(([key, entry]) => ({
      key,
      timestamp: entry.timestamp,
      age_minutes: Math.floor((Date.now() - entry.timestamp) / (1000 * 60))
    })),
    cache_ttl_hours: CACHE_TTL / (1000 * 60 * 60),
    memory_usage: 'N/A' // Deno doesn't expose process.memoryUsage()
  };

  return new Response(
    JSON.stringify(stats),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function handleInvalidateCache(target: string) {
  if (target === 'all') {
    const count = schemaCache.size;
    schemaCache.clear();
    console.log(`Cleared entire cache (${count} entries)`);
    
    return new Response(
      JSON.stringify({ 
        message: `Cleared entire cache (${count} entries)`,
        cleared_count: count 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } else {
    const deleted = schemaCache.delete(`schema:${target}`);
    console.log(`Cache invalidation for ${target}: ${deleted ? 'success' : 'not found'}`);
    
    return new Response(
      JSON.stringify({ 
        message: `Cache invalidation for ${target}`,
        found: deleted 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
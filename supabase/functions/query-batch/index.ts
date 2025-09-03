// Connection pooling and query batching edge function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

interface QueryBatch {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete';
  queries: Array<{
    id: string;
    params: any;
    filters?: any;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { batches }: { batches: QueryBatch[] } = await req.json();

    // Input validation
    if (!Array.isArray(batches) || batches.length === 0) {
      throw new Error('Invalid batches format');
    }

    // Validate each batch
    for (const batch of batches) {
      if (!batch.table || typeof batch.table !== 'string') {
        throw new Error('Invalid table name');
      }
      if (!['select', 'insert', 'update'].includes(batch.operation)) {
        throw new Error('Invalid operation');
      }
      if (!Array.isArray(batch.queries)) {
        throw new Error('Invalid queries format');
      }
      
      // Validate table name against allowed tables
      const allowedTables = ['profiles', 'scans'];
      if (!allowedTables.includes(batch.table)) {
        throw new Error(`Table not allowed: ${batch.table}`);
      }
    }

    console.log(`Processing ${batches.length} validated query batches`);

    const results = await Promise.all(
      batches.map(async (batch) => {
        try {
          switch (batch.operation) {
            case 'select':
              return await processBatchSelect(supabase, batch);
            case 'insert':
              return await processBatchInsert(supabase, batch);
            case 'update':
              return await processBatchUpdate(supabase, batch);
            default:
              throw new Error(`Unsupported operation: ${batch.operation}`);
          }
        } catch (error) {
          console.error(`Batch operation failed for ${batch.table}:`, error);
          return {
            table: batch.table,
            success: false,
            error: error.message,
            results: [],
          };
        }
      })
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        batchCount: batches.length,
        timestamp: new Date().toISOString(),
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Query batch processing error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

async function processBatchSelect(supabase: any, batch: QueryBatch) {
  const { table, queries } = batch;
  
  // Group queries by similar filters to optimize
  const groupedQueries = groupQueriesByFilters(queries);
  
  const results = await Promise.all(
    groupedQueries.map(async (group) => {
      const { filterKey, values, originalQueries } = group;
      
      if (filterKey && values.length > 1) {
        // Use IN query for multiple values
        console.log(`Batch selecting from ${table} with IN clause`, { filterKey, valueCount: values.length });
        
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .in(filterKey, values);
          
        if (error) throw error;
        
        // Map results back to original query IDs
        return originalQueries.map(query => ({
          id: query.id,
          data: data?.filter((item: any) => 
            item[filterKey] === query.filters[filterKey]
          ) || [],
        }));
      } else {
        // Execute individual queries
        const individualResults = await Promise.all(
          originalQueries.map(async (query) => {
            let queryBuilder = supabase.from(table).select('*');
            
            // Apply filters
            if (query.filters) {
              Object.entries(query.filters).forEach(([key, value]) => {
                queryBuilder = queryBuilder.eq(key, value);
              });
            }
            
            const { data, error } = await queryBuilder;
            if (error) throw error;
            
            return { id: query.id, data: data || [] };
          })
        );
        
        return individualResults;
      }
    })
  );
  
  return {
    table,
    success: true,
    results: results.flat(),
  };
}

async function processBatchInsert(supabase: any, batch: QueryBatch) {
  const { table, queries } = batch;
  
  // Collect all data to insert
  const insertData = queries.map(query => query.params);
  
  console.log(`Batch inserting ${insertData.length} records into ${table}`);
  
  const { data, error } = await supabase
    .from(table)
    .insert(insertData)
    .select('*');
    
  if (error) throw error;
  
  return {
    table,
    success: true,
    results: queries.map((query, index) => ({
      id: query.id,
      data: data?.[index] || null,
    })),
  };
}

async function processBatchUpdate(supabase: any, batch: QueryBatch) {
  const { table, queries } = batch;
  
  console.log(`Batch updating ${queries.length} records in ${table}`);
  
  // Process updates individually for now (could be optimized further)
  const results = await Promise.all(
    queries.map(async (query) => {
      let queryBuilder = supabase
        .from(table)
        .update(query.params);
        
      // Apply filters
      if (query.filters) {
        Object.entries(query.filters).forEach(([key, value]) => {
          queryBuilder = queryBuilder.eq(key, value);
        });
      }
      
      const { data, error } = await queryBuilder.select('*');
      if (error) throw error;
      
      return { id: query.id, data: data || [] };
    })
  );
  
  return {
    table,
    success: true,
    results,
  };
}

function groupQueriesByFilters(queries: any[]) {
  const groups = new Map();
  
  queries.forEach(query => {
    if (!query.filters) {
      // No filters - group as individual
      const key = 'no-filters';
      if (!groups.has(key)) {
        groups.set(key, {
          filterKey: null,
          values: [],
          originalQueries: [],
        });
      }
      groups.get(key).originalQueries.push(query);
      return;
    }
    
    // Group by first filter key (could be made more sophisticated)
    const filterKey = Object.keys(query.filters)[0];
    const filterValue = query.filters[filterKey];
    
    if (!groups.has(filterKey)) {
      groups.set(filterKey, {
        filterKey,
        values: [],
        originalQueries: [],
      });
    }
    
    const group = groups.get(filterKey);
    if (!group.values.includes(filterValue)) {
      group.values.push(filterValue);
    }
    group.originalQueries.push(query);
  });
  
  return Array.from(groups.values());
}
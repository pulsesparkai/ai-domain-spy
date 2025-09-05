import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting monthly usage reset process...');

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Find profiles that need billing cycle reset (billing_cycle_start is older than 30 days)
    const { data: profiles, error: selectError } = await supabase
      .from('profiles')
      .select('user_id, email, billing_cycle_start, subscription_tier, monthly_scans_used')
      .lt('billing_cycle_start', thirtyDaysAgo)
      .not('subscription_tier', 'eq', 'free'); // Only reset for paying customers
    
    if (selectError) {
      console.error('Error fetching profiles:', selectError);
      throw selectError;
    }

    if (!profiles || profiles.length === 0) {
      console.log('No profiles found that need billing cycle reset');
      return new Response(JSON.stringify({ 
        message: 'No profiles found for reset',
        resetCount: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`Found ${profiles.length} profiles to reset`);

    // Reset monthly usage for each profile
    let resetCount = 0;
    for (const profile of profiles) {
      console.log(`Resetting usage for user: ${profile.email}`);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          monthly_scans_used: 0,
          billing_cycle_start: new Date().toISOString()
        })
        .eq('user_id', profile.user_id);

      if (updateError) {
        console.error(`Error updating profile ${profile.user_id}:`, updateError);
        continue; // Continue with other profiles even if one fails
      }

      resetCount++;
      console.log(`Successfully reset usage for ${profile.email} (was: ${profile.monthly_scans_used})`);
    }

    console.log(`Monthly usage reset complete. Reset ${resetCount} of ${profiles.length} profiles.`);

    return new Response(JSON.stringify({ 
      message: 'Monthly usage reset complete',
      resetCount: resetCount,
      totalProfiles: profiles.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in monthly usage reset:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to reset monthly usage',
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
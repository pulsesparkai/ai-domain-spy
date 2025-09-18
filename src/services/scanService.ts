import { supabase } from '@/integrations/supabase/client';

export const scanService = {
  async runScan(scanRequest: any) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');
    
    // Call backend analyze endpoint
    const response = await fetch('https://api.pulsespark.ai/api/analyze-website', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        url: scanRequest.targetUrl,
        userId: user.id,
        queries: scanRequest.queries || [],
        brandContext: scanRequest.options?.brandContext || null
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Scan failed');
    }
    
    const data = await response.json();
    
    // Add debug logging
    console.log('API Response:', data);
    
    // Save to database
    const { error: saveError } = await supabase
      .from('scans')
      .insert({
        user_id: user.id,
        scan_type: 'perplexity',
        target_url: scanRequest.targetUrl,
        queries: scanRequest.queries || [],
        results: data,
        status: 'completed'
      });
    
    if (saveError) console.error('Save error:', saveError);
    
    // Return the data directly instead of wrapping in results array
    return {
      scanId: crypto.randomUUID(),
      status: 'completed',
      ...data,  // Spread the actual API response data
      readinessScore: data.readinessScore || 0,
      citations: data.citations || [],
      platformPresence: data.platformPresence || {},
      entityAnalysis: data.entityAnalysis || {},
      contentAnalysis: data.contentAnalysis || {},
      recommendations: data.recommendations || []
    };
  }
};
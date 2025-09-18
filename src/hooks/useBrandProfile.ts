import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface BrandProfile {
  id: string;
  user_id: string;
  brand_name: string;
  brand_domain?: string;
  industry?: string;
  location?: string;
  description?: string;
  competitors?: string[];
  keywords?: string[];
  target_audience?: string;
  created_at: string;
  updated_at: string;
}

export interface BrandProfileInput {
  brand_name: string;
  brand_domain?: string;
  industry?: string;
  location?: string;
  description?: string;
  competitors?: string[];
  keywords?: string[];
  target_audience?: string;
}

export const useBrandProfile = () => {
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load brand profile on mount
  useEffect(() => {
    if (user) {
      loadBrandProfile();
    }
  }, [user]);

  const loadBrandProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      setBrandProfile(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load brand profile';
      setError(errorMessage);
      console.error('Error loading brand profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const createBrandProfile = async (profileData: BrandProfileInput): Promise<BrandProfile | null> => {
    if (!user) {
      toast({ 
        title: "Authentication required", 
        description: "Please log in to create a brand profile.",
        variant: "destructive" 
      });
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: createError } = await supabase
        .from('brand_profiles')
        .insert({
          user_id: user.id,
          ...profileData
        })
        .select()
        .single();

      if (createError) throw createError;

      setBrandProfile(data);
      toast({ 
        title: "Brand profile created", 
        description: "Your brand profile has been successfully created." 
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create brand profile';
      setError(errorMessage);
      toast({ 
        title: "Error creating profile", 
        description: errorMessage,
        variant: "destructive" 
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateBrandProfile = async (updates: Partial<BrandProfileInput>): Promise<BrandProfile | null> => {
    if (!user || !brandProfile) {
      toast({ 
        title: "Profile not found", 
        description: "No brand profile to update.",
        variant: "destructive" 
      });
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('brand_profiles')
        .update(updates)
        .eq('id', brandProfile.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setBrandProfile(data);
      toast({ 
        title: "Profile updated", 
        description: "Your brand profile has been successfully updated." 
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update brand profile';
      setError(errorMessage);
      toast({ 
        title: "Error updating profile", 
        description: errorMessage,
        variant: "destructive" 
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteBrandProfile = async (): Promise<boolean> => {
    if (!user || !brandProfile) {
      toast({ 
        title: "Profile not found", 
        description: "No brand profile to delete.",
        variant: "destructive" 
      });
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('brand_profiles')
        .delete()
        .eq('id', brandProfile.id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setBrandProfile(null);
      toast({ 
        title: "Profile deleted", 
        description: "Your brand profile has been successfully deleted." 
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete brand profile';
      setError(errorMessage);
      toast({ 
        title: "Error deleting profile", 
        description: errorMessage,
        variant: "destructive" 
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for intelligent auto-population
  const generateSmartQueries = (type: 'reputation' | 'competitor' | 'general' = 'general'): string[] => {
    if (!brandProfile) return [];

    const { brand_name, industry, competitors = [], location } = brandProfile;
    
    switch (type) {
      case 'reputation':
        return [
          `${brand_name} reviews`,
          `${brand_name} customer experience`,
          `${brand_name} testimonials`,
          ...(location ? [`${brand_name} ${location}`] : []),
          ...(industry ? [`best ${industry} companies`] : [])
        ].filter(Boolean);

      case 'competitor':
        return [
          ...competitors.slice(0, 3).map(comp => `${brand_name} vs ${comp}`),
          ...(industry ? [`${industry} comparison`, `top ${industry} tools`] : []),
          `${brand_name} alternatives`
        ].filter(Boolean);

      case 'general':
      default:
        return [
          brand_name,
          `${brand_name} features`,
          ...(industry ? [`${brand_name} ${industry}`] : []),
          ...(location ? [`${brand_name} ${location}`] : [])
        ].filter(Boolean);
    }
  };

  const getDefaultTargetUrl = (): string => {
    return brandProfile?.brand_domain || '';
  };

  const getBrandContext = () => {
    if (!brandProfile) return null;
    
    return {
      brand_name: brandProfile.brand_name,
      brand_domain: brandProfile.brand_domain,
      industry: brandProfile.industry,
      location: brandProfile.location,
      competitors: brandProfile.competitors || [],
      keywords: brandProfile.keywords || []
    };
  };

  const hasBrandProfile = !!brandProfile;

  return {
    // State
    brandProfile,
    loading,
    error,
    hasBrandProfile,

    // Actions
    loadBrandProfile,
    createBrandProfile,
    updateBrandProfile,
    deleteBrandProfile,

    // Smart helpers
    generateSmartQueries,
    getDefaultTargetUrl,
    getBrandContext
  };
};
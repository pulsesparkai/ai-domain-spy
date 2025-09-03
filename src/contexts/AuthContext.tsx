import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { EncryptionService, EncryptedData } from '@/lib/encryption';

// Extended User type - API keys now handled separately in profiles table
interface AppUser extends User {
  // Keep for backward compatibility, but API keys moved to encrypted profiles
}

interface ApiKeys {
  perplexity?: string;
  openai?: string;
  google_analytics?: string;
  screaming_frog?: string;
}

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  api_keys: any; // Legacy - being phased out
  encrypted_api_keys: Record<string, EncryptedData> | null;
  subscription_status: string;
  subscription_tier: string | null;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  profile: Profile | null;
  apiKeys: ApiKeys;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<Profile, 'encrypted_api_keys'>>) => Promise<void>;
  updateApiKeys: (apiKeys: Partial<ApiKeys>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  // Legacy method - deprecated
  updateUserMetadata: (metadata: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      // Ensure user-specific data: filter by auth.uid() = user_id
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      
      // Transform the data to match our Profile interface
      const profileData: Profile = {
        ...data,
        encrypted_api_keys: data.encrypted_api_keys ? 
          (typeof data.encrypted_api_keys === 'object' && !Array.isArray(data.encrypted_api_keys) ? 
            data.encrypted_api_keys as unknown as Record<string, EncryptedData> : 
            null) : 
          null
      };
      
      setProfile(profileData);

      // Decrypt API keys if they exist
      if (profileData.encrypted_api_keys && Object.keys(profileData.encrypted_api_keys).length > 0) {
        await decryptAndSetApiKeys(profileData.encrypted_api_keys, userId);
      } else {
        // Fallback to legacy api_keys if no encrypted keys exist
        if (data.api_keys && typeof data.api_keys === 'object') {
          setApiKeys(data.api_keys as ApiKeys);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const decryptAndSetApiKeys = async (
    encryptedKeys: Record<string, EncryptedData>, 
    userId: string
  ) => {
    try {
      if (!EncryptionService.isSupported()) {
        console.warn('Encryption not supported in this browser');
        return;
      }

      const sessionToken = session?.access_token;
      const decryptedKeys = await EncryptionService.decryptApiKeys(
        encryptedKeys, 
        userId, 
        sessionToken
      );
      setApiKeys(decryptedKeys);
    } catch (error) {
      console.error('Error decrypting API keys:', error);
      toast({
        title: "Error",
        description: "Failed to decrypt API keys. Please re-enter them.",
        variant: "destructive",
      });
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch to avoid deadlock
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setApiKeys({});
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setApiKeys({});
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
      setApiKeys({});
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateProfile = async (updates: Partial<Omit<Profile, 'encrypted_api_keys'>>) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await refreshProfile();
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateApiKeys = async (newApiKeys: Partial<ApiKeys>) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      if (!EncryptionService.isSupported()) {
        throw new Error('Encryption not supported in this browser');
      }

      // Merge with existing API keys
      const updatedKeys = { ...apiKeys, ...newApiKeys };
      
      // Filter out empty keys
      const keysToEncrypt = Object.fromEntries(
        Object.entries(updatedKeys).filter(([_, value]) => value && value.trim())
      );

      // Encrypt the API keys
      const sessionToken = session?.access_token;
      const encryptedKeys = await EncryptionService.encryptApiKeys(
        keysToEncrypt, 
        user.id, 
        sessionToken
      );

      // Update in database
      const { error } = await supabase
        .from('profiles')
        .update({ 
          encrypted_api_keys: encryptedKeys as any, // Cast to avoid type issues with Json
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Update local state
      setApiKeys(updatedKeys);
      
      toast({
        title: "API Keys updated",
        description: "Your API keys have been encrypted and stored securely.",
      });
    } catch (error) {
      console.error('Error updating API keys:', error);
      toast({
        title: "Error", 
        description: "Failed to update API keys. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Legacy method for backward compatibility
  const updateUserMetadata = async (metadata: any) => {
    console.warn('updateUserMetadata is deprecated. Use updateApiKeys for API keys or updateProfile for other data.');
    
    // If this contains API keys, redirect to the new method
    if (metadata.api_keys) {
      await updateApiKeys(metadata.api_keys);
      return;
    }
    
    // For other metadata, fall back to the old method
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user?.user_metadata,
          ...metadata
        }
      });
      
      if (error) throw error;
      
      setUser(prev => prev ? {
        ...prev,
        user_metadata: {
          ...prev.user_metadata,
          ...metadata
        }
      } : null);
    } catch (error) {
      console.error('Error updating user metadata:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    profile,
    apiKeys,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updateApiKeys,
    updateUserMetadata,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

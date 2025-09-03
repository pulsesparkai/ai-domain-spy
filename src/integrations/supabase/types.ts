export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      device_fingerprints: {
        Row: {
          created_at: string
          device_info: Json
          fingerprint_hash: string
          first_seen: string
          id: string
          is_trusted: boolean
          last_seen: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json
          fingerprint_hash: string
          first_seen?: string
          id?: string
          is_trusted?: boolean
          last_seen?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json
          fingerprint_hash?: string
          first_seen?: string
          id?: string
          is_trusted?: boolean
          last_seen?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempt_time: string
          email: string | null
          failure_reason: string | null
          fingerprint_hash: string | null
          id: string
          ip_address: unknown | null
          location_data: Json | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attempt_time?: string
          email?: string | null
          failure_reason?: string | null
          fingerprint_hash?: string | null
          id?: string
          ip_address?: unknown | null
          location_data?: Json | null
          success: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_time?: string
          email?: string | null
          failure_reason?: string | null
          fingerprint_hash?: string | null
          id?: string
          ip_address?: unknown | null
          location_data?: Json | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          api_keys: Json | null
          avatar_url: string | null
          created_at: string
          email: string
          encrypted_api_keys: Json | null
          full_name: string | null
          id: string
          stripe_customer_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_keys?: Json | null
          avatar_url?: string | null
          created_at?: string
          email: string
          encrypted_api_keys?: Json | null
          full_name?: string | null
          id?: string
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_keys?: Json | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          encrypted_api_keys?: Json | null
          full_name?: string | null
          id?: string
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scans: {
        Row: {
          created_at: string
          id: string
          results: Json | null
          scan_type: string
          status: string | null
          target_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          results?: Json | null
          scan_type: string
          status?: string | null
          target_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          results?: Json | null
          scan_type?: string
          status?: string | null
          target_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_security_settings: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          require_device_verification: boolean
          session_timeout_minutes: number
          suspicious_login_notifications: boolean
          totp_secret: string | null
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          require_device_verification?: boolean
          session_timeout_minutes?: number
          suspicious_login_notifications?: boolean
          totp_secret?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          require_device_verification?: boolean
          session_timeout_minutes?: number
          suspicious_login_notifications?: boolean
          totp_secret?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          fingerprint_hash: string | null
          id: string
          ip_address: unknown | null
          is_active: boolean
          last_activity: string
          session_token: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          fingerprint_hash?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          session_token: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          fingerprint_hash?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          session_token?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_encrypted_api_key: {
        Args: { key_name: string }
        Returns: undefined
      }
      get_encrypted_api_keys: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      refresh_table_stats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_encrypted_api_keys: {
        Args: { encrypted_value: string; key_name: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      author_styles: {
        Row: {
          active_years: string | null
          created_at: string
          id: string
          name: string
          nationality: string | null
          representative_works: string | null
          style_description: string
        }
        Insert: {
          active_years?: string | null
          created_at?: string
          id?: string
          name: string
          nationality?: string | null
          representative_works?: string | null
          style_description: string
        }
        Update: {
          active_years?: string | null
          created_at?: string
          id?: string
          name?: string
          nationality?: string | null
          representative_works?: string | null
          style_description?: string
        }
        Relationships: []
      }
      generation_series: {
        Row: {
          created_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_series_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_versions: {
        Row: {
          created_at: string
          generation_id: string
          id: string
          output_text: string
          version_number: number
        }
        Insert: {
          created_at?: string
          generation_id: string
          id?: string
          output_text: string
          version_number?: number
        }
        Update: {
          created_at?: string
          generation_id?: string
          id?: string
          output_text?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "generation_versions_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
        ]
      }
      generations: {
        Row: {
          author_style_id: string | null
          created_at: string
          doc_type: string
          id: string
          input_image_urls: Json
          input_text: string | null
          is_public: boolean
          language: string | null
          length: string | null
          narrative_type_id: string | null
          output_text: string | null
          part_number: number | null
          series_id: string | null
          style: string | null
          target_audience: string | null
          tokens_used: number | null
          tone: string | null
          user_id: string
        }
        Insert: {
          author_style_id?: string | null
          created_at?: string
          doc_type: string
          id?: string
          input_image_urls?: Json
          input_text?: string | null
          is_public?: boolean
          language?: string | null
          length?: string | null
          narrative_type_id?: string | null
          output_text?: string | null
          part_number?: number | null
          series_id?: string | null
          style?: string | null
          target_audience?: string | null
          tokens_used?: number | null
          tone?: string | null
          user_id: string
        }
        Update: {
          author_style_id?: string | null
          created_at?: string
          doc_type?: string
          id?: string
          input_image_urls?: Json
          input_text?: string | null
          is_public?: boolean
          language?: string | null
          length?: string | null
          narrative_type_id?: string | null
          output_text?: string | null
          part_number?: number | null
          series_id?: string | null
          style?: string | null
          target_audience?: string | null
          tokens_used?: number | null
          tone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generations_author_style_id_fkey"
            columns: ["author_style_id"]
            isOneToOne: false
            referencedRelation: "author_styles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_narrative_type_id_fkey"
            columns: ["narrative_type_id"]
            isOneToOne: false
            referencedRelation: "narrative_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "generation_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_types: {
        Row: {
          core_elements: string | null
          created_at: string
          definition: string
          example_genres: string | null
          id: string
          name: string
        }
        Insert: {
          core_elements?: string | null
          created_at?: string
          definition: string
          example_genres?: string | null
          id?: string
          name: string
        }
        Update: {
          core_elements?: string | null
          created_at?: string
          definition?: string
          example_genres?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          credits: number
          id: string
          referral_code: string
          referred_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits?: number
          id: string
          referral_code: string
          referred_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          referral_code?: string
          referred_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          created_at: string
          doc_type: string | null
          id: string
          is_public: boolean
          length: string | null
          prompt_text: string | null
          style: string | null
          target_audience: string | null
          title: string
          tone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type?: string | null
          id?: string
          is_public?: boolean
          length?: string | null
          prompt_text?: string | null
          style?: string | null
          target_audience?: string | null
          title: string
          tone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string | null
          id?: string
          is_public?: boolean
          length?: string | null
          prompt_text?: string | null
          style?: string | null
          target_audience?: string | null
          title?: string
          tone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_usage: {
        Row: {
          created_at: string
          id: string
          ip_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          action: string
          created_at: string
          credits_charged: number
          generation_id: string | null
          id: string
          tokens_used: number
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          credits_charged?: number
          generation_id?: string | null
          id?: string
          tokens_used?: number
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          credits_charged?: number
          generation_id?: string | null
          id?: string
          tokens_used?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_referral: { Args: { p_referral_code: string }; Returns: Json }
      claim_trial: { Args: { p_ip_hash: string }; Returns: Json }
      record_generation: {
        Args: {
          p_author_style_id?: string
          p_doc_type: string
          p_input_image_urls: Json
          p_input_text: string
          p_language: string
          p_length: string
          p_narrative_type_id?: string
          p_output_text: string
          p_part_number?: number
          p_series_id?: string
          p_style: string
          p_target_audience: string
          p_tokens_used: number
          p_tone: string
        }
        Returns: {
          generation_id: string
          remaining_credits: number
        }[]
      }
      record_generation_version: {
        Args: {
          p_action?: string
          p_generation_id: string
          p_output_text: string
        }
        Returns: {
          remaining_credits: number
          version_id: string
        }[]
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

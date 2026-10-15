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
    PostgrestVersion: "14.18"
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
      daily_checkins: {
        Row: {
          bowel: string | null
          created_at: string
          date: string
          energy: number | null
          hunger: number | null
          id: string
          libido: number | null
          mood: number | null
          note: string | null
          rhr: number | null
          sleep: number | null
          temp_c: number | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          bowel?: string | null
          created_at?: string
          date: string
          energy?: number | null
          hunger?: number | null
          id?: string
          libido?: number | null
          mood?: number | null
          note?: string | null
          rhr?: number | null
          sleep?: number | null
          temp_c?: number | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Update: {
          bowel?: string | null
          created_at?: string
          date?: string
          energy?: number | null
          hunger?: number | null
          id?: string
          libido?: number | null
          mood?: number | null
          note?: string | null
          rhr?: number | null
          sleep?: number | null
          temp_c?: number | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      day_overrides: {
        Row: {
          created_at: string
          date: string
          day_type: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          day_type: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          date?: string
          day_type?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_notes: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          note: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          note?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          note?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_notes_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          equipment: string | null
          id: string
          is_custom: boolean
          muscle_groups: string[]
          name_en: string | null
          name_ja: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          equipment?: string | null
          id?: string
          is_custom?: boolean
          muscle_groups?: string[]
          name_en?: string | null
          name_ja: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          equipment?: string | null
          id?: string
          is_custom?: boolean
          muscle_groups?: string[]
          name_en?: string | null
          name_ja?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      foods: {
        Row: {
          carb_g: number
          created_at: string
          fat_g: number
          fiber_g: number | null
          id: string
          is_cooked: boolean
          kcal: number
          name: string
          protein_g: number
          sodium_mg: number | null
          source: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          carb_g?: number
          created_at?: string
          fat_g?: number
          fiber_g?: number | null
          id?: string
          is_cooked?: boolean
          kcal: number
          name: string
          protein_g?: number
          sodium_mg?: number | null
          source?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          carb_g?: number
          created_at?: string
          fat_g?: number
          fiber_g?: number | null
          id?: string
          is_cooked?: boolean
          kcal?: number
          name?: string
          protein_g?: number
          sodium_mg?: number | null
          source?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      meal_log_items: {
        Row: {
          created_at: string
          food_id: string
          grams: number
          id: string
          meal_log_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          food_id: string
          grams: number
          id?: string
          meal_log_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          food_id?: string
          grams?: number
          id?: string
          meal_log_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_log_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_log_items_meal_log_id_fkey"
            columns: ["meal_log_id", "user_id"]
            isOneToOne: false
            referencedRelation: "meal_logs"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          slot: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          slot: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          slot?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_template_items: {
        Row: {
          created_at: string
          food_id: string
          grams: number
          id: string
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          food_id: string
          grams: number
          id?: string
          template_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          food_id?: string
          grams?: number
          id?: string
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_template_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_template_items_template_id_fkey"
            columns: ["template_id", "user_id"]
            isOneToOne: false
            referencedRelation: "meal_templates"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      meal_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          order_idx: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_idx?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_idx?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_targets: {
        Row: {
          carb_g: number
          created_at: string
          day_type: string
          effective_from: string
          fat_g: number
          id: string
          kcal: number
          protein_g: number
          updated_at: string
          user_id: string
        }
        Insert: {
          carb_g: number
          created_at?: string
          day_type: string
          effective_from: string
          fat_g: number
          id?: string
          kcal: number
          protein_g: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          carb_g?: number
          created_at?: string
          day_type?: string
          effective_from?: string
          fat_g?: number
          id?: string
          kcal?: number
          protein_g?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pantry_items: {
        Row: {
          created_at: string
          expires_on: string | null
          food_id: string
          grams_available: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_on?: string | null
          food_id: string
          grams_available: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          expires_on?: string | null
          food_id?: string
          grams_available?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pantry_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      preps: {
        Row: {
          contest_date: string
          contest_name: string
          created_at: string
          id: string
          is_active: boolean
          reverse_plan: Json | null
          start_date: string
          start_weight_kg: number
          target_weight_kg: number
          updated_at: string
          user_id: string
          weekly_rate_pct: number
          why_text: string | null
        }
        Insert: {
          contest_date: string
          contest_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          reverse_plan?: Json | null
          start_date?: string
          start_weight_kg: number
          target_weight_kg: number
          updated_at?: string
          user_id?: string
          weekly_rate_pct: number
          why_text?: string | null
        }
        Update: {
          contest_date?: string
          contest_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          reverse_plan?: Json | null
          start_date?: string
          start_weight_kg?: number
          target_weight_kg?: number
          updated_at?: string
          user_id?: string
          weekly_rate_pct?: number
          why_text?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          height_cm: number | null
          meal_slots: string[]
          onboarded_at: string | null
          sex: string | null
          track_libido: boolean
          unit_pref: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          height_cm?: number | null
          meal_slots?: string[]
          onboarded_at?: string | null
          sex?: string | null
          track_libido?: boolean
          unit_pref?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          height_cm?: number | null
          meal_slots?: string[]
          onboarded_at?: string | null
          sex?: string | null
          track_libido?: boolean
          unit_pref?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      routine_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          order_idx: number
          rest_sec: number | null
          routine_id: string
          target_reps: number | null
          target_rir: number | null
          target_sets: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          order_idx?: number
          rest_sec?: number | null
          routine_id: string
          target_reps?: number | null
          target_rir?: number | null
          target_sets?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          order_idx?: number
          rest_sec?: number | null
          routine_id?: string
          target_reps?: number | null
          target_rir?: number | null
          target_sets?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_exercises_routine_id_fkey"
            columns: ["routine_id", "user_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      routines: {
        Row: {
          created_at: string
          id: string
          name: string
          order_idx: number
          updated_at: string
          user_id: string
          weekdays: number[]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_idx?: number
          updated_at?: string
          user_id?: string
          weekdays?: number[]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_idx?: number
          updated_at?: string
          user_id?: string
          weekdays?: number[]
        }
        Relationships: []
      }
      weekly_checkins: {
        Row: {
          created_at: string
          hooper_fatigue: number | null
          hooper_sleep: number | null
          hooper_soreness: number | null
          hooper_stress: number | null
          id: string
          photo_ids: string[]
          updated_at: string
          user_id: string
          waist_cm: number | null
          week_start: string
        }
        Insert: {
          created_at?: string
          hooper_fatigue?: number | null
          hooper_sleep?: number | null
          hooper_soreness?: number | null
          hooper_stress?: number | null
          id?: string
          photo_ids?: string[]
          updated_at?: string
          user_id?: string
          waist_cm?: number | null
          week_start: string
        }
        Update: {
          created_at?: string
          hooper_fatigue?: number | null
          hooper_sleep?: number | null
          hooper_soreness?: number | null
          hooper_stress?: number | null
          id?: string
          photo_ids?: string[]
          updated_at?: string
          user_id?: string
          waist_cm?: number | null
          week_start?: string
        }
        Relationships: []
      }
      workout_sets: {
        Row: {
          created_at: string
          done_at: string | null
          exercise_id: string
          id: string
          is_pr: boolean
          reps: number | null
          rir: number | null
          set_no: number
          set_type: string
          updated_at: string
          user_id: string
          weight_kg: number | null
          workout_id: string
        }
        Insert: {
          created_at?: string
          done_at?: string | null
          exercise_id: string
          id?: string
          is_pr?: boolean
          reps?: number | null
          rir?: number | null
          set_no: number
          set_type?: string
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
          workout_id: string
        }
        Update: {
          created_at?: string
          done_at?: string | null
          exercise_id?: string
          id?: string
          is_pr?: boolean
          reps?: number | null
          rir?: number | null
          set_no?: number
          set_type?: string
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_workout_id_fkey"
            columns: ["workout_id", "user_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          joint: number | null
          load_feel: number | null
          pump: number | null
          routine_id: string | null
          soreness: number | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          joint?: number | null
          load_feel?: number | null
          pump?: number | null
          routine_id?: string | null
          soreness?: number | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          joint?: number | null
          load_feel?: number | null
          pump?: number | null
          routine_id?: string | null
          soreness?: number | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_routine_id_fkey"
            columns: ["routine_id", "user_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
    }
    Views: {
      v_weekly_report: {
        Row: {
          avg_hunger: number | null
          avg_kcal: number | null
          avg_mood: number | null
          avg_sleep: number | null
          avg_weight: number | null
          delta_kg: number | null
          total_sets: number | null
          user_id: string | null
          week_start: string | null
        }
        Relationships: []
      }
      v_weekly_volume: {
        Row: {
          muscle_group: string | null
          sets: number | null
          user_id: string | null
          week_start: string | null
        }
        Relationships: []
      }
      v_weight_trend: {
        Row: {
          date: string | null
          trend_kg: number | null
          user_id: string | null
          weight_kg: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

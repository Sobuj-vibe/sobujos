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
  public: {
    Tables: {
      finance_budgets: {
        Row: {
          amount_limit: number
          category_id: string
          created_at: string
          currency: Database["public"]["Enums"]["finance_currency"]
          id: string
          month: string
          user_id: string
        }
        Insert: {
          amount_limit: number
          category_id: string
          created_at?: string
          currency?: Database["public"]["Enums"]["finance_currency"]
          id?: string
          month: string
          user_id: string
        }
        Update: {
          amount_limit?: number
          category_id?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["finance_currency"]
          id?: string
          month?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          kind: Database["public"]["Enums"]["finance_kind"]
          name: string
          position: number
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          kind: Database["public"]["Enums"]["finance_kind"]
          name: string
          position?: number
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          kind?: Database["public"]["Enums"]["finance_kind"]
          name?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      finance_loans: {
        Row: {
          amount: number
          created_at: string
          currency: Database["public"]["Enums"]["finance_currency"]
          direction: Database["public"]["Enums"]["loan_direction"]
          expected_return_date: string | null
          id: string
          loan_date: string
          note: string | null
          paid_at: string | null
          person_name: string
          reason: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: Database["public"]["Enums"]["finance_currency"]
          direction: Database["public"]["Enums"]["loan_direction"]
          expected_return_date?: string | null
          id?: string
          loan_date?: string
          note?: string | null
          paid_at?: string | null
          person_name: string
          reason?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["finance_currency"]
          direction?: Database["public"]["Enums"]["loan_direction"]
          expected_return_date?: string | null
          id?: string
          loan_date?: string
          note?: string | null
          paid_at?: string | null
          person_name?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      finance_recurring: {
        Row: {
          amount: number
          auto_post: boolean
          category_id: string | null
          created_at: string
          currency: Database["public"]["Enums"]["finance_currency"]
          frequency: Database["public"]["Enums"]["recurring_frequency"]
          id: string
          kind: Database["public"]["Enums"]["finance_kind"]
          logo_url: string | null
          next_renewal_date: string
          note: string | null
          payment_method: string | null
          service_name: string
          start_date: string
          user_id: string
        }
        Insert: {
          amount: number
          auto_post?: boolean
          category_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["finance_currency"]
          frequency?: Database["public"]["Enums"]["recurring_frequency"]
          id?: string
          kind: Database["public"]["Enums"]["finance_kind"]
          logo_url?: string | null
          next_renewal_date: string
          note?: string | null
          payment_method?: string | null
          service_name: string
          start_date?: string
          user_id: string
        }
        Update: {
          amount?: number
          auto_post?: boolean
          category_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["finance_currency"]
          frequency?: Database["public"]["Enums"]["recurring_frequency"]
          id?: string
          kind?: Database["public"]["Enums"]["finance_kind"]
          logo_url?: string | null
          next_renewal_date?: string
          note?: string | null
          payment_method?: string | null
          service_name?: string
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_recurring_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_settings: {
        Row: {
          created_at: string
          fx_bdt_per_cny: number
          fx_usd_per_cny: number
          id: string
          primary_currency: Database["public"]["Enums"]["finance_currency"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fx_bdt_per_cny?: number
          fx_usd_per_cny?: number
          id?: string
          primary_currency?: Database["public"]["Enums"]["finance_currency"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fx_bdt_per_cny?: number
          fx_usd_per_cny?: number
          id?: string
          primary_currency?: Database["public"]["Enums"]["finance_currency"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
          position: number
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
          position?: number
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          position?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          currency: Database["public"]["Enums"]["finance_currency"]
          id: string
          kind: Database["public"]["Enums"]["finance_kind"]
          note: string | null
          occurred_at: string
          pay_for: string | null
          payment_method: string | null
          receipt_url: string | null
          recurring_id: string | null
          subcategory_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["finance_currency"]
          id?: string
          kind: Database["public"]["Enums"]["finance_kind"]
          note?: string | null
          occurred_at?: string
          pay_for?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          recurring_id?: string | null
          subcategory_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["finance_currency"]
          id?: string
          kind?: Database["public"]["Enums"]["finance_kind"]
          note?: string | null
          occurred_at?: string
          pay_for?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          recurring_id?: string | null
          subcategory_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "finance_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      hadith_daily: {
        Row: {
          created_at: string
          date: string
          id: string
          reference: string
          text_bn: string
          text_en: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          reference: string
          text_bn: string
          text_en: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          reference?: string
          text_bn?: string
          text_en?: string
          user_id?: string
        }
        Relationships: []
      }
      prayer_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          made_up_at: string | null
          prayer: Database["public"]["Enums"]["prayer_name"]
          status: Database["public"]["Enums"]["prayer_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          made_up_at?: string | null
          prayer: Database["public"]["Enums"]["prayer_name"]
          status: Database["public"]["Enums"]["prayer_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          made_up_at?: string | null
          prayer?: Database["public"]["Enums"]["prayer_name"]
          status?: Database["public"]["Enums"]["prayer_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          language: string
          location: string | null
          theme: string
          theme_color: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          language?: string
          location?: string | null
          theme?: string
          theme_color?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          language?: string
          location?: string | null
          theme?: string
          theme_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      quran_logs: {
        Row: {
          ayat_from: number
          ayat_to: number | null
          created_at: string
          date: string
          id: string
          note: string | null
          surah_name: string
          surah_number: number
          user_id: string
        }
        Insert: {
          ayat_from: number
          ayat_to?: number | null
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          surah_name: string
          surah_number: number
          user_id: string
        }
        Update: {
          ayat_from?: number
          ayat_to?: number | null
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          surah_name?: string
          surah_number?: number
          user_id?: string
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          position: number
          task_id: string
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          position?: number
          task_id: string
          title: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          position?: number
          task_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasbih_counters: {
        Row: {
          count: number
          created_at: string
          id: string
          name: string
          target: number
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          id?: string
          name: string
          target?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          id?: string
          name?: string
          target?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_groups: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name: string
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          due_date: string | null
          group_id: string
          id: string
          notes: string | null
          position: number
          priority: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          group_id: string
          id?: string
          notes?: string | null
          position?: number
          priority?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          group_id?: string
          id?: string
          notes?: string | null
          position?: number
          priority?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "task_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      finance_currency: "BDT" | "CNY" | "USD"
      finance_kind: "income" | "expense"
      loan_direction: "taken" | "given"
      prayer_name: "fajr" | "dhuhr" | "asr" | "maghrib" | "isha"
      prayer_status: "on_time" | "late" | "qaza"
      recurring_frequency: "daily" | "weekly" | "monthly" | "yearly"
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
    Enums: {
      app_role: ["admin", "user"],
      finance_currency: ["BDT", "CNY", "USD"],
      finance_kind: ["income", "expense"],
      loan_direction: ["taken", "given"],
      prayer_name: ["fajr", "dhuhr", "asr", "maghrib", "isha"],
      prayer_status: ["on_time", "late", "qaza"],
      recurring_frequency: ["daily", "weekly", "monthly", "yearly"],
    },
  },
} as const

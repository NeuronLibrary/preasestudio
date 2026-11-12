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
  public: {
    Tables: {
      categories: {
        Row: {
          id: number
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id?: number
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: number
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          color_name: string
          id: number
          image_path: string | null
          line_total: number
          order_id: string
          product_id: number | null
          product_name: string
          quantity: number
          size: string
          unit_price: number
          variant_id: number | null
        }
        Insert: {
          color_name: string
          id?: number
          image_path?: string | null
          line_total: number
          order_id: string
          product_id?: number | null
          product_name: string
          quantity: number
          size: string
          unit_price: number
          variant_id?: number | null
        }
        Update: {
          color_name?: string
          id?: number
          image_path?: string | null
          line_total?: number
          order_id?: string
          product_id?: number | null
          product_name?: string
          quantity?: number
          size?: string
          unit_price?: number
          variant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          city: string
          created_at: string
          customer_email: string
          customer_name: string
          customer_whatsapp: string
          discount_amount: number
          id: string
          invoice_number: string
          payment_method_name: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          postal_code: string
          province: string
          shipping_address: string
          shipping_cost: number
          shipping_method_name: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_number: string | null
          user_id: string
          voucher_code: string | null
        }
        Insert: {
          city: string
          created_at?: string
          customer_email: string
          customer_name: string
          customer_whatsapp: string
          discount_amount?: number
          id?: string
          invoice_number: string
          payment_method_name: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          postal_code: string
          province: string
          shipping_address: string
          shipping_cost: number
          shipping_method_name: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_number?: string | null
          user_id: string
          voucher_code?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_whatsapp?: string
          discount_amount?: number
          id?: string
          invoice_number?: string
          payment_method_name?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          postal_code?: string
          province?: string
          shipping_address?: string
          shipping_cost?: number
          shipping_method_name?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          tracking_number?: string | null
          user_id?: string
          voucher_code?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_name: string | null
          account_number: string | null
          code: string
          description: string | null
          id: number
          is_active: boolean
          name: string
          sort_order: number
          type: Database["public"]["Enums"]["payment_type"]
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          code: string
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          sort_order?: number
          type: Database["public"]["Enums"]["payment_type"]
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          code?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          sort_order?: number
          type?: Database["public"]["Enums"]["payment_type"]
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_id: number
          product_id: number
        }
        Insert: {
          category_id: number
          product_id: number
        }
        Update: {
          category_id?: number
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          id: number
          image_path: string
          product_id: number
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          id?: number
          image_path: string
          product_id: number
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          id?: number
          image_path?: string
          product_id?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color_hex: string
          color_name: string
          id: number
          product_id: number
          size: string
          sku: string
          stock: number
        }
        Insert: {
          color_hex: string
          color_name: string
          id?: number
          product_id: number
          size: string
          sku: string
          stock?: number
        }
        Update: {
          color_hex?: string
          color_name?: string
          id?: number
          product_id?: number
          size?: string
          sku?: string
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          is_featured: boolean
          name: string
          price: number
          rating_avg: number
          review_count: number
          slug: string
          tag: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          is_featured?: boolean
          name: string
          price: number
          rating_avg?: number
          review_count?: number
          slug: string
          tag?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price?: number
          rating_avg?: number
          review_count?: number
          slug?: string
          tag?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
      shipping_methods: {
        Row: {
          cost: number
          description: string | null
          id: number
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          cost: number
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          cost?: number
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          address: string | null
          email: string | null
          id: number
          instagram: string | null
          operating_hours: string | null
          stat_cities: number | null
          stat_collections: number | null
          stat_exchange_days: number | null
          stat_satisfaction: number | null
          store_name: string
          tagline: string | null
          tiktok: string | null
          twitter: string | null
          whatsapp_number: string
        }
        Insert: {
          address?: string | null
          email?: string | null
          id?: number
          instagram?: string | null
          operating_hours?: string | null
          stat_cities?: number | null
          stat_collections?: number | null
          stat_exchange_days?: number | null
          stat_satisfaction?: number | null
          store_name: string
          tagline?: string | null
          tiktok?: string | null
          twitter?: string | null
          whatsapp_number: string
        }
        Update: {
          address?: string | null
          email?: string | null
          id?: number
          instagram?: string | null
          operating_hours?: string | null
          stat_cities?: number | null
          stat_collections?: number | null
          stat_exchange_days?: number | null
          stat_satisfaction?: number | null
          store_name?: string
          tagline?: string | null
          tiktok?: string | null
          twitter?: string | null
          whatsapp_number?: string
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          code: string
          description: string | null
          discount_percent: number
          is_active: boolean
          min_purchase: number
          valid_until: string | null
        }
        Insert: {
          code: string
          description?: string | null
          discount_percent: number
          is_active?: boolean
          min_purchase?: number
          valid_until?: string | null
        }
        Update: {
          code?: string
          description?: string | null
          discount_percent?: number
          is_active?: boolean
          min_purchase?: number
          valid_until?: string | null
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          product_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_dashboard_stats: { Args: never; Returns: Json }
      create_order: {
        Args: {
          p_address: string
          p_city: string
          p_customer_name: string
          p_email: string
          p_items: Json
          p_payment_method_id: number
          p_postal_code: string
          p_province: string
          p_shipping_method_id: number
          p_voucher_code: string
          p_whatsapp: string
        }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      validate_voucher: {
        Args: { p_code: string; p_subtotal: number }
        Returns: {
          discount_amount: number
          discount_percent: number
          message: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      order_status: "dikemas" | "dikirim" | "tiba"
      payment_status: "menunggu_verifikasi" | "terverifikasi"
      payment_type: "bank_transfer" | "ewallet" | "cod"
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
  public: {
    Enums: {
      order_status: ["dikemas", "dikirim", "tiba"],
      payment_status: ["menunggu_verifikasi", "terverifikasi"],
      payment_type: ["bank_transfer", "ewallet", "cod"],
    },
  },
} as const
